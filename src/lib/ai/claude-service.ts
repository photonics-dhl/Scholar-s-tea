import { createThinkStrippingStream } from './stream-think-filter'
import { prisma } from '@/lib/db/prisma';
import nodeFetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { chatWithZAI, chatWithZAIStream, callZAIVision } from './zai-service';

// Proxy support for server-side fetch
let _fetch: typeof fetch = fetch;
let _agent: any = undefined;
if (typeof window === 'undefined') {
  const proxyUrl = process.env.http_proxy || process.env.https_proxy || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  if (proxyUrl) {
    _fetch = (nodeFetch as any).default || nodeFetch;
    _agent = new HttpsProxyAgent(proxyUrl);
}
}

/**
 * 清理 AI 返回的 JSON 字符串中的非法控制字符
 * 某些模型会在响应中注入未转义的控制字符（如 \x00-\x08, \x0B, \x0C, \x0E-\x1F）
 * 这些字符会导致 JSON.parse 抛出 "Bad control character" 错误
 */
function sanitizeControlChars(text: string): string {
  // 移除 JSON 字符串中非法的未转义控制字符
  // 保留合法字符：\t(0x09), \n(0x0A), \r(0x0D) 以及在转义序列中的字符
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
}

/**
 * 安全地解析可能包含非法控制字符的 JSON
 */
function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text)
  } catch (e) {
    if (e instanceof SyntaxError && e.message.includes('control character')) {
      const cleaned = sanitizeControlChars(text)
      return JSON.parse(cleaned)
    }
    throw e
  }
}

/**
 * 移除 AI 回复中的 <think> 思考标签
 * MiniMax-M2.7 等模型会在输出中包裹推理过程
 */
export function stripThinkBlocks(content: string): string {
  if (!content) return content
  return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

/**
 * 带重试的 fetch 包装器
 * 对 429 (Rate Limit) 和 5xx 服务器错误自动重试，使用指数退避
 */
async function fetchWithRetry(
  url: string,
  options: any,
  retries = 3
): Promise<Response> {
  let lastError: Error | null = null
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await _fetch(url, options)
      if (response.ok) return response
      const shouldRetry = (response.status === 429 || response.status >= 500) && i < retries
      if (!shouldRetry) return response
      const delay = Math.min(1000 * Math.pow(2, i), 8000)
      console.warn(`[fetchWithRetry] HTTP ${response.status}, retry ${i + 1}/${retries + 1} in ${delay}ms`)
      await new Promise((r) => setTimeout(r, delay))
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      // 不重试用户主动取消的请求
      if (lastError.name === 'AbortError') throw lastError
      if (i < retries) {
        const delay = Math.min(1000 * Math.pow(2, i), 8000)
        console.warn(`[fetchWithRetry] Network error, retry ${i + 1}/${retries + 1} in ${delay}ms:`, lastError.message)
        await new Promise((r) => setTimeout(r, delay))
      } else {
        throw lastError
      }
    }
  }
  throw lastError || new Error('fetchWithRetry: all attempts failed')
}

export interface VisionContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

/** Anthropic-format image block for MiniMax compatibility */
export interface AnthropicImageContent {
  type: 'image';
  source: {
    type: 'base64' | 'url';
    media_type?: string;
    data?: string;
    url?: string;
  };
}

export type MessageContent = string | Array<VisionContent | AnthropicImageContent>;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
}

interface ClaudeResponse {
  content: string;
  error?: string;
  /** 结构化数据（JSON 解析结果），仅当 structured=true 时可能存在 */
  structured?: unknown;
}

const SYSTEM_PROMPT = `你是一位博学的研究助手，专注于学术讨论和研究支持。

你的能力包括：
- 解释复杂的学术概念和研究方法
- 分析和讨论学术论文
- 提供研究思路和方法论建议
- 帮助理解和应用研究理论

请用中文回答，保持专业且友好的语气。如果不确定某些事情，请如实说明。`;

/**
 * Convert OpenAI-format content blocks to Anthropic format for MiniMax compatibility.
 * MiniMax's /chat/completions endpoint accepts Anthropic-style image blocks.
 */
function convertToAnthropicFormat(messages: ChatMessage[]): Array<{ role: string; content: any }> {
  return messages.map((m) => {
    if (typeof m.content === 'string') {
      return { role: m.role, content: m.content };
    }

    // Convert array content
    const converted = m.content.map((block) => {
      if (block.type === 'text') {
        return { type: 'text', text: block.text || '' };
      }
      if (block.type === 'image_url' && block.image_url) {
        const url = block.image_url.url;
        if (url.startsWith('data:')) {
          // Parse data URI: data:<media_type>;base64,<data>
          const header = url.split(',')[0];
          const b64data = url.split(',')[1];
          let mediaType = 'image/png';
          if (header.includes(':') && header.includes(';')) {
            mediaType = header.split(':')[1].split(';')[0];
          }
          return {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: b64data,
            },
          };
        }
        // URL-based image
        return {
          type: 'image',
          source: {
            type: 'url',
            url,
          },
        };
      }
      return block;
    });

    return { role: m.role, content: converted };
  });
}

/** 非流式AI调用超时（毫秒） */
const CHAT_TIMEOUT_MS = 120_000

/** 流式AI调用超时（毫秒） */
const STREAM_FETCH_TIMEOUT_MS = 5 * 60 * 1000

/** Fallback 模型优先级：主模型失败后依次尝试 */
const FALLBACK_MODELS = ['gpt-5', 'deepseek-v4-flash'] as const

/** ZAI 默认模型 */
const ZAI_DEFAULT_MODEL = 'glm-5.1'
const ZAI_FALLBACK_MODEL = 'glm-4.7'
const ZAI_VISION_MODEL = 'glm-4.6v'

/**
 * 内部：调用 ZAI API（OpenAI 兼容格式）
 */
async function _callZAI(
  messages: ChatMessage[],
  systemPrompt?: string,
  maxTokens = 4096,
  temperature = 0.7,
  model = ZAI_DEFAULT_MODEL
): Promise<ClaudeResponse> {
  const result = await chatWithZAI(
    messages.map((m) => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' })),
    {
      model,
      systemPrompt: systemPrompt || SYSTEM_PROMPT,
      maxTokens,
      temperature,
    }
  )
  return { content: stripThinkBlocks(result.content || ''), error: result.error }
}

/**
 * 内部：调用 MiniMax-M2.7 API
 */
async function _callMiniMax(
  messages: ChatMessage[],
  systemPrompt?: string,
  maxTokens = 2048,
  temperature = 0.7
): Promise<ClaudeResponse> {
  const apiKey = process.env.MINIMAX_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.ZCHAT_API_KEY
  const baseUrl = process.env.MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.ZCHAT_BASE_URL

  if (!apiKey) {
    return { content: '', error: 'AI 服务未配置' }
  }

  // 避免重复 system 消息：如果 messages 已含 system，则不再前置追加
  const hasSystem = messages.some((m) => m.role === 'system')
  const apiMessages = convertToAnthropicFormat(
    hasSystem
      ? messages
      : [{ role: 'system', content: systemPrompt || SYSTEM_PROMPT }, ...messages]
  )

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS)

  const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      messages: apiMessages,
      max_tokens: maxTokens,
      temperature,
    }),
    agent: _agent,
    signal: controller.signal,
  } as any)

  clearTimeout(timeoutId)

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    console.error('[MiniMax] API error:', response.status, errorText)
    return { content: '', error: `MiniMax 错误: ${response.status} ${errorText.slice(0, 200)}` }
  }

  const text = await response.text()
  const data = safeJsonParse(text)
  return { content: stripThinkBlocks(data.choices?.[0]?.message?.content || '') }
}

/**
 * 主 AI 调用入口：ZAI GLM 家族为主力模型，失败时自动回退
 * 回退链：GLM-5.1 → GLM-4.7 → MiniMax-M2.7 → ZCHAT gpt-5 → DeepSeek
 */
export async function chatWithAI(messages: ChatMessage[], systemPrompt?: string): Promise<ClaudeResponse> {
  // 如果消息包含图片，优先使用 ZAI GLM-4.6V（原生多模态），fallback 到 ZCHAT
  const visionMessages = messages.filter((m) => typeof m.content !== 'string') as ChatMessage[]
  const hasVision = visionMessages.some((m) =>
    (m.content as Array<any>)?.some(
      (block) => block.type === 'image_url' || block.type === 'image'
    )
  )
  if (hasVision) {
    // 1. 优先 ZAI GLM-4.6V
    try {
      const zaiVisionRes = await callZAIVision(messages, {
        systemPrompt: systemPrompt || SYSTEM_PROMPT,
        maxTokens: 4096,
        temperature: 0.7,
        stream: false,
      })
      if (zaiVisionRes.ok) {
        const text = await zaiVisionRes.text()
        const data = safeJsonParse(text)
        const content = data.choices?.[0]?.message?.content || ''
        if (content) {
          console.log('[chatWithAI] Vision via ZAI GLM-4.6V succeeded')
          return { content: stripThinkBlocks(content) }
        }
      }
      const errText = await zaiVisionRes.text().catch(() => '')
      console.warn('[chatWithAI] ZAI vision failed:', zaiVisionRes.status, errText)
    } catch (err) {
      console.warn('[chatWithAI] ZAI vision error:', err)
    }
    // 2. fallback 到 ZCHAT
    console.log('[chatWithAI] Vision fallback to ZCHAT')
    return chatWithZCHAT(messages, { systemPrompt })
  }

  // 1. 主模型：ZAI GLM-5.1
  const primary = await _callZAI(messages, systemPrompt)
  if (!primary.error) {
    return primary
  }

  // 判断是否可回退
  const errLower = primary.error.toLowerCase()
  const isInputError = errLower.includes('invalid') || errLower.includes('bad request')
  if (isInputError) {
    console.error('[chatWithAI] ZAI input error, skip fallback:', primary.error)
    return primary
  }

  console.warn('[chatWithAI] ZAI GLM-5.1 failed:', primary.error, '- starting fallback chain')

  // 2. 回退 1: ZAI GLM-4.7（同家族备用）
  const fallbackGLM = await _callZAI(messages, systemPrompt, 4096, 0.7, ZAI_FALLBACK_MODEL)
  if (!fallbackGLM.error) {
    console.log('[chatWithAI] Fallback to GLM-4.7 succeeded')
    return fallbackGLM
  }
  console.warn('[chatWithAI] GLM-4.7 failed:', fallbackGLM.error)

  // 3. 回退 2: MiniMax-M2.7
  const fallback1 = await _callMiniMax(messages, systemPrompt)
  if (!fallback1.error) {
    console.log('[chatWithAI] Fallback to MiniMax-M2.7 succeeded')
    return fallback1
  }
  console.warn('[chatWithAI] MiniMax failed:', fallback1.error)

  // 4. 回退 3: ZCHAT gpt-5
  const fallback2 = await chatWithZCHAT(messages, {
    systemPrompt,
    model: 'gpt-5',
    maxTokens: 4096,
    temperature: 0.7,
  })
  if (!fallback2.error) {
    console.log('[chatWithAI] Fallback to gpt-5 succeeded')
    return fallback2
  }
  console.warn('[chatWithAI] gpt-5 failed:', fallback2.error)

  // 5. 回退 4: ZCHAT deepseek-v4-flash
  const fallback3 = await chatWithZCHAT(messages, {
    systemPrompt,
    model: 'deepseek-v4-flash',
    maxTokens: 4096,
    temperature: 0.7,
  })
  if (!fallback3.error) {
    console.log('[chatWithAI] Fallback to deepseek-v4-flash succeeded')
    return fallback3
  }
  console.error('[chatWithAI] All fallback models failed:', fallback3.error)

  // 返回完整回退链信息
  return {
    content: '',
    error: `AI 服务全部不可用。GLM-5.1: ${primary.error}; GLM-4.7: ${fallbackGLM.error}; MiniMax: ${fallback1.error}; gpt-5: ${fallback2.error}; deepseek: ${fallback3.error}`,
  }
}

interface ResearchContext {
  papers?: Array<{
    title: string;
    abstract?: string;
    authors?: string[];
    year?: number;
  }>;
  discipline?: string;
}

export async function chatWithContext(
  messages: ChatMessage[],
  context: ResearchContext
): Promise<ClaudeResponse> {
  const contextPrompt = context.discipline
    ? `\n用户所在学科领域: ${context.discipline}`
    : '';

  const papersPrompt = context.papers && context.papers.length > 0
    ? `\n相关论文参考:\n${context.papers.map(p =>
        `- ${p.title}${p.authors ? ` (${p.authors.join(', ')}${p.year ? `, ${p.year}` : ''})` : ''}${p.abstract ? `\n  摘要: ${p.abstract.slice(0, 200)}...` : ''}`
      ).join('\n')}`
    : '';

  const enhancedMessages = messages.map(m => {
    if (m.role === 'user' && typeof m.content === 'string') {
      return {
        ...m,
        content: m.content + `${contextPrompt}${papersPrompt}`
      }
    }
    return m
  })

  return chatWithAI(enhancedMessages)
}

export async function analyzePaper(content: string): Promise<{
  summary?: string;
  keywords?: string[];
  error?: string;
}> {
  const result = await chatWithAI([
    { role: 'user', content: `请分析以下学术论文，返回JSON格式的摘要和关键词：\n\n${content.slice(0, 5000)}` }
  ]);

  if (result.error) {
    return { error: result.error };
  }

  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return safeJsonParse(jsonMatch[0]);
    }
    return { summary: result.content.slice(0, 500) };
  } catch {
    return { summary: result.content.slice(0, 500) };
  }
}

export async function suggestResearchDirections(
  topic: string,
  discipline?: string
): Promise<{ suggestions?: string[]; error?: string }> {
  const disciplineContext = discipline ? `在 ${discipline} 领域，` : '';
  const result = await chatWithAI([
    { role: 'user', content: `${disciplineContext}关于"${topic}"的研究，有哪些值得关注的研究方向？请列出3-5个潜在的研究方向简述。` }
  ]);

  if (result.error) {
    return { error: result.error };
  }

  const suggestions = result.content
    .split(/\n|；|;/)
    .filter(s => s.trim().length > 10)
    .map(s => s.replace(/^\d+[\.)、]\s*/, '').trim())
    .slice(0, 5);

  return { suggestions };
}

// ===== 基金申请辅助 =====

import {
  GRANT_APPLICATION_SYSTEM_PROMPT,
  GRANT_APPLICATION_JSON_SYSTEM_PROMPT,
  buildGrantApplicationJsonPrompt,
  parseGrantApplicationJson,
  type GrantApplicationResult,
} from './grant-application-prompts'

export async function grantApplication(
  topic: string,
  context?: string,
  structured?: boolean
): Promise<ClaudeResponse> {
  if (structured) {
    const prompt = buildGrantApplicationJsonPrompt(topic, context)
    const result = await chatWithAI([{ role: 'user', content: prompt }], GRANT_APPLICATION_JSON_SYSTEM_PROMPT)
    if (result.error) return result
    const parsed = parseGrantApplicationJson(result.content)
    if (parsed) {
      return { content: result.content, structured: parsed }
    }
    return { content: result.content }
  }

  const prompt = context
    ? `题目：${topic}\n背景：${context}\n请撰写项目申请相关内容。`
    : `题目：${topic}\n请分析项目申请策略：立项依据、研究内容、技术路线、创新点、预期成果。`;

  // 使用 chatWithAI 获得完整 fallback 链：GLM-5.1 → MiniMax → ZCHAT → DeepSeek
  return chatWithAI([{ role: 'user', content: prompt }], GRANT_APPLICATION_SYSTEM_PROMPT)
}

// ===== 文献综述辅助 =====

const SURVEY_SYSTEM_PROMPT = `你是文献综述专家。请用中文结构化回答。`;

export async function surveyGeneration(
  topic: string,
  context?: string
): Promise<ClaudeResponse> {
  const prompt = context
    ? `主题：${topic}\n背景：${context}\n请梳理文献综述框架。`
    : `主题：${topic}\n请生成文献综述框架：背景历史、方法比较、里程碑工作、挑战问题、未来方向。`;

  // 使用 chatWithAI 获得完整 fallback 链：GLM-5.1 → MiniMax → ZCHAT → DeepSeek
  return chatWithAI([{ role: 'user', content: prompt }], SURVEY_SYSTEM_PROMPT)
}

// ===== AI 审稿 =====

import {
  PEER_REVIEW_SYSTEM_PROMPT,
  PEER_REVIEW_JSON_SYSTEM_PROMPT,
  buildPeerReviewPrompt,
  buildPeerReviewJsonPrompt,
  parsePeerReviewJson,
  type PeerReviewResult,
} from './peer-review-prompts'

export async function peerReview(
  paperContent: string,
  focus?: string,
  structured?: boolean
): Promise<ClaudeResponse> {
  if (structured) {
    const prompt = buildPeerReviewJsonPrompt(paperContent, focus)
    const result = await chatWithAI([{ role: 'user', content: prompt }], PEER_REVIEW_JSON_SYSTEM_PROMPT)
    if (result.error) return result
    const parsed = parsePeerReviewJson(result.content)
    if (parsed) {
      return { content: result.content, structured: parsed }
    }
    return { content: result.content }
  }

  const prompt = buildPeerReviewPrompt(paperContent, focus);

  // 使用 chatWithAI 获得完整 fallback 链：GLM-5.1 → MiniMax → ZCHAT → DeepSeek
  return chatWithAI([{ role: 'user', content: prompt }], PEER_REVIEW_SYSTEM_PROMPT)
}

// ===== AI 论文生成（基于 Skill 引擎）=====

import {
  PAPER_GENERATION_SYSTEM_PROMPT,
  buildProposalPrompt,
  buildStructurePrompt,
  buildWritingPrompt,
  buildDataAnalysisPrompt,
  buildFormattingPrompt,
  type PaperGenerationStage,
} from './paper-generation-prompts'

import {
  executeSkillStage,
  registerSkill,
  paperGenerationSkill,
} from './skills'
import {
  preparePaperEnhancement,
  type CitationVerificationResult,
} from './paper-enhancement'

// 注册论文生成 Skill（模块加载时自动注册）
registerSkill(paperGenerationSkill)

export async function generatePaper(
  stage: PaperGenerationStage,
  params: {
    topic: string
    content?: string
    background?: string
    section?: string
    wordCount?: number
    dataDescription?: string
    analysisGoal?: string
    format?: 'latex' | 'markdown' | 'plain'
    discipline?: string
    enableRAG?: boolean
    enableCitationVerify?: boolean
    enableExternalSearch?: boolean
    /** 指定使用 ZCHAT (Claude Sonnet) 而非 MiniMax，提升学术写作质量 */
    useClaudeSonnet?: boolean
    /** base64 data URI 格式的图片数组，用于数据/图表阶段的视觉分析 */
    images?: string[]
  }
): Promise<ClaudeResponse & { citations?: CitationVerificationResult; papers?: Array<{ title: string; authors: string[]; year?: number; venue?: string; url?: string }> }> {
  let ragPrefix = ''
  let verifyFn: ((text: string) => Promise<CitationVerificationResult>) | null = null
  let retrievedPapers: Array<{ title: string; authors: string[]; year?: number; venue?: string; url?: string }> = []

  // Step 1: 外部文献检索 + RAG 增强（默认启用）
  if (params.enableExternalSearch !== false) {
    try {
      const enhancement = await preparePaperEnhancement(params.topic, {
        discipline: params.discipline,
        stage,
        useExternalSearch: true,
      })
      ragPrefix = enhancement.ragPrefix
      verifyFn = enhancement.verify
      // 提取检索到的论文元数据供前端展示
      retrievedPapers = enhancement.ragContext.papers.map((p) => ({
        title: p.title,
        authors: p.authors || [],
        year: p.year,
        venue: p.venue,
        url: p.url,
      }))
      console.log(`[generatePaper] Retrieved ${retrievedPapers.length} external papers for "${params.topic}"`)
    } catch (err) {
      console.warn('[generatePaper] External search failed, falling back:', err)
    }
  }

  // Step 2: 使用 Skill 引擎执行单阶段
  const hasImages = params.images && params.images.length > 0
  const result = await executeSkillStage(
    'paper-generation',
    stage,
    {
      topic: params.topic,
      content: params.content,
      background: params.background ? `${ragPrefix}${params.background}` : ragPrefix || undefined,
      section: params.section,
      wordCount: params.wordCount,
      dataDescription: params.dataDescription,
      analysisGoal: params.analysisGoal,
      format: params.format,
      _ragPrefix: ragPrefix,
      _images: params.images,
    },
    { topic: params.topic, stageOutputs: {}, metadata: {} },
    { useVision: hasImages }
  )

  // Step 3: 引用验证（默认启用）+ 真实引用替换
  if (params.enableCitationVerify !== false && !result.error && result.content) {
    try {
      // 优先使用基于 Semantic Scholar 的真实验证
      const { verifyAndReport } = await import('./citation-verifier')
      const report = await verifyAndReport(result.content, params.topic)
      console.log(`[generatePaper] Citation verification: ${report.confirmedCount} confirmed, ${report.unverifiedCount} unverified, score ${report.credibilityScore}/100`)

      return {
        content: report.verifiedText,
        citations: {
          verifiedText: report.verifiedText,
          citationMap: {},
          unverified: report.citations.filter((c) => c.status === 'unverified').map((c) => c.rawText),
        },
        papers: retrievedPapers,
      }
    } catch (err) {
      console.warn('[generatePaper] Citation verification failed:', err)
    }
  }

  return { ...result, papers: retrievedPapers }
}

// ===== ZCHAT 多模态聊天（图片识别）=====

const ZCHAT_DEFAULT_MODEL = process.env.ZCHAT_VISION_MODEL || 'claude-sonnet-4-5'
const ZCHAT_DEFAULT_BASE_URL = 'https://api.zchat.tech/v1'

/**
 * Check if messages contain vision/image content
 */
export function hasVisionContent(messages: ChatMessage[]): boolean {
  return messages.some((m) => {
    if (typeof m.content === 'string') return false
    return m.content.some(
      (block) => block.type === 'image_url' || block.type === 'image'
    )
  })
}

/**
 * Convert Anthropic-format image blocks back to OpenAI format for ZCHAT.
 * ZCHAT uses standard OpenAI format with image_url content blocks.
 */
function normalizeToOpenAIVision(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => {
    if (typeof m.content === 'string') return m
    const content = m.content.map((block) => {
      if (block.type === 'image' && 'source' in block) {
        const src = (block as AnthropicImageContent).source
        if (src.type === 'base64' && src.data && src.media_type) {
          return {
            type: 'image_url' as const,
            image_url: {
              url: `data:${src.media_type};base64,${src.data}`,
            },
          }
        }
        if (src.type === 'url' && src.url) {
          return {
            type: 'image_url' as const,
            image_url: { url: src.url },
          }
        }
      }
      return block
    })
    return { ...m, content }
  })
}

export async function chatWithZCHAT(
  messages: ChatMessage[],
  options?: {
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
    model?: string
  }
): Promise<ClaudeResponse> {
  const apiKey = process.env.ZCHAT_API_KEY
  const baseUrl = process.env.ZCHAT_BASE_URL || ZCHAT_DEFAULT_BASE_URL

  if (!apiKey) {
    return { content: '', error: 'ZCHAT 服务未配置，请在 .env 中设置 ZCHAT_API_KEY' }
  }

  try {
    // 避免重复 system 消息
    const hasSystem = messages.some((m) => m.role === 'system')
    const openaiMessages = normalizeToOpenAIVision(
      hasSystem
        ? messages
        : [{ role: 'system', content: options?.systemPrompt || SYSTEM_PROMPT }, ...messages]
    )

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS)

    const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || ZCHAT_DEFAULT_MODEL,
        messages: openaiMessages,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
      }),
      agent: _agent,
      signal: controller.signal,
    } as any)

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ZCHAT API error:', response.status, errorText)
      return { content: '', error: `ZCHAT 服务错误: ${response.status}` }
    }

    const text = await response.text()
    const data = safeJsonParse(text)
    return { content: stripThinkBlocks(data.choices?.[0]?.message?.content || '') }
  } catch (error) {
    console.error('ZCHAT chat error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return { content: '', error: `ZCHAT 服务调用超时（>${CHAT_TIMEOUT_MS / 1000}秒）` }
    }
    return { content: '', error: error instanceof Error ? error.message : 'ZCHAT 未知错误' }
  }
}

export async function chatWithZCHATStream(
  messages: ChatMessage[],
  options?: {
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
    model?: string
  }
): Promise<ReadableStream | { error: string }> {
  const apiKey = process.env.ZCHAT_API_KEY
  const baseUrl = process.env.ZCHAT_BASE_URL || ZCHAT_DEFAULT_BASE_URL

  if (!apiKey) {
    return { error: 'ZCHAT 服务未配置，请在 .env 中设置 ZCHAT_API_KEY' }
  }

  try {
    const openaiMessages = normalizeToOpenAIVision([
      { role: 'system', content: options?.systemPrompt || SYSTEM_PROMPT },
      ...messages,
    ])

    const controller = new AbortController()
    const fetchTimeoutId = setTimeout(() => controller.abort(), STREAM_FETCH_TIMEOUT_MS)

    const response = await _fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || ZCHAT_DEFAULT_MODEL,
        messages: openaiMessages,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        stream: true,
      }),
      agent: _agent,
      signal: controller.signal,
    } as any)

    clearTimeout(fetchTimeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ZCHAT stream API error:', response.status, errorText)
      return { error: `ZCHAT 服务错误: ${response.status}` }
    }

    if (!response.body) {
      return { error: 'ZCHAT 响应为空' }
    }

    if (
      typeof window === 'undefined' &&
      response.body &&
      typeof (response.body as any).getReader !== 'function'
    ) {
      const { ReadableStream } = require('stream/web')
      const nodeStream = response.body as unknown as import('stream').Readable
      return new ReadableStream({
        start(controller: ReadableStreamDefaultController) {
          const MAX_STREAM_MS = 5 * 60 * 1000
          const INACTIVITY_MS = 60 * 1000
          const startTime = Date.now()
          let lastDataTime = Date.now()

          const timeoutCheck = setInterval(() => {
            const now = Date.now()
            if (now - startTime > MAX_STREAM_MS) {
              clearInterval(timeoutCheck)
              try { controller.close() } catch { /* ignore */ }
              return
            }
            if (now - lastDataTime > INACTIVITY_MS) {
              clearInterval(timeoutCheck)
              try { controller.close() } catch { /* ignore */ }
              return
            }
          }, 5000)

          nodeStream.on('data', (chunk) => {
            lastDataTime = Date.now()
            controller.enqueue(chunk)
          })
          nodeStream.on('end', () => {
            clearInterval(timeoutCheck)
            controller.close()
          })
          nodeStream.on('error', (err) => {
            clearInterval(timeoutCheck)
            controller.error(err)
          })
        },
      })
    }

    return response.body
  } catch (error) {
    console.error('ZCHAT stream error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return { error: `ZCHAT 流式服务调用超时（>${STREAM_FETCH_TIMEOUT_MS / 1000}秒）` }
    }
    return { error: error instanceof Error ? error.message : 'ZCHAT 未知错误' }
  }
}

// ===== Workshop Hermes 增强模式（P0）=====

import {
  generatePaperViaHermes,
  peerReviewViaHermes,
  grantApplicationViaHermes,
  surveyGenerationViaHermes,
  analyzePaperViaHermes,
} from './hermes-gateway-adapter'
import { verifyAndReport } from './citation-verifier'

/** 论文生成 — Hermes 增强版（含真实引用验证） */
export async function generatePaperWithHermes(
  stage: string,
  params: {
    topic: string
    content?: string
    background?: string
    section?: string
    wordCount?: number
    dataDescription?: string
    analysisGoal?: string
    format?: 'latex' | 'markdown' | 'plain'
    stream?: boolean
  }
): Promise<ClaudeResponse & { citations?: { verified: number; unverified: number; score: number }; stream?: ReadableStream }> {
  const result = await generatePaperViaHermes({
    topic: params.topic,
    stage: stage as any,
    background: params.background,
    section: params.section,
    wordCount: params.wordCount,
    content: params.content,
    dataDescription: params.dataDescription,
    analysisGoal: params.analysisGoal,
    format: params.format,
    stream: params.stream,
  })

  if (result.error) {
    // 返回 error 对象让上层 fallback 逻辑正常执行（而非 throw 导致 500）
    return { content: '', error: result.error }
  }

  // 流式模式：直接返回原始流，引用验证延后到前端或异步任务
  if (result.stream) {
    return { content: '', stream: result.stream }
  }

  const content = result.content || ''
  if (!content) {
    return { content: '', error: 'Hermes Gateway returned empty content' }
  }

  // 引用验证（仅非流模式）
  try {
    const report = await verifyAndReport(content, params.topic)
    return {
      content: stripThinkBlocks(report.verifiedText),
      citations: {
        verified: report.confirmedCount,
        unverified: report.unverifiedCount,
        score: report.credibilityScore,
      },
    }
  } catch (err) {
    console.warn('[generatePaperWithHermes] Citation verification failed:', err)
    // 引用验证失败仍返回原始内容
    return { content: stripThinkBlocks(content) }
  }
}

/** AI 审稿 — Hermes 增强版 */
export async function peerReviewWithHermes(
  paperContent: string,
  focus?: string,
  structured?: boolean
): Promise<ClaudeResponse> {
  const result = await peerReviewViaHermes(paperContent, focus, false, structured)

  if (result.error) {
    return { content: '', error: result.error }
  }

  return {
    content: stripThinkBlocks(result.content || ''),
    structured: result.structured,
  }
}

/** 基金申请 — Hermes 增强版 */
export async function grantApplicationWithHermes(
  topic: string,
  context?: string,
  structured?: boolean
): Promise<ClaudeResponse> {
  const result = await grantApplicationViaHermes(topic, context, false, structured)

  if (result.error) {
    return { content: '', error: result.error }
  }

  return {
    content: stripThinkBlocks(result.content || ''),
    structured: result.structured,
  }
}

/** 文献综述 — Hermes 增强版 */
export async function surveyWithHermes(
  topic: string,
  context?: string
): Promise<ClaudeResponse> {
  const result = await surveyGenerationViaHermes(topic, context)

  if (result.error) {
    return { content: '', error: result.error }
  }

  return { content: stripThinkBlocks(result.content || '') }
}

/** 论文分析 — Hermes 增强版 */
export async function analyzePaperWithHermes(
  content: string
): Promise<ClaudeResponse> {
  const result = await analyzePaperViaHermes(content)

  if (result.error) {
    return { content: '', error: result.error }
  }

  return { content: stripThinkBlocks(result.content || '') }
}

// ===== 流式聊天 =====

export async function chatWithAIStream(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<ReadableStream | { error: string }> {
  // 如果消息包含图片，优先使用 ZAI GLM-4.6V 流式，fallback 到 ZCHAT
  const visionMessages = messages.filter((m) => typeof m.content !== 'string') as ChatMessage[]
  const hasVision = visionMessages.some((m) =>
    (m.content as Array<any>)?.some(
      (block) => block.type === 'image_url' || block.type === 'image'
    )
  )
  if (hasVision) {
    try {
      const zaiVisionRes = await callZAIVision(messages, {
        systemPrompt: systemPrompt || SYSTEM_PROMPT,
        maxTokens: 4096,
        temperature: 0.7,
        stream: true,
      })
      if (zaiVisionRes.ok && zaiVisionRes.body) {
        console.log('[chatWithAIStream] Vision via ZAI GLM-4.6V stream')
        let stream: ReadableStream
        if (typeof window === 'undefined' && typeof (zaiVisionRes.body as any).getReader !== 'function') {
          const { ReadableStream } = require('stream/web')
          const nodeStream = zaiVisionRes.body as unknown as import('stream').Readable
          stream = new ReadableStream({
            start(controller: ReadableStreamDefaultController) {
              nodeStream.on('data', (chunk) => controller.enqueue(chunk))
              nodeStream.on('end', () => controller.close())
              nodeStream.on('error', (err) => controller.error(err))
            },
          })
        } else {
          stream = zaiVisionRes.body
        }
        return stream.pipeThrough(createThinkStrippingStream())
      }
      console.warn('[chatWithAIStream] ZAI vision stream failed, fallback to ZCHAT')
    } catch (err) {
      console.warn('[chatWithAIStream] ZAI vision stream error:', err)
    }
    return chatWithZCHATStream(messages, { systemPrompt })
  }

  // 1. 主模型：ZAI GLM-5.1 流式
  try {
    const zaiStream = await chatWithZAIStream(
      messages.map((m) => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' })),
      {
        model: ZAI_DEFAULT_MODEL,
        systemPrompt: systemPrompt || SYSTEM_PROMPT,
        maxTokens: 4096,
        temperature: 0.7,
      }
    )
    if (!('error' in zaiStream)) {
      return zaiStream.pipeThrough(createThinkStrippingStream())
    }
    console.warn('[chatWithAIStream] ZAI stream failed:', zaiStream.error)
  } catch (err) {
    console.warn('[chatWithAIStream] ZAI stream error:', err)
  }

  // 2. Fallback: MiniMax-M2.7 流式
  const apiKey = process.env.MINIMAX_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.ZCHAT_API_KEY;
  const baseUrl = process.env.MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.ZCHAT_BASE_URL;

  if (!apiKey) {
    return { error: 'AI 服务未配置' };
  }

  try {
    const apiMessages = convertToAnthropicFormat([
      { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
      ...messages
    ]);
    
    const controller = new AbortController()
    const fetchTimeoutId = setTimeout(() => controller.abort(), STREAM_FETCH_TIMEOUT_MS)

    const response = await _fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: apiMessages,
        max_tokens: 4096,
        temperature: 0.7,
        stream: true,
      }),
      agent: _agent,
      signal: controller.signal,
    } as any);

    clearTimeout(fetchTimeoutId)

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `AI 服务错误: ${response.status}` };
    }

    if (!response.body) {
      return { error: 'AI 响应为空' };
    }

    let stream: ReadableStream
    if (typeof window === 'undefined' && response.body && typeof (response.body as any).getReader !== 'function') {
      const { ReadableStream } = require('stream/web');
      const nodeStream = response.body as unknown as import('stream').Readable;
      stream = new ReadableStream({
        start(controller: ReadableStreamDefaultController) {
          const MAX_STREAM_MS = 5 * 60 * 1000;
          const INACTIVITY_MS = 60 * 1000;
          const startTime = Date.now();
          let lastDataTime = Date.now();

          const timeoutCheck = setInterval(() => {
            const now = Date.now();
            if (now - startTime > MAX_STREAM_MS) {
              clearInterval(timeoutCheck);
              try { controller.close(); } catch { /* ignore */ }
              return;
            }
            if (now - lastDataTime > INACTIVITY_MS) {
              clearInterval(timeoutCheck);
              try { controller.close(); } catch { /* ignore */ }
              return;
            }
          }, 5000);

          nodeStream.on('data', (chunk) => {
            lastDataTime = Date.now();
            controller.enqueue(chunk);
          });
          nodeStream.on('end', () => {
            clearInterval(timeoutCheck);
            controller.close();
          });
          nodeStream.on('error', (err) => {
            clearInterval(timeoutCheck);
            controller.error(err);
          });
        }
      });
    } else {
      stream = response.body
    }

    return stream.pipeThrough(createThinkStrippingStream())
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { error: `AI 流式服务调用超时（>${STREAM_FETCH_TIMEOUT_MS / 1000}秒）` };
    }
    return { error: error instanceof Error ? error.message : '未知错误' };
  }
}
