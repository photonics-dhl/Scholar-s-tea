/**
 * 本地向量搜索
 * 从 IndexedDB 读取 chunks + embeddings，计算 cosine similarity，返回 top-k
 */

import type { PersonalKBSearchResult, DocumentChunk, PersonalDocumentMeta } from './types'
import { getAllLocalDocuments } from './storage'
import { embedText } from './embedder'

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
 * 搜索个人知识库
 * @param query 用户查询文本
 * @param options.limit 返回结果数量（默认 10）
 * @param options.threshold 相似度阈值（默认 0.5）
 * @param options.docIds 限定搜索范围（可选，用于元数据预筛选）
 */
export async function searchPersonalKB(
  query: string,
  options: {
    limit?: number
    threshold?: number
    docIds?: string[]
  } = {}
): Promise<PersonalKBSearchResult[]> {
  const { limit = 10, threshold = 0.5, docIds } = options

  // 1. 获取 query 的 embedding
  const queryEmbedding = await embedText(query)

  // 2. 读取所有本地文档
  const localDocs = await getAllLocalDocuments()

  // 3. 计算相似度
  const scored: Array<{ chunk: DocumentChunk; docId: string; similarity: number }> = []

  for (const localDoc of localDocs) {
    // 如果限定了 docIds，跳过不在范围内的
    if (docIds && !docIds.includes(localDoc.docId)) continue

    for (const chunk of localDoc.chunks) {
      if (!chunk.embedding || chunk.embedding.length === 0) continue

      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding)
      if (similarity >= threshold) {
        scored.push({ chunk, docId: localDoc.docId, similarity })
      }
    }
  }

  // 4. 排序并取 top-k
  scored.sort((a, b) => b.similarity - a.similarity)

  // 5. 去重：同一 chunk 不重复出现
  const seen = new Set<string>()
  const deduped: typeof scored = []
  for (const item of scored) {
    const key = `${item.docId}-${item.chunk.id}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(item)
    }
    if (deduped.length >= limit) break
  }

  // 6. 获取真实文档元数据
  const docIdSet = new Set(deduped.map((d) => d.docId))
  let metaMap = new Map<string, PersonalDocumentMeta>()
  try {
    const res = await fetch('/api/v1/personal-kb')
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        for (const doc of data.data) {
          if (docIdSet.has(doc.id)) {
            metaMap.set(doc.id, doc as PersonalDocumentMeta)
          }
        }
      }
    }
  } catch {
    // 元数据获取失败不影响搜索结果
  }

  return deduped.map((item) => ({
    chunk: item.chunk,
    docMeta: metaMap.get(item.docId) || {
      id: item.docId,
      userId: '',
      title: '未命名文献',
      chunkCount: 0,
      sourceType: 'pdf',
      createdAt: '',
      updatedAt: '',
    } as PersonalDocumentMeta,
    similarity: item.similarity,
  }))
}

/**
 * 为文档 chunks 批量生成 embeddings
 * 通常在用户上传文献后调用
 */
export async function embedDocumentChunks(
  docId: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const { getLocalDocument, saveLocalDocument } = await import('./storage')
  const doc = await getLocalDocument(docId)
  if (!doc) throw new Error(`Document ${docId} not found`)

  const texts = doc.chunks.map((c) => c.text)
  const { embedTexts } = await import('./embedder')

  // 分批生成，避免一次请求过大
  const batchSize = 50
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const embeddings = await embedTexts(batch)

    for (let j = 0; j < embeddings.length; j++) {
      doc.chunks[i + j].embedding = embeddings[j]
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, texts.length), texts.length)
    }
  }

  await saveLocalDocument(doc)
}
