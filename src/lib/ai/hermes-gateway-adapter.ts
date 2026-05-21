/**
 * Scholar's Tea — Hermes Gateway 适配器
 *
 * 为 Workshop 提供调用 Hermes Gateway（含 107+ skills）的能力。
 * 核心设计：渐进式接入，不改现有 Workshop 行为。
 *
 * 提供两种调用模式：
 * - callHermesGateway: 非流式（action 路由）
 * - callHermesGatewayStream: 流式（chat 路由）
 */

import { type ChatMessage, stripThinkBlocks } from './claude-service'
import { createThinkStrippingStream } from './stream-think-filter'
import { PAPER_GENERATION_SYSTEM_PROMPT } from './paper-generation-prompts'
import {
  PEER_REVIEW_SYSTEM_PROMPT,
  PEER_REVIEW_JSON_SYSTEM_PROMPT,
  buildPeerReviewJsonPrompt,
  parsePeerReviewJson,
  type PeerReviewResult,
} from './peer-review-prompts'
import {
  GRANT_APPLICATION_SYSTEM_PROMPT,
  GRANT_APPLICATION_JSON_SYSTEM_PROMPT,
  buildGrantApplicationJsonPrompt,
  parseGrantApplicationJson,
  type GrantApplicationResult,
} from './grant-application-prompts'

const HERMES_API_URL = process.env.HERMES_API_URL || 'http://127.0.0.1:8642/v1/chat/completions'
const API_SERVER_KEY = process.env.API_SERVER_KEY || 'hk-e4f9a45f3106ee1396164e6dae60137f9f08c0805d75b137404097cc4bdbedac'

/** 调用选项 */
export interface HermesGatewayOptions {
  /** 指定 skill 名称（如 "research-paper-writing", "arxiv"） */
  skill?: string
  /** 人格（如 "professor", "analyst", "technical"） */
  personality?: string
  /** Hermes 会话持久化 ID */
  sessionId?: string
  /** 超时时间（毫秒），默认 60000 */
  timeout?: number
  /** 最大 token 数 */
  maxTokens?: number
  /** 温度 */
  temperature?: number
  /** 是否流式 */
  stream?: boolean
}

/** Hermes Gateway 默认超时（毫秒）—— 必须小于 frp 隧道超时，保留 fallback 时间 */
const HERMES_DEFAULT_TIMEOUT = 30_000

/** 非流式响应 */
export interface HermesGatewayResponse {
  content: string
  error?: string
  /** Gateway 返回的原始数据（调试用） */
  raw?: unknown
}

/** 流式响应 */
export type HermesGatewayStreamResponse = ReadableStream | { error: string }

// =============================================================================
// 工具函数
// =============================================================================

/** 构建带 skill 指令的 system prompt */
function buildSystemPrompt(personality: string | undefined, skill: string | undefined): string {
  // Gateway 自身已有极长的系统提示（~10K tokens），保持 system prompt 极简
  // 仅注入 personality + skill 切换指令，避免 token 爆炸导致超时
  const parts: string[] = []

  if (skill) {
    parts.push(`[Skill Mode: ${skill}]`)
  }
  if (personality) {
    const personaMap: Record<string, string> = {
      professor: 'You are a rigorous university professor. Provide detailed, evidence-based explanations with references.',
      analyst: 'You are a data-driven analyst. Prioritize facts, structure output with evidence and numbered lists.',
      technical: 'You are a technical expert. Use precise terminology, concise explanations, and code/examples where relevant.',
      teacher: 'You are a patient teacher. Explain step-by-step with examples and analogies.',
      creative: 'You are a creative researcher. Think outside the box and propose innovative angles.',
      critic: 'You are a sharp but fair critic. Identify flaws precisely and suggest concrete improvements.',
      kawaii: 'You are a kawaii assistant! Use cute expressions and be enthusiastic~',
      helpful: 'You are a helpful, friendly AI assistant.',
      concise: 'You are a concise assistant. Keep responses brief and to the point.',
      hacker: 'You are an elite hacker. Speak in concise technical terms, no fluff.',
      warrior: 'You are a disciplined warrior. Cut to the chase with forceful brevity.',
    }
    parts.push(personaMap[personality] || `Adopt the "${personality}" persona.`)
  }

  return parts.join('\n')
}

/** 将 ChatMessage 转换为 Hermes Gateway 消息格式 */
function normalizeMessages(messages: ChatMessage[]): Array<{
  role: 'user' | 'assistant' | 'system'
  content: string
}> {
  return messages.map((m) => {
    let content: string
    if (typeof m.content === 'string') {
      content = m.content
    } else {
      // 多模态消息：提取文本部分，忽略图片（Hermes Gateway 目前不支持多模态）
      content = m.content
        .filter((block) => block.type === 'text')
        .map((block) => ('text' in block ? block.text : ''))
        .filter(Boolean)
        .join('\n')
    }
    return { role: m.role, content }
  })
}

/** 带超时的 fetch */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

// =============================================================================
// 非流式调用
// =============================================================================

/**
 * 调用 Hermes Gateway（非流式）
 *
 * @param messages 对话消息
 * @param options 调用选项
 * @returns 响应内容或错误
 */
export async function callHermesGateway(
  messages: ChatMessage[],
  options: HermesGatewayOptions = {}
): Promise<HermesGatewayResponse> {
  const { skill, personality, sessionId, timeout = HERMES_DEFAULT_TIMEOUT, maxTokens = 4096, temperature = 0.7 } = options

  try {
    const normalized = normalizeMessages(messages)
    const systemPrompt = buildSystemPrompt(personality, skill)

    // 只在 system prompt 非空时添加，避免 Gateway 已有长系统提示的情况下 token 爆炸
    const enrichedMessages =
      normalized.some((m) => m.role === 'system') || !systemPrompt
        ? normalized
        : [{ role: 'system' as const, content: systemPrompt }, ...normalized]

    // 内存优化：限制历史消息数
    const MAX_HISTORY = 24
    const finalMessages =
      enrichedMessages.length > MAX_HISTORY + 1
        ? [enrichedMessages[0], ...enrichedMessages.slice(-MAX_HISTORY)]
        : enrichedMessages

    // 截断过长内容
    const MAX_LENGTH = 6000
    const truncatedMessages = finalMessages.map((m) => ({
      ...m,
      content:
        m.content.length > MAX_LENGTH
          ? m.content.slice(0, MAX_LENGTH) + '\n...[内容过长，已截断]'
          : m.content,
    }))

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_SERVER_KEY}`,
    }
    if (sessionId) {
      headers['X-Hermes-Session-Id'] = sessionId
    }

    const response = await fetchWithTimeout(
      HERMES_API_URL,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'hermes-agent',
          messages: truncatedMessages,
          stream: false,
          max_tokens: maxTokens,
          temperature,
        }),
      },
      timeout
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[HermesAdapter] Gateway error:', response.status, errorText)
      return {
        content: '',
        error: `Hermes Gateway 错误 (${response.status}): ${errorText.slice(0, 200)}`,
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    return {
      content: stripThinkBlocks(content),
      raw: data,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    console.error('[HermesAdapter] Error:', message)
    return {
      content: '',
      error: `Hermes Gateway 调用失败: ${message}`,
    }
  }
}

// =============================================================================
// 流式调用
// =============================================================================

/**
 * 调用 Hermes Gateway（流式 SSE）
 *
 * @param messages 对话消息
 * @param options 调用选项
 * @returns ReadableStream 或错误对象
 */
export async function callHermesGatewayStream(
  messages: ChatMessage[],
  options: HermesGatewayOptions = {}
): Promise<HermesGatewayStreamResponse> {
  const { skill, personality, sessionId, timeout = HERMES_DEFAULT_TIMEOUT, maxTokens = 4096, temperature = 0.7 } = options

  try {
    const normalized = normalizeMessages(messages)
    const systemPrompt = buildSystemPrompt(personality, skill)

    const enrichedMessages = normalized.some((m) => m.role === 'system')
      ? normalized
      : [{ role: 'system' as const, content: systemPrompt }, ...normalized]

    const MAX_HISTORY = 24
    const finalMessages =
      enrichedMessages.length > MAX_HISTORY + 1
        ? [enrichedMessages[0], ...enrichedMessages.slice(-MAX_HISTORY)]
        : enrichedMessages

    const MAX_LENGTH = 6000
    const truncatedMessages = finalMessages.map((m) => ({
      ...m,
      content:
        m.content.length > MAX_LENGTH
          ? m.content.slice(0, MAX_LENGTH) + '\n...[内容过长，已截断]'
          : m.content,
    }))

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_SERVER_KEY}`,
    }
    if (sessionId) {
      headers['X-Hermes-Session-Id'] = sessionId
    }

    const response = await fetchWithTimeout(
      HERMES_API_URL,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'hermes-agent',
          messages: truncatedMessages,
          stream: true,
          max_tokens: maxTokens,
          temperature,
        }),
      },
      timeout
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[HermesAdapter] Stream error:', response.status, errorText)
      return { error: `Hermes Gateway 流式错误 (${response.status})` }
    }

    if (!response.body) {
      return { error: 'Hermes Gateway 返回空响应' }
    }

    // Node.js 环境下需要将 Node Readable 转换为 Web ReadableStream
    let stream: ReadableStream
    if (typeof window === 'undefined' && typeof (response.body as any).getReader !== 'function') {
      const { ReadableStream } = require('stream/web')
      const nodeStream = response.body as unknown as import('stream').Readable
      stream = new ReadableStream({
        start(controller: ReadableStreamDefaultController) {
          nodeStream.on('data', (chunk) => controller.enqueue(chunk))
          nodeStream.on('end', () => controller.close())
          nodeStream.on('error', (err) => controller.error(err))
        },
      })
    } else {
      stream = response.body
    }

    // 实时过滤 think 标签
    return stream.pipeThrough(createThinkStrippingStream())
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    console.error('[HermesAdapter] Stream error:', message)
    return { error: `Hermes Gateway 流式调用失败: ${message}` }
  }
}

// =============================================================================
// 便捷封装：Workshop 三大核心模式
// =============================================================================

/** 论文生成模式：调用 research-paper-writing skill */
export async function generatePaperViaHermes(
  params: {
    topic: string
    stage?: 'proposal' | 'structure' | 'writing' | 'data' | 'formatting'
    background?: string
    section?: string
    wordCount?: number
    content?: string
    dataDescription?: string
    analysisGoal?: string
    format?: 'latex' | 'markdown' | 'plain'
    stream?: boolean
  }
): Promise<{ content?: string; stream?: ReadableStream; error?: string }> {
  const { topic, stage = 'proposal', background, section, wordCount, content, dataDescription, analysisGoal, format, stream } = params

  const stageDescriptions: Record<string, string> = {
    proposal: '选题立项：基于知识背景材料，原创生成开题报告框架',
    structure: '架构规划：基于知识背景材料，原创设计论文结构',
    writing: '正文写作：基于知识背景材料，分段原创生成学术文本',
    data: '数据/图表：统计方法建议和图表描述',
    formatting: '综合输出：基于知识背景材料进行原创学术写作，输出为指定格式',
  }

  // 分阶段 temperature：创意阶段略高，格式/数据阶段更低以确保确定性
  const stageTemperature: Record<string, number> = {
    proposal: 0.7,
    structure: 0.7,
    writing: 0.6,
    data: 0.3,
    formatting: 0.3,
  }
  const temperature = stageTemperature[stage] ?? 0.6

  let stagePrompt = `【Paper Generation — Stage: ${stage}】${stageDescriptions[stage]}

Topic: ${topic}
${background ? `Background: ${background}\n` : ''}
${section ? `Section: ${section}\n` : ''}
${wordCount ? `Target length: ~${wordCount} words\n` : ''}
${dataDescription ? `Data Description: ${dataDescription}\n` : ''}
${analysisGoal ? `Analysis Goal: ${analysisGoal}\n` : ''}
${format ? `Output Format: ${format.toUpperCase()} (YOU MUST OUTPUT ONLY THIS FORMAT)\n` : ''}`

  if (content) {
    if (stage === 'formatting') {
      stagePrompt += `\n【知识背景材料】\n${content.slice(0, 8000)}\n\n【任务】基于上述材料进行原创学术写作，并输出为 ${format?.toUpperCase() || '指定'} 格式。\n\n【关键区分】\n你必须首先判断材料是"用户自己撰写的论文内容"还是"外部参考资料（如已发表的 PDF 论文）"：\n\n**情况A：用户自己撰写的论文内容**\n- 特征：内容来自前序阶段的 AI 原创输出，或用户自己写的论文草稿\n- 你的任务：保持核心论点和章节结构，转换为 ${format?.toUpperCase() || '指定'} 格式，进行语言润色和格式规范化\n\n**情况B：外部参考资料（如上传的 PDF 文献）**\n- 特征：内容是已发表的论文或综述，包含作者信息、摘要、完整的章节、参考文献等\n- 你的任务：**绝对禁止直接复制或轻微改写原文。** 你必须先理解材料中的核心知识和研究方法，然后合上材料（mentally），基于自己的理解进行完全原创的写作。输出必须是全新的学术论述，使用完全不同的句式、词汇、结构和论证角度。如果原文是综述，你的输出必须是研究论文（有具体的研究问题、方法、结果），而不是另一篇综述。\n\n【强制约束】\n- 你只能输出 ${format?.toUpperCase() || '指定'} 一种格式\n- 禁止输出其他格式\n- 禁止用占位符代替实际内容\n- 严禁直接照抄参考资料原文`
    } else {
      stagePrompt += `\n【知识背景材料】\n${content.slice(0, 4000)}\n\n【重要提醒】\n上述材料仅是你的知识来源，不是需要重写的文本。基于你对材料的理解（而非材料的文字），进行原创性学术写作，生成高质量的学术论文内容。禁止复述、禁止镜像结构、禁止保留原文格式痕迹。`
    }
  }

  stagePrompt += `\nGenerate top-tier academic text with [REF-N] citations. Use [CITATION NEEDED] for unverified claims. Avoid fabricating references.`

  if (stage === 'formatting') {
    stagePrompt += `\n\n【格式特例】本阶段为综合输出阶段，允许使用 LaTeX 语法（$...$ 和 $$...$$）输出数学公式，以符合 ${format?.toUpperCase() || '指定'} 格式规范。`
  } else {
    stagePrompt += `\n\nImportant: Mathematical formulas must use UTF-8 Unicode symbols (e.g., α, β, Σ, ∫, ℝ, ≤, →) instead of LaTeX ($...$ or $$...$$).`
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: PAPER_GENERATION_SYSTEM_PROMPT },
    { role: 'user', content: stagePrompt },
  ]

  if (stream) {
    const result = await callHermesGatewayStream(messages, {
      skill: 'research-paper-writing',
      personality: 'professor',
      timeout: 180_000,
      maxTokens: 2048,
      temperature,
    })
    if ('error' in result) {
      return { error: result.error }
    }
    return { stream: result }
  }

  const result = await callHermesGateway(messages, {
    skill: 'research-paper-writing',
    personality: 'professor',
    timeout: 120_000,
    maxTokens: 4096,
    temperature,
  })

  if (result.error) {
    return { error: result.error }
  }
  return { content: stripThinkBlocks(result.content) }
}

/** AI 审稿模式：调用 peer-review skill */
export async function peerReviewViaHermes(
  paperContent: string,
  focus?: string,
  stream?: boolean,
  structured?: boolean
): Promise<{ content?: string; structured?: PeerReviewResult; stream?: ReadableStream; error?: string }> {
  // 结构化模式不支持流式（JSON 需要完整输出才能解析）
  const isStructured = structured && !stream

  const reviewPrompt = isStructured
    ? buildPeerReviewJsonPrompt(paperContent, focus)
    : `【AI 审稿任务】

请对以下论文进行严格的同行评审。根据论文主题和内容，自动匹配最适合的评审标准：
- 自然科学/工程类：参考 Nature、Science、IEEE、ACM 等标准
- 社会科学类：参考领域顶级期刊（如 ASR、AER、APSR 等）的评审框架
- 人文艺术类：参考该学科权威期刊的学术规范
- 医学/生命科学类：参考 Lancet、NEJM、JAMA 等标准

${focus ? `【审稿重点】${focus}\n` : ''}

【待审论文】
${paperContent.slice(0, 30000)}

【评审维度】
1. 原创性 (Novelty) — 研究问题是否新颖？与现有工作的区分是否明确？
2. 方法论 (Methodology) — 实验设计是否合理？是否可复现？
3. 结果可靠性 (Soundness) — 数据是否支撑结论？统计显著性是否充分？
4. 写作质量 (Writing) — 结构、逻辑、语言是否达到顶刊标准？
5. 引用规范 (References) — 参考文献是否完整、相关、准确？

【输出格式】
总体评分：X/10

优点：
- ...

主要问题（按优先级排序）：
1. [问题描述] → [具体修改建议]
2. ...

修改建议：
- P0（必须修改）：...
- P1（强烈建议）：...
- P2（可选优化）：...

最终建议：Accept / Minor Revision / Major Revision / Reject（附理由）

注意：
- 检查论文中的引用是否真实（作者、年份、标题是否匹配）
- 对可疑引用标注 [CITATION CHECK NEEDED]`

  const messages: ChatMessage[] = [
    { role: 'system', content: isStructured ? PEER_REVIEW_JSON_SYSTEM_PROMPT : PEER_REVIEW_SYSTEM_PROMPT },
    { role: 'user', content: reviewPrompt },
  ]

  if (stream) {
    const result = await callHermesGatewayStream(messages, {
      skill: 'research-paper-writing',
      personality: 'analyst',
      timeout: 120000,
      maxTokens: 2048,
      temperature: 0.4,
    })
    if ('error' in result) {
      return { error: result.error }
    }
    return { stream: result }
  }

  const result = await callHermesGateway(messages, {
    skill: 'research-paper-writing',
    personality: 'analyst',
    timeout: isStructured ? 120_000 : 20_000,
    maxTokens: isStructured ? 4096 : 2048,
    temperature: 0.4,
  })

  if (result.error) {
    return { error: result.error }
  }

  const content = stripThinkBlocks(result.content)

  // 结构化模式：尝试解析 JSON
  if (isStructured) {
    const parsed = parsePeerReviewJson(content)
    if (parsed) {
      return { content, structured: parsed }
    }
    // JSON 解析失败，fallback 返回纯文本
    console.warn('[peerReviewViaHermes] Structured parse failed, returning raw text')
  }

  return { content }
}

/** 文献综述模式：调用 research-paper-writing skill */
export async function surveyGenerationViaHermes(
  topic: string,
  context?: string,
  stream?: boolean
): Promise<{ content?: string; stream?: ReadableStream; error?: string }> {
  const surveyPrompt = `【文献综述辅助任务】

你是一位文献综述专家，擅长梳理研究脉络、比较方法论、发现研究空白。

综述主题：${topic}

${context ? `相关信息：\n${context}\n` : ''}

请帮我生成这个研究领域的文献综述框架，包括：

1. 研究背景与发展历史
   - 从宏观到微观的逻辑递进
   - 关键里程碑工作和转折点

2. 现有方法的分类与比较
   - 按方法论或时间线组织
   - 批判性比较不同方法的优缺点

3. 关键里程碑工作
   - 识别领域内的奠基性论文
   - 标注真实引用 [REF-N]

4. 当前挑战与开放问题
   - 分析研究空白
   - 指出方法论局限

5. 未来研究方向
   - 基于现有 gap 提出 3-5 个潜在方向

注意：
- 引用的文献必须是真实存在的
- 不要编造作者、年份或论文标题
- 如果不确定某个引用，使用 [CITATION NEEDED] 标记`

  const messages: ChatMessage[] = [{ role: 'user', content: surveyPrompt }]

  if (stream) {
    const result = await callHermesGatewayStream(messages, {
      skill: 'research-paper-writing',
      personality: 'analyst',
      timeout: 120000,
      maxTokens: 4096,
      temperature: 0.6,
    })
    if ('error' in result) {
      return { error: result.error }
    }
    return { stream: result }
  }

  const result = await callHermesGateway(messages, {
    skill: 'research-paper-writing',
    personality: 'analyst',
    timeout: 20_000,
    maxTokens: 4096,
    temperature: 0.6,
  })

  if (result.error) {
    return { error: result.error }
  }
  return { content: stripThinkBlocks(result.content) }
}

/** 论文分析模式：调用 research-paper-writing skill */
export async function analyzePaperViaHermes(
  paperContent: string,
  stream?: boolean
): Promise<{ content?: string; stream?: ReadableStream; error?: string }> {
  const analyzePrompt = `【学术论文分析任务】

你是一位资深学术编辑和审稿人，拥有丰富的论文评审经验。

请对以下学术论文进行深入分析，返回结构化的评审意见：

【待分析论文】
${paperContent.slice(0, 8000)}

【分析维度】
1. 摘要与关键词
   - 摘要是否准确概括了研究内容？
   - 关键词选择是否恰当？

2. 研究问题与创新点
   - 研究问题是否明确？
   - 创新点是否有足够支撑？

3. 方法论评估
   - 实验设计是否合理？
   - 数据处理方法是否恰当？

4. 结果与讨论
   - 结果是否充分支撑结论？
   - 讨论是否深入？

5. 写作质量
   - 结构是否清晰？
   - 语言表达是否准确？

6. 改进建议
   - 列出 3-5 条具体、可操作的修改建议

注意：
- 保持客观、建设性的态度
- 建议要具体，避免空泛评价
- 如果论文内容不完整，基于已有内容分析`

  const messages: ChatMessage[] = [{ role: 'user', content: analyzePrompt }]

  if (stream) {
    const result = await callHermesGatewayStream(messages, {
      skill: 'research-paper-writing',
      personality: 'analyst',
      timeout: 120000,
      maxTokens: 4096,
      temperature: 0.5,
    })
    if ('error' in result) {
      return { error: result.error }
    }
    return { stream: result }
  }

  const result = await callHermesGateway(messages, {
    skill: 'research-paper-writing',
    personality: 'analyst',
    timeout: 120000,
    maxTokens: 4096,
    temperature: 0.5,
  })

  if (result.error) {
    return { error: result.error }
  }
  return { content: stripThinkBlocks(result.content) }
}

/** 基金申请模式：调用 grant-application skill */
export async function grantApplicationViaHermes(
  topic: string,
  context?: string,
  stream?: boolean,
  structured?: boolean
): Promise<{ content?: string; structured?: GrantApplicationResult; stream?: ReadableStream; error?: string }> {
  // 结构化模式不支持流式
  const isStructured = structured && !stream

  const grantPrompt = isStructured
    ? buildGrantApplicationJsonPrompt(topic, context)
    : `【科研项目申请书辅助】

你是一位科研项目申请专家，熟悉国家自然科学基金（NSFC）、科技部重点研发计划、各省自然科学基金等各类科研项目的申请流程和评审标准。

研究题目：${topic}

${context ? `背景信息：\n${context}\n` : ''}

请帮我完成以下内容：

1. 立项依据的撰写框架
   - 从宏观到微观的逻辑递进
   - 引用真实文献支撑（使用 [REF-N] 标注）
   - 明确研究 gap

2. 研究内容的层次结构
   - 科学问题 → 研究内容 → 技术路线
   - 每个研究内容需说明：目标、方法、预期结果

3. 创新点的提炼和表达
   - 每条创新点包含：创新内容 + 技术支撑 + 预期效果
   - 避免空泛，要有具体支撑

4. 研究基础与条件的展示建议
   - 如何展示团队能力和前期积累

5. 预期成果的合理性和可考核性
   - 论文、专利、数据集、开源代码等

注意：
- 引用的文献必须是真实存在的
- 不要编造基金评审结果或专家评价
- 如果不确定某个引用，使用 [CITATION NEEDED] 标记`

  const messages: ChatMessage[] = [
    { role: 'system', content: isStructured ? GRANT_APPLICATION_JSON_SYSTEM_PROMPT : GRANT_APPLICATION_SYSTEM_PROMPT },
    { role: 'user', content: grantPrompt },
  ]

  if (stream) {
    const result = await callHermesGatewayStream(messages, {
      skill: 'research-paper-writing',
      personality: 'professor',
      timeout: 120000,
      maxTokens: 2048,
      temperature: 0.5,
    })
    if ('error' in result) {
      return { error: result.error }
    }
    return { stream: result }
  }

  const result = await callHermesGateway(messages, {
    skill: 'research-paper-writing',
    personality: 'professor',
    timeout: isStructured ? 120_000 : 20_000,
    maxTokens: isStructured ? 4096 : 2048,
    temperature: 0.5,
  })

  if (result.error) {
    return { error: result.error }
  }

  const content = stripThinkBlocks(result.content)

  // 结构化模式：尝试解析 JSON
  if (isStructured) {
    const parsed = parseGrantApplicationJson(content)
    if (parsed) {
      return { content, structured: parsed }
    }
    console.warn('[grantApplicationViaHermes] Structured parse failed, returning raw text')
  }

  return { content }
}
