/**
 * ZAI (智谱 AI / Z.ai) 服务封装
 * Base URL: https://api.z.ai/api/coding/paas/v4
 * 协议: OpenAI 兼容
 */

import nodeFetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import type { ChatMessage } from './claude-service'

// Proxy support
let _fetch: typeof fetch = fetch
let _agent: any = undefined
if (typeof window === 'undefined') {
  const proxyUrl =
    process.env.http_proxy ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.HTTPS_PROXY
  if (proxyUrl) {
    _fetch = (nodeFetch as any).default || nodeFetch
    _agent = new HttpsProxyAgent(proxyUrl)
  }
}

const ZAI_API_KEY = process.env.ZAI_API_KEY
const ZAI_BASE_URL = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4'

/** 调用 ZAI GLM-5.1 API */
export async function callZAI(
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
    stream?: boolean
    /** 启用深度思考模式（仅 GLM-5.1+ 支持），提升逻辑严密性，但会增加延迟 */
    thinking?: boolean
  }
): Promise<Response> {
  const apiKey = ZAI_API_KEY
  const baseUrl = ZAI_BASE_URL

  if (!apiKey) {
    throw new Error('ZAI 服务未配置，请在 .env 中设置 ZAI_API_KEY')
  }

  const model = options?.model || 'glm-5.1'
  const maxTokens = options?.maxTokens ?? 4096
  const temperature = options?.temperature ?? 0.7
  const stream = options?.stream ?? false
  const thinking = options?.thinking ?? false

  // 避免重复 system 消息
  const hasSystem = messages.some((m) => m.role === 'system')
  const finalMessages = hasSystem
    ? messages
    : options?.systemPrompt
      ? [{ role: 'system', content: options.systemPrompt }, ...messages]
      : messages

  const body: Record<string, unknown> = {
    model,
    messages: finalMessages,
    max_tokens: maxTokens,
    temperature,
    stream,
  }

  if (thinking) {
    body.thinking = true
  }

  const maxRetries = 3
  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await _fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        agent: _agent,
      } as any)

      // 429 rate limit -> exponential backoff retry
      if (response.status === 429) {
        const delay = Math.min(1000 * 2 ** attempt, 8000)
        console.warn(
          `[ZAI] Rate limited, retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`
        )
        await new Promise((r) => setTimeout(r, delay))
        continue
      }

      return response
    } catch (error) {
      lastError = error
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('ECONNRESET') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('socket hang up') ||
          error.message.includes('disconnected before secure TLS') ||
          error.message.includes('Network request failed'))

      if (!isRetryable || attempt === maxRetries - 1) break

      const delay = Math.min(1000 * 2 ** attempt, 8000)
      console.warn(
        `[ZAI] Network error, retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  if (lastError) throw lastError
  throw new Error('ZAI 调用失败，已重试多次')
}

/** 调用 ZAI 视觉模型 GLM-4.6V（原生支持 image_url） */
export async function callZAIVision(
  messages: ChatMessage[],
  options?: {
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
    stream?: boolean
  }
): Promise<Response> {
  const apiKey = ZAI_API_KEY
  const baseUrl = ZAI_BASE_URL

  if (!apiKey) {
    throw new Error('ZAI 服务未配置，请在 .env 中设置 ZAI_API_KEY')
  }

  const maxTokens = options?.maxTokens ?? 4096
  const temperature = options?.temperature ?? 0.7
  const stream = options?.stream ?? false

  // 避免重复 system 消息
  const hasSystem = messages.some((m) => m.role === 'system')
  const finalMessages = hasSystem
    ? messages
    : options?.systemPrompt
      ? [{ role: 'system', content: options.systemPrompt }, ...messages]
      : messages

  return _fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'glm-4.6v',
      messages: finalMessages,
      max_tokens: maxTokens,
      temperature,
      stream,
    }),
    agent: _agent,
  } as any)
}

/** ZAI 通用非流式调用（返回文本） */
export async function chatWithZAI(
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
  }
): Promise<{ content?: string; error?: string }> {
  try {
    const response = await callZAI(messages, { ...options, stream: false })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ZAI] API error:', response.status, errorText)
      return { content: '', error: `ZAI 错误: ${response.status} ${errorText.slice(0, 200)}` }
    }

    const text = await response.text()
    const data = JSON.parse(text)
    const msg = data.choices?.[0]?.message
    const content = msg?.content || ''
    // GLM-5.1 可能将内容放入 reasoning_content（当 content 为空时）
    const reasoning = msg?.reasoning_content || ''
    return { content: content || reasoning || '' }
  } catch (error) {
    console.error('[ZAI] Error:', error)
    return { content: '', error: error instanceof Error ? error.message : 'ZAI 未知错误' }
  }
}

/**
 * 调用 ZAI 图像生成 API（GLM-Image）
 * 返回图片 URL，有效期 30 天
 */
export async function generateImageWithZAI(
  prompt: string,
  options?: {
    size?: string
    quality?: 'standard' | 'hd'
    n?: number
  }
): Promise<{ url?: string; b64_json?: string; error?: string }> {
  const apiKey = ZAI_API_KEY
  const baseUrl = ZAI_BASE_URL

  if (!apiKey) {
    return { error: 'ZAI 服务未配置，请在 .env 中设置 ZAI_API_KEY' }
  }

  try {
    const response = await _fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-image',
        prompt,
        size: options?.size || '1024x1024',
        quality: options?.quality || 'standard',
        n: options?.n || 1,
      }),
      agent: _agent,
    } as any)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ZAI Image] API error:', response.status, errorText)
      return { error: `图像生成错误: ${response.status} ${errorText.slice(0, 200)}` }
    }

    const data = await response.json()
    const imageData = data.data?.[0]
    if (!imageData) {
      return { error: '图像生成返回空数据' }
    }

    return {
      url: imageData.url,
      b64_json: imageData.b64_json,
    }
  } catch (error) {
    console.error('[ZAI Image] Error:', error)
    return { error: error instanceof Error ? error.message : '图像生成未知错误' }
  }
}

/**
 * 解析文本中的 [GENERATE_IMAGE:描述] 标记，调用生图 API，替换为 base64 图片
 */
export async function processImageMarkers(
  text: string
): Promise<{ text: string; generatedCount: number; errors: string[] }> {
  const markerRegex = /\[GENERATE_IMAGE:([^\]]+)\]/g
  const markers: Array<{ full: string; prompt: string }> = []
  let match
  while ((match = markerRegex.exec(text)) !== null) {
    markers.push({ full: match[0], prompt: match[1].trim() })
  }

  if (markers.length === 0) {
    return { text, generatedCount: 0, errors: [] }
  }

  const errors: string[] = []
  let resultText = text

  // 串行生成避免并发超限（glm-image 并发仅 1）
  for (const marker of markers) {
    const imageResult = await generateImageWithZAI(marker.prompt, {
      size: '1024x1024',
      quality: 'standard',
    })

    if (imageResult.error) {
      errors.push(`[${marker.prompt}] ${imageResult.error}`)
      // 替换为文本提示而非图片
      resultText = resultText.replace(
        marker.full,
        `> 💡 *[建议配图：${marker.prompt}]*`
      )
      continue
    }

    let base64: string | null = null
    if (imageResult.b64_json) {
      base64 = `data:image/png;base64,${imageResult.b64_json}`
    } else if (imageResult.url) {
      base64 = await imageUrlToBase64(imageResult.url)
    }

    if (base64) {
      resultText = resultText.replace(marker.full, `![${marker.prompt}](${base64})`)
    } else {
      errors.push(`[${marker.prompt}] 图片下载失败`)
      resultText = resultText.replace(
        marker.full,
        `> 💡 *[建议配图：${marker.prompt}]*`
      )
    }
  }

  return { text: resultText, generatedCount: markers.length - errors.length, errors }
}

/**
 * 将图片 URL 下载并转为 base64
 */
export async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const response = await _fetch(url, { agent: _agent } as any)
    if (!response.ok) return null
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = response.headers.get('content-type') || 'image/png'
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error('[imageUrlToBase64] Failed:', error)
    return null
  }
}

/** ZAI 流式调用 */
export async function chatWithZAIStream(
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
  }
): Promise<ReadableStream | { error: string }> {
  try {
    const response = await callZAI(messages, { ...options, stream: true })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ZAI] Stream error:', response.status, errorText)
      return { error: `ZAI 流式错误: ${response.status}` }
    }

    if (!response.body) {
      return { error: 'ZAI 返回空响应' }
    }

    // Node.js 环境下需要将 Node Readable 转换为 Web ReadableStream
    let stream: ReadableStream
    if (
      typeof window === 'undefined' &&
      typeof (response.body as any).getReader !== 'function'
    ) {
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

    return stream
  } catch (error) {
    console.error('[ZAI] Stream error:', error)
    return { error: error instanceof Error ? error.message : 'ZAI 流式未知错误' }
  }
}
