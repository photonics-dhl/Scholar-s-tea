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

import type { ChatMessage } from './claude-service'

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
  const base = `你是 Scholar's Tea 学术社区的 AI 研究助手，专注于高质量学术写作、论文审稿和科研规划。

【核心能力】
- 精准识别研究空白和创新机会
- 设计严谨的实验方案和技术路线
- 撰写符合顶会/顶刊标准的学术文本
- 提供可操作的审稿意见和改进建议
- 辅助科研项目申请和基金规划

【写作风格】
1. 遵循 IMRAD 结构：Introduction → Methods → Results → Discussion
2. 每段必须有主题句 + 支撑论据 + 过渡句
3. 方法部分被动语态，其余部分主动语态优先
4. 首次出现缩写必须全称
5. 所有结论必须有数据或引用支撑
6. 使用 UTF-8 字符表达数学公式（α β γ δ ε θ λ μ ν π ρ σ τ φ χ ψ ω Σ Π ∫ ∂ ∇ √ ² ³ 等），禁止使用 LaTeX 命令格式

【引用规范】
- 关键论点标注引用占位符 [REF-N]
- 经典方法引用原始文献
- 近期工作引用近3-5年顶会/顶刊
- 无法验证的引用标注 [CITATION NEEDED]
- 每个主要章节至少3-5个引用占位符

【公式输出规范】绝对禁止使用 LaTeX 格式（如 \\( ... \\)、\\[ ... \\]、$...$、$$...$$ 或 \\nu、\\sigma 等命令）。直接使用 UTF-8 字符在文本中表达。`

  const skillPrompt = skill
    ? `\n\n【当前任务】你正在执行 "${skill}" skill。请严格按照该 skill 的工作流和检查清单执行。`
    : ''

  const personalityPrompt = personality
    ? `\n\n【当前人格】${personality}。请以该人格的风格和专长领域回答问题。`
    : ''

  return base + skillPrompt + personalityPrompt
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
  const { skill, personality, sessionId, timeout = 60000, maxTokens = 4096, temperature = 0.7 } = options

  try {
    const normalized = normalizeMessages(messages)
    const systemPrompt = buildSystemPrompt(personality, skill)

    // 确保 system prompt 存在
    const enrichedMessages = normalized.some((m) => m.role === 'system')
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
      content,
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
  const { skill, personality, sessionId, timeout = 60000, maxTokens = 4096, temperature = 0.7 } = options

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
    if (typeof window === 'undefined' && typeof (response.body as any).getReader !== 'function') {
      const { ReadableStream } = require('stream/web')
      const nodeStream = response.body as unknown as import('stream').Readable
      return new ReadableStream({
        start(controller: ReadableStreamDefaultController) {
          nodeStream.on('data', (chunk) => controller.enqueue(chunk))
          nodeStream.on('end', () => controller.close())
          nodeStream.on('error', (err) => controller.error(err))
        },
      })
    }

    return response.body
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
    stream?: boolean
  }
): Promise<{ content?: string; stream?: ReadableStream; error?: string }> {
  const { topic, stage = 'proposal', background, section, wordCount, content, stream } = params

  const stageDescriptions: Record<string, string> = {
    proposal: '选题立项：生成开题报告框架，明确研究问题和创新点',
    structure: '架构规划：设计论文结构，规划章节和图表',
    writing: '正文写作：分段生成学术文本，保持严谨风格',
    data: '数据/图表：统计方法建议和图表描述',
    formatting: '排版交付：转换为 LaTeX / Markdown / 纯文本',
  }

  const stagePrompt = `【论文生成任务】当前阶段：${stage} — ${stageDescriptions[stage]}

研究主题：${topic}
${background ? `研究背景：${background}\n` : ''}
${section ? `目标章节：${section}\n` : ''}
${wordCount ? `目标字数：${wordCount}字\n` : ''}
${content ? `已有内容/上下文：\n${content.slice(0, 2000)}\n` : ''}

请按照 research-paper-writing skill 的规范执行：
1. 先进行文献调研（如有必要，使用 arXiv 搜索）
2. 基于真实文献构建论证框架
3. 生成符合顶刊标准的学术文本
4. 标注引用占位符 [REF-N]
5. 自检：每个段落是否有主题句？论证是否充分？引用是否真实？

注意：
- 引用的文献必须是你已知或能通过搜索验证的真实文献
- 不要编造不存在的论文标题或作者
- 如果不确定某个引用，使用 [CITATION NEEDED] 标记`

  const messages: ChatMessage[] = [{ role: 'user', content: stagePrompt }]

  if (stream) {
    const result = await callHermesGatewayStream(messages, {
      skill: 'research-paper-writing',
      personality: 'professor',
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
    personality: 'professor',
    timeout: 120000,
    maxTokens: 4096,
    temperature: 0.6,
  })

  if (result.error) {
    return { error: result.error }
  }
  return { content: result.content }
}

/** AI 审稿模式：调用 peer-review skill */
export async function peerReviewViaHermes(
  paperContent: string,
  focus?: string,
  stream?: boolean
): Promise<{ content?: string; stream?: ReadableStream; error?: string }> {
  const reviewPrompt = `【AI 审稿任务】

请对以下论文进行严格的同行评审，模拟顶级期刊（Nature、Science、NeurIPS、ICML、ACL）审稿人的视角。

${focus ? `【审稿重点】${focus}\n` : ''}

【待审论文】
${paperContent.slice(0, 12000)}

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

  const messages: ChatMessage[] = [{ role: 'user', content: reviewPrompt }]

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
  return { content: result.content }
}

/** 基金申请模式：调用 grant-application skill */
export async function grantApplicationViaHermes(
  topic: string,
  context?: string,
  stream?: boolean
): Promise<{ content?: string; stream?: ReadableStream; error?: string }> {
  const grantPrompt = `【科研项目申请书辅助】

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

  const messages: ChatMessage[] = [{ role: 'user', content: grantPrompt }]

  if (stream) {
    const result = await callHermesGatewayStream(messages, {
      skill: 'research-paper-writing',
      personality: 'professor',
      timeout: 120000,
      maxTokens: 4096,
      temperature: 0.7,
    })
    if ('error' in result) {
      return { error: result.error }
    }
    return { stream: result }
  }

  const result = await callHermesGateway(messages, {
    skill: 'research-paper-writing',
    personality: 'professor',
    timeout: 120000,
    maxTokens: 4096,
    temperature: 0.7,
  })

  if (result.error) {
    return { error: result.error }
  }
  return { content: result.content }
}
