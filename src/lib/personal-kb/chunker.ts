/**
 * 文本分块引擎
 * 策略：优先按段落分割，过长段落再按句子分割，最后按 token 窗口强制截断
 */

import type { DocumentChunk, ChunkerOptions } from './types'

const DEFAULT_OPTIONS: Required<ChunkerOptions> = {
  maxTokens: 512,
  overlapTokens: 64,
  respectParagraphs: true,
  respectSentences: true,
}

/**
 * 简单 token 估算（无需 tiktoken）
 * CJK ≈ 1 char/token, EN ≈ 4 chars/token
 */
export function estimateTokens(text: string): number {
  let tokens = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    // CJK Unified Ideographs + extensions
    const isCJK =
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0x20000 && code <= 0x2a6df) ||
      (code >= 0xf900 && code <= 0xfaff)
    tokens += isCJK ? 1 : 0.25
  }
  return Math.ceil(tokens)
}

/**
 * 按段落分割文本
 */
function splitByParagraphs(text: string): string[] {
  // 多种段落分隔符
  return text
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

/**
 * 按句子分割（支持中英文句号、问号、感叹号）
 */
function splitBySentences(text: string): string[] {
  // 匹配句子结束符后接空格或换行
  const sentences = text.split(/(?<=[。.！？\n])\s*/)
  return sentences.map((s) => s.trim()).filter((s) => s.length > 0)
}

/**
 * 核心分块函数
 */
export function chunkText(text: string, options: ChunkerOptions = {}): DocumentChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const maxChars = Math.floor(opts.maxTokens * 3.5) // 保守估算：1 token ≈ 2-4 chars
  const overlapChars = Math.floor(opts.overlapTokens * 3.5)

  const chunks: DocumentChunk[] = []
  let chunkId = 0
  let globalIndex = 0

  // 步骤1：按段落分割
  const paragraphs = splitByParagraphs(text)

  for (const paragraph of paragraphs) {
    const paraTokens = estimateTokens(paragraph)

    if (paraTokens <= opts.maxTokens) {
      // 段落足够短，直接作为一个 chunk
      const start = text.indexOf(paragraph, globalIndex)
      const end = start + paragraph.length
      globalIndex = end

      chunks.push({
        id: `chunk-${chunkId++}`,
        text: paragraph,
        startIndex: start,
        endIndex: end,
      })
      continue
    }

    // 段落过长，需要进一步分割
    if (opts.respectSentences) {
      // 步骤2：按句子分割
      const sentences = splitBySentences(paragraph)
      let currentChunk = ''
      let currentStart = text.indexOf(paragraph, globalIndex)
      let chunkStart = currentStart

      for (const sentence of sentences) {
        const candidate = currentChunk ? currentChunk + ' ' + sentence : sentence
        if (estimateTokens(candidate) > opts.maxTokens && currentChunk) {
          // 当前 chunk 已满，保存并开始新 chunk
          const end = chunkStart + currentChunk.length
          chunks.push({
            id: `chunk-${chunkId++}`,
            text: currentChunk.trim(),
            startIndex: chunkStart,
            endIndex: end,
          })

          // 重叠：保留最后 overlapTokens 的内容
          const overlapStart = Math.max(0, currentChunk.length - overlapChars)
          currentChunk = currentChunk.slice(overlapStart) + ' ' + sentence
          chunkStart = end - overlapChars
        } else {
          currentChunk = candidate
        }
      }

      // 保存最后一个 chunk
      if (currentChunk) {
        const end = chunkStart + currentChunk.length
        chunks.push({
          id: `chunk-${chunkId++}`,
          text: currentChunk.trim(),
          startIndex: chunkStart,
          endIndex: end,
        })
      }

      globalIndex = currentStart + paragraph.length
    } else {
      // 不尊重句子边界，直接按字符窗口切割
      let start = text.indexOf(paragraph, globalIndex)
      const paraEnd = start + paragraph.length

      while (start < paraEnd) {
        const end = Math.min(start + maxChars, paraEnd)
        const chunkText = text.slice(start, end)

        chunks.push({
          id: `chunk-${chunkId++}`,
          text: chunkText.trim(),
          startIndex: start,
          endIndex: end,
        })

        start = end - overlapChars
      }

      globalIndex = paraEnd
    }
  }

  return chunks
}

/**
 * 重新分块（用户编辑 chunk 后）
 */
export function rechunkDocument(
  fullText: string,
  editedChunks: DocumentChunk[],
  options: ChunkerOptions = {}
): DocumentChunk[] {
  // 如果有用户编辑的 chunks，保留用户修改的文本
  // 否则重新分块
  if (editedChunks.length > 0 && editedChunks.some((c) => c.text)) {
    // 用户已编辑，不做自动重新分块
    return editedChunks
  }
  return chunkText(fullText, options)
}

/**
 * 合并相邻 chunks
 */
export function mergeChunks(chunks: DocumentChunk[], indices: number[]): DocumentChunk[] {
  if (indices.length < 2) return chunks

  const sorted = [...indices].sort((a, b) => a - b)
  const mergedText = sorted.map((i) => chunks[i].text).join('\n\n')
  const startIndex = chunks[sorted[0]].startIndex
  const endIndex = chunks[sorted[sorted.length - 1]].endIndex

  const newChunk: DocumentChunk = {
    id: `chunk-merged-${Date.now()}`,
    text: mergedText,
    startIndex,
    endIndex,
  }

  // 移除被合并的 chunks，插入新 chunk
  const result = chunks.filter((_, i) => !indices.includes(i))
  result.splice(sorted[0], 0, newChunk)
  return result
}

/**
 * 拆分一个 chunk 为两个
 */
export function splitChunk(chunk: DocumentChunk): [DocumentChunk, DocumentChunk] {
  const mid = Math.floor(chunk.text.length / 2)
  // 尽量在句子边界拆分
  const splitPoint = findSplitPoint(chunk.text, mid)

  const first: DocumentChunk = {
    id: `${chunk.id}-a`,
    text: chunk.text.slice(0, splitPoint).trim(),
    startIndex: chunk.startIndex,
    endIndex: chunk.startIndex + splitPoint,
  }

  const second: DocumentChunk = {
    id: `${chunk.id}-b`,
    text: chunk.text.slice(splitPoint).trim(),
    startIndex: chunk.startIndex + splitPoint,
    endIndex: chunk.endIndex,
  }

  return [first, second]
}

function findSplitPoint(text: string, target: number): number {
  // 向前找最近的句子结束符
  const forward = text.slice(target).search(/[。.！？\n]/)
  if (forward !== -1) return target + forward + 1

  // 向后找
  const backward = text.slice(0, target).lastIndexOf('。')
  if (backward !== -1) return backward + 1

  // fallback: 直接在 target 处拆分
  return target
}
