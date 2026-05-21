/**
 * Scholar's Tea — 引用验证模块 (Citation Verifier)
 *
 * 解决 AI 幻觉引用问题：
 * 1. 提取文本中的引用占位符 [REF-N] 和自由文本引用
 * 2. 通过 Semantic Scholar API 搜索验证文献是否存在
 * 3. 返回验证结果和替换后的文本
 *
 * 与 paper-enhancement.ts 的区别：
 * - paper-enhancement: AI 自评引用可信度（不可靠，~40% 错误率）
 * - citation-verifier: 对接真实学术数据库做实时校验
 */

import type { PaperRef } from './paper-enhancement'
import { fetchWithProxyAndTimeout } from '@/lib/utils/fetch-with-proxy'

// =============================================================================
// 配置
// =============================================================================

const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1/paper/search'
const S2_API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY || ''
const VERIFY_TIMEOUT = 15000 // 单次搜索超时
const MAX_CITATIONS_TO_VERIFY = 20 // 最大验证引用数，防止长文本产生无限API调用

// =============================================================================
// 类型定义
// =============================================================================

export interface CitationMatch {
  /** 原文中的引用文本 */
  rawText: string
  /** 提取的论文标题（如果有） */
  extractedTitle?: string
  /** 提取的作者（如果有） */
  extractedAuthors?: string[]
  /** 提取的年份（如果有） */
  extractedYear?: number
  /** Semantic Scholar 匹配结果 */
  matchedPaper?: SemanticScholarPaper
  /** 匹配可信度：confirmed / probable / unverified */
  status: 'confirmed' | 'probable' | 'unverified'
  /** 匹配分数（0-1） */
  score: number
}

export interface CitationVerificationReport {
  /** 验证后的文本（占位符替换为真实引用或标记） */
  verifiedText: string
  /** 所有引用匹配结果 */
  citations: CitationMatch[]
  /** 已确认的引用数量 */
  confirmedCount: number
  /** 存疑的引用数量 */
  probableCount: number
  /** 无法验证的引用数量 */
  unverifiedCount: number
  /** 总体可信度评分（0-100） */
  credibilityScore: number
}

interface SemanticScholarPaper {
  paperId: string
  title: string
  authors: Array<{ name: string }>
  year?: number
  venue?: string
  citationCount?: number
  openAccessPdf?: { url: string }
  abstract?: string
}

// =============================================================================
// Semantic Scholar API 调用
// =============================================================================

/**
 * 通过 Semantic Scholar API 搜索论文
 */
async function searchSemanticScholar(
  query: string,
  options?: { year?: number; authors?: string[] }
): Promise<SemanticScholarPaper | null> {
  try {
    const params = new URLSearchParams()
    params.set('query', query)
    params.set('fields', 'paperId,title,authors,year,venue,citationCount,openAccessPdf,abstract')
    params.set('limit', '5')

    const headers: Record<string, string> = {}
    if (S2_API_KEY) {
      headers['x-api-key'] = S2_API_KEY
    }

    const response = await fetchWithProxyAndTimeout(
      `${SEMANTIC_SCHOLAR_API}?${params.toString()}`,
      { headers },
      VERIFY_TIMEOUT
    )

    if (!response.ok) {
      console.warn('[CitationVerifier] S2 API error:', response.status)
      return null
    }

    const data = await response.json()
    const papers: SemanticScholarPaper[] = data.data || []

    if (papers.length === 0) return null

    // 如果有年份或作者信息，优先匹配
    let bestMatch = papers[0]
    let bestScore = 0

    for (const paper of papers) {
      let score = 0

      // 标题相似度（简单匹配）
      const queryLower = query.toLowerCase()
      const titleLower = paper.title.toLowerCase()
      if (titleLower === queryLower) score += 1.0
      else if (titleLower.includes(queryLower) || queryLower.includes(titleLower)) score += 0.8
      else {
        // 词级别匹配
        const queryWords = queryLower.split(/\s+/)
        const titleWords = titleLower.split(/\s+/)
        const commonWords = queryWords.filter((w) => titleWords.includes(w))
        score += commonWords.length / Math.max(queryWords.length, titleWords.length) * 0.6
      }

      // 年份匹配
      if (options?.year && paper.year === options.year) score += 0.2

      // 作者匹配
      if (options?.authors && options.authors.length > 0 && paper.authors) {
        const paperAuthorNames = paper.authors.map((a) => a.name.toLowerCase())
        const hasAuthorMatch = options.authors.some((a) =>
          paperAuthorNames.some((pa) => pa.includes(a.toLowerCase()) || a.toLowerCase().includes(pa))
        )
        if (hasAuthorMatch) score += 0.2
      }

      // 引用量加分（高被引论文更可能是真实存在的）
      if (paper.citationCount && paper.citationCount > 50) score += 0.05

      if (score > bestScore) {
        bestScore = score
        bestMatch = paper
      }
    }

    // 阈值：只有分数足够高才认为是匹配
    if (bestScore < 0.3) return null

    return bestMatch
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[CitationVerifier] S2 API timeout')
    } else {
      console.error('[CitationVerifier] S2 search error:', error)
    }
    return null
  }
}

/**
 * 通过 paper ID 获取详细信息（用于二次验证）
 */
async function getPaperById(paperId: string): Promise<SemanticScholarPaper | null> {
  try {
    const headers: Record<string, string> = {}
    if (S2_API_KEY) {
      headers['x-api-key'] = S2_API_KEY
    }

    const response = await fetchWithProxyAndTimeout(
      `https://api.semanticscholar.org/graph/v1/paper/${paperId}?fields=title,authors,year,venue,citationCount,abstract`,
      { headers },
      VERIFY_TIMEOUT
    )

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

// =============================================================================
// 引用提取
// =============================================================================

/** 提取 [REF-N] 占位符 */
function extractRefPlaceholders(text: string): Array<{ placeholder: string; surroundingText: string }> {
  const matches: Array<{ placeholder: string; surroundingText: string }> = []
  const regex = /\[REF-(\d+)\]/g
  let match

  while ((match = regex.exec(text)) !== null) {
    const placeholder = match[0]
    const start = Math.max(0, match.index - 200)
    const end = Math.min(text.length, match.index + 200)
    matches.push({
      placeholder,
      surroundingText: text.slice(start, end),
    })
  }

  return matches
}

/** 提取自由文本中的引用（如 "Smith et al., 2020" 或 "Vaswani et al. (2017)"） */
function extractFreeTextCitations(text: string): Array<{
  rawText: string
  authors: string[]
  year?: number
  title?: string
}> {
  const citations: Array<{ rawText: string; authors: string[]; year?: number; title?: string }> = []

  // 模式1: Author et al., Year
  // 模式2: (Author et al., Year)
  // 模式3: [Author, Year]
  const patterns = [
    // "Vaswani et al., 2017" 或 "Vaswani et al. 2017"
    {
      regex: /([A-Z][a-z]+(?:\s+et\s+al\.?)?(?:,|\s)+\s*(\d{4}))/g,
      extract: (m: RegExpMatchArray) => ({
        rawText: m[0],
        authors: m[1].split(/(?:,|\s+et\s+al\.?)/)[0].trim() ? [m[1].split(/(?:,|\s+et\s+al\.?)/)[0].trim()] : [],
        year: parseInt(m[2]),
      }),
    },
    // "Attention Is All You Need" (引号中的论文标题)
    {
      regex: /"([^"]{10,120})"\s*(?:\([^)]*\d{4}[^)]*\))?/g,
      extract: (m: RegExpMatchArray) => ({
        rawText: m[0],
        authors: [],
        title: m[1].trim(),
      }),
    },
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.regex.exec(text)) !== null) {
      const extracted = pattern.extract(match)
      // 去重
      if (!citations.some((c) => c.rawText === extracted.rawText)) {
        citations.push(extracted)
      }
    }
  }

  return citations
}

/** 从 surrounding text 中推测论文标题 */
function extractTitleFromContext(surroundingText: string): string | undefined {
  // 尝试找到引号中的标题
  const quotedMatch = surroundingText.match(/"([^"]{10,120})"/)
  if (quotedMatch) return quotedMatch[1].trim()

  // 尝试找到 " titled " 或 " entitled " 后的标题
  const titledMatch = surroundingText.match(/(?:titled|entitled|called)\s+["']?([^"'.]{10,120})["']?/i)
  if (titledMatch) return titledMatch[1].trim()

  // 从 surrounding text 中提取句子，尝试作为标题
  const sentences = surroundingText
    .split(/[.!?。！？]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.length < 150)
  if (sentences.length > 0) {
    // 返回最长的一句（很可能是描述论文的）
    return sentences.sort((a, b) => b.length - a.length)[0]
  }

  return undefined
}

// =============================================================================
// 验证主流程
// =============================================================================

/**
 * 验证文本中的引用
 *
 * @param text 待验证文本
 * @param topic 论文主题（用于辅助搜索）
 * @returns 验证报告
 */
export async function verifyCitationsRealTime(
  text: string,
  topic?: string
): Promise<CitationVerificationReport> {
  const refPlaceholders = extractRefPlaceholders(text).slice(0, MAX_CITATIONS_TO_VERIFY)
  const freeTextCitations = extractFreeTextCitations(text).slice(0, MAX_CITATIONS_TO_VERIFY)

  const citations: CitationMatch[] = []

  // 处理 [REF-N] 占位符
  for (const ref of refPlaceholders) {
    const title = extractTitleFromContext(ref.surroundingText)
    const authors = extractFreeTextCitations(ref.surroundingText)
      .flatMap((c) => c.authors)
      .filter(Boolean)

    let matchedPaper: SemanticScholarPaper | null = null
    let status: CitationMatch['status'] = 'unverified'
    let score = 0

    if (title) {
      matchedPaper = await searchSemanticScholar(title, {
        authors: authors.length > 0 ? authors : undefined,
      })
    }

    // 如果标题搜索失败，尝试用 surrounding text 整体搜索
    if (!matchedPaper && ref.surroundingText.length > 20) {
      const searchQuery = topic
        ? `${topic} ${ref.surroundingText.slice(0, 150)}`
        : ref.surroundingText.slice(0, 150)
      matchedPaper = await searchSemanticScholar(searchQuery)
    }

    if (matchedPaper) {
      // 二次验证：标题相似度判断
      if (title) {
        const titleLower = title.toLowerCase()
        const matchedLower = matchedPaper.title.toLowerCase()
        if (matchedLower === titleLower || matchedLower.includes(titleLower) || titleLower.includes(matchedLower)) {
          status = 'confirmed'
          score = 0.9
        } else {
          status = 'probable'
          score = 0.6
        }
      } else {
        status = 'probable'
        score = 0.5
      }
    }

    citations.push({
      rawText: ref.placeholder,
      extractedTitle: title,
      extractedAuthors: authors.length > 0 ? authors : undefined,
      matchedPaper: matchedPaper || undefined,
      status,
      score,
    })
  }

  // 处理自由文本引用（限制总数，防止无限API调用）
  let processedCount = refPlaceholders.length
  for (const freeRef of freeTextCitations) {
    if (processedCount >= MAX_CITATIONS_TO_VERIFY) break
    // 跳过已经处理过的
    if (citations.some((c) => c.rawText === freeRef.rawText)) continue

    const searchQuery = freeRef.title || `${freeRef.authors.join(' ')} ${freeRef.year || ''} ${topic || ''}`.trim()

    const matchedPaper = searchQuery.length > 5
      ? await searchSemanticScholar(searchQuery, {
          year: freeRef.year,
          authors: freeRef.authors.length > 0 ? freeRef.authors : undefined,
        })
      : null

    citations.push({
      rawText: freeRef.rawText,
      extractedTitle: freeRef.title,
      extractedAuthors: freeRef.authors.length > 0 ? freeRef.authors : undefined,
      extractedYear: freeRef.year,
      matchedPaper: matchedPaper || undefined,
      status: matchedPaper ? 'confirmed' : 'unverified',
      score: matchedPaper ? 0.8 : 0,
    })
    processedCount++
  }

  // 生成验证后的文本
  let verifiedText = text
  const unverifiedRefs: string[] = []

  for (const citation of citations) {
    if (citation.status === 'unverified') {
      unverifiedRefs.push(citation.rawText)
      // 将 [REF-N] 替换为 [CITATION NEEDED]
      verifiedText = verifiedText.replaceAll(citation.rawText, '[CITATION NEEDED]')
    } else if (citation.matchedPaper) {
      // 构建真实引用格式
      const paper = citation.matchedPaper
      const authors = paper.authors.map((a) => a.name).join(', ')
      const realCitation = `${authors}${paper.year ? ` (${paper.year})` : ''}. ${paper.title}${paper.venue ? `. ${paper.venue}` : ''}`

      // 替换占位符为真实引用（包含原始 REF 编号以便追溯）
      if (citation.rawText.startsWith('[REF-')) {
        // 保留 REF 编号但附加真实引用信息
        const refNum = citation.rawText.match(/\[REF-(\d+)\]/)?.[1]
        if (refNum) {
          verifiedText = verifiedText.replaceAll(
            citation.rawText,
            `[REF-${refNum}: ${realCitation}]`
          )
        } else {
          verifiedText = verifiedText.replaceAll(citation.rawText, `[${realCitation}]`)
        }
      } else {
        verifiedText = verifiedText.replaceAll(citation.rawText, `[${realCitation}]`)
      }
    }
  }

  const confirmedCount = citations.filter((c) => c.status === 'confirmed').length
  const probableCount = citations.filter((c) => c.status === 'probable').length
  const unverifiedCount = citations.filter((c) => c.status === 'unverified').length
  const total = citations.length || 1

  const credibilityScore = Math.round(
    ((confirmedCount * 1.0 + probableCount * 0.5 + unverifiedCount * 0) / total) * 100
  )

  return {
    verifiedText,
    citations,
    confirmedCount,
    probableCount,
    unverifiedCount,
    credibilityScore,
  }
}

// =============================================================================
// 高阶 API：批量验证 + 格式化报告
// =============================================================================

/**
 * 为 Workshop 论文生成结果生成引用验证报告
 *
 * @param generatedText AI 生成的论文文本
 * @param topic 论文主题
 * @returns 带格式化报告的验证结果
 */
export async function verifyAndReport(
  generatedText: string,
  topic?: string
): Promise<CitationVerificationReport & { summary: string }> {
  const report = await verifyCitationsRealTime(generatedText, topic)

  const summary = `【引用验证报告】
- 总引用数：${report.citations.length}
- 已确认：${report.confirmedCount}
- 存疑：${report.probableCount}
- 无法验证：${report.unverifiedCount}
- 可信度评分：${report.credibilityScore}/100

${report.unverifiedCount > 0
    ? `⚠️ 有 ${report.unverifiedCount} 个引用无法验证，已标记为 [CITATION NEEDED]。建议通过 Semantic Scholar 或 Google Scholar 补充真实引用。`
    : '✅ 所有引用均已通过 Semantic Scholar 验证。'
  }

${report.citations
    .filter((c) => c.status !== 'unverified' && c.matchedPaper)
    .map((c) => {
      const p = c.matchedPaper!
      const authors = p.authors.map((a) => a.name).join(', ')
      return `- ✓ ${c.rawText} → ${authors}${p.year ? ` (${p.year})` : ''}. ${p.title}${p.venue ? `. ${p.venue}` : ''}`
    })
    .join('\n')}`

  return { ...report, summary }
}

/**
 * 将 Semantic Scholar 论文转换为内部 PaperRef 格式
 */
export function toPaperRef(paper: SemanticScholarPaper): PaperRef {
  return {
    id: paper.paperId,
    title: paper.title,
    authors: paper.authors.map((a) => a.name),
    year: paper.year,
    venue: paper.venue,
    citationCount: paper.citationCount,
    abstract: paper.abstract?.slice(0, 500),
  }
}
