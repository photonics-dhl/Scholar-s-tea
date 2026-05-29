/**
 * 嵌入生成器（双模式）
 * - API 模式：调用用户提供的 OpenAI-compatible /embeddings
 * - Local 模式：使用 @xenova/transformers 浏览器内运行 ONNX
 */

import type { EmbeddingConfig, ApiEmbeddingConfig, LocalEmbeddingConfig } from './types'
import { getEmbeddingConfig } from './storage'

let _apiConfig: ApiEmbeddingConfig | null = null
let _localPipeline: any = null
let _localModelName: string | null = null

/**
 * 获取当前生效的 embedding 配置
 */
export async function getActiveEmbeddingConfig(): Promise<EmbeddingConfig | null> {
  // 优先使用内存中缓存的配置（如果已设置）
  if (_apiConfig) return _apiConfig
  // 否则从 IndexedDB 加载
  return getEmbeddingConfig()
}

/**
 * 设置 API 配置（内存中，不持久化）
 */
export function setApiEmbeddingConfig(config: ApiEmbeddingConfig): void {
  _apiConfig = config
}

// ===== API 模式 =====

async function embedViaAPI(texts: string[], config: ApiEmbeddingConfig): Promise<number[][]> {
  const batchSize = 100
  const results: number[][] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)

    const res = await fetch(`${config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        input: batch,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Embedding API error ${res.status}: ${text.slice(0, 200)}`)
    }

    const data = await res.json()
    const embeddings: number[][] = []

    if (Array.isArray(data.data)) {
      for (const item of data.data) {
        if (item.embedding && Array.isArray(item.embedding)) {
          embeddings.push(item.embedding)
        }
      }
    } else if (Array.isArray(data.embeddings)) {
      embeddings.push(...data.embeddings)
    }

    if (embeddings.length !== batch.length) {
      throw new Error(`Embedding batch mismatch: expected ${batch.length}, got ${embeddings.length}`)
    }

    results.push(...embeddings)
  }

  return results
}

// ===== Local 模式 =====

async function getLocalPipeline(model: string) {
  if (_localPipeline && _localModelName === model) {
    return _localPipeline
  }

  if (typeof window === 'undefined') {
    throw new Error('本地嵌入模型只能在浏览器中使用')
  }

  // 动态导入，避免 SSR 问题
  const { pipeline } = await import('@xenova/transformers')
  _localPipeline = await pipeline('feature-extraction', model, {
    quantized: true, // 使用量化模型，更小更快
  })
  _localModelName = model

  return _localPipeline
}

async function embedViaLocal(texts: string[], config: LocalEmbeddingConfig): Promise<number[][]> {
  const pipe = await getLocalPipeline(config.model)
  const results: number[][] = []

  for (const text of texts) {
    const output = await pipe(text, { pooling: 'mean', normalize: true })
    results.push(Array.from(output.data) as number[])
  }

  return results
}

// ===== 统一入口 =====

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const config = await getActiveEmbeddingConfig()
  if (!config) {
    throw new Error(
      '未配置嵌入模型。请前往「设置 → 知识库」配置 API Key 或选择本地模型。'
    )
  }

  if (config.provider === 'api') {
    return embedViaAPI(texts, config)
  }

  return embedViaLocal(texts, config)
}

export async function embedText(text: string): Promise<number[]> {
  const embeddings = await embedTexts([text])
  return embeddings[0]
}

/**
 * 健康检查：测试当前配置是否可用
 */
export async function checkEmbedderHealth(): Promise<{
  ok: boolean
  provider?: string
  model?: string
  dim?: number
  error?: string
}> {
  const config = await getActiveEmbeddingConfig()
  if (!config) {
    return { ok: false, error: '未配置嵌入模型' }
  }

  try {
    const testEmbedding = await embedText('test')
    return {
      ok: true,
      provider: config.provider,
      model: config.model,
      dim: testEmbedding.length,
    }
  } catch (err) {
    return {
      ok: false,
      provider: config.provider,
      model: config.model,
      error: err instanceof Error ? err.message : '未知错误',
    }
  }
}
