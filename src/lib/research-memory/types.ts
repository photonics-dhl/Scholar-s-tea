/**
 * 研究记忆（Research Memory）类型定义
 * 全文和 embeddings 仅存浏览器 IndexedDB，服务器不存储
 */

export type MemoryType = 'IDEA' | 'PAPER_SUMMARY' | 'DISCUSSION' | 'QUESTION' | 'NOTES'

export interface ResearchMemory {
  id: string
  type: MemoryType
  title: string
  content: string
  tags: string[]
  discipline?: string
  /** 浏览器端生成的 embedding（可选，保存时自动生成） */
  embedding?: number[]
  createdAt: number
  updatedAt: number
}

export interface MemorySearchResult {
  memory: ResearchMemory
  similarity: number
}

export interface MemorySearchOptions {
  limit?: number
  threshold?: number
  type?: MemoryType
}
