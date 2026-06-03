/**
 * 研究记忆浏览器端向量搜索
 * 复用 personal-kb 的 embedder，计算 cosine similarity
 */

import type { ResearchMemory, MemorySearchResult, MemorySearchOptions } from './types'
import { getAllMemories, saveMemory } from './storage'
import { embedText } from '@/lib/personal-kb/embedder'

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * 搜索研究记忆
 * 如果 embedder 未配置或失败，返回空数组（优雅降级）
 */
export async function searchResearchMemories(
  query: string,
  options: MemorySearchOptions = {}
): Promise<MemorySearchResult[]> {
  const { limit = 3, threshold = 0.5, type } = options

  try {
    const queryEmbedding = await embedText(query)
    if (!queryEmbedding || queryEmbedding.length === 0) {
      return []
    }

    const memories = await getAllMemories()
    const scored: MemorySearchResult[] = []

    for (const memory of memories) {
      if (type && memory.type !== type) continue
      if (!memory.embedding || memory.embedding.length === 0) continue

      const similarity = cosineSimilarity(queryEmbedding, memory.embedding)
      if (similarity >= threshold) {
        scored.push({ memory, similarity })
      }
    }

    scored.sort((a, b) => b.similarity - a.similarity)
    return scored.slice(0, limit)
  } catch (err) {
    // embedder 未配置或失败时，静默降级
    console.warn('[ResearchMemory] Search skipped:', err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * 为单条记忆生成 embedding 并保存
 */
export async function embedMemory(memory: ResearchMemory): Promise<void> {
  try {
    const text = `${memory.title} ${memory.content} ${memory.tags.join(' ')}`
    const embedding = await embedText(text)
    memory.embedding = embedding
    memory.updatedAt = Date.now()
    await saveMemory(memory)
  } catch (err) {
    console.warn('[ResearchMemory] Embed failed:', err instanceof Error ? err.message : err)
    // 保存但不带 embedding
    await saveMemory(memory)
  }
}

/**
 * 为所有无 embedding 的记忆批量生成嵌入
 */
export async function reindexAllMemories(
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const memories = await getAllMemories()
  const toIndex = memories.filter((m) => !m.embedding || m.embedding.length === 0)

  for (let i = 0; i < toIndex.length; i++) {
    await embedMemory(toIndex[i])
    onProgress?.(i + 1, toIndex.length)
  }
}
