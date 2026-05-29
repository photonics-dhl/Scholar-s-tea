/**
 * 个人知识库（Personal Knowledge Base）类型定义
 * 全文和 embeddings 仅存浏览器 IndexedDB，服务器只存元数据
 */

// ===== 服务器端元数据（PersonalDocument）=====

export interface PersonalDocumentMeta {
  id: string
  userId: string
  title: string
  authors?: string[]
  year?: number
  journal?: string
  doi?: string
  url?: string
  fileSize?: number
  pageCount?: number
  chunkCount: number
  keywords?: string[]
  abstract?: string
  sourceType: 'pdf' | 'txt' | 'arxiv' | 'doi' | 'manual'
  createdAt: string
  updatedAt: string
}

// ===== 客户端 IndexedDB 存储 =====

export interface DocumentChunk {
  id: string
  text: string
  embedding?: number[]
  startIndex: number // 在 fullText 中的起始位置
  endIndex: number
  pageNumber?: number
}

export interface LocalDocument {
  docId: string // 与服务器 PersonalDocument.id 对应
  fullText: string
  chunks: DocumentChunk[]
  extractedAt: number
  version: number // 数据结构版本号，用于迁移
  quality?: import('./pdf-extractor').PdfQualityReport
}

// ===== Embedding 配置 =====

export type EmbeddingProvider = 'api' | 'local'

export interface ApiEmbeddingConfig {
  provider: 'api'
  apiKey: string
  baseUrl: string
  model: string
}

export interface LocalEmbeddingConfig {
  provider: 'local'
  model: string // e.g. 'Xenova/all-MiniLM-L6-v2'
}

export type EmbeddingConfig = ApiEmbeddingConfig | LocalEmbeddingConfig

// ===== 搜索结果 =====

export interface PersonalKBSearchResult {
  chunk: DocumentChunk
  docMeta: PersonalDocumentMeta
  similarity: number
}

// ===== Chunker 配置 =====

export interface ChunkerOptions {
  maxTokens?: number // 默认 512
  overlapTokens?: number // 默认 64
  respectParagraphs?: boolean // 默认 true
  respectSentences?: boolean // 默认 true
}

// ===== 上传结果 =====

export interface UploadResult {
  success: boolean
  meta?: PersonalDocumentMeta
  localDoc?: LocalDocument
  error?: string
}
