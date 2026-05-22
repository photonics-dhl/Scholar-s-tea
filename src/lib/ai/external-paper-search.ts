/**
 * Scholar's Tea — 外部学术文献检索服务
 *
 * 在论文生成前检索真实学术文献，注入 prompt 以解决 AI 幻觉问题。
 *
 * 检索源（按优先级）：
 * 1. Semantic Scholar API — 覆盖广、元数据丰富、可免 key 使用
 * 2. arXiv API — 物理/数学/CS 领域覆盖度高、全文可获取
 * 3. Tavily Web Search — 补充检索综述、新闻、博客等
 *
 * 使用方式：
 * ```ts
 * const papers = await searchPapersForTopic('metasurface beam steering', 10);
 * const enrichedPrompt = injectPapersIntoPrompt(prompt, papers);
 * ```
 */

// =============================================================================
// 类型定义
// =============================================================================

export interface ExternalPaper {
  id: string
  title: string
  authors: string[]
  year?: number
  venue?: string
  abstract?: string
  url?: string
  pdfUrl?: string
  citationCount?: number
  source: 'semantic_scholar' | 'arxiv' | 'tavily'
  /** 匹配分数（0-1） */
  relevanceScore?: number
}

export interface PaperSearchResult {
  papers: ExternalPaper[]
  totalFound: number
  sources: string[]
  query: string
}

export interface SearchOptions {
  /** 检索结果数量上限 */
  limit?: number
  /** 起始年份过滤 */
  yearFrom?: number
  /** 结束年份过滤 */
  yearTo?: number
  /** 学科领域过滤 */
  fieldsOfStudy?: string[]
  /** 是否包含摘要 */
  includeAbstract?: boolean
  /** 是否按引用量排序 */
  sortByCitations?: boolean
}

// =============================================================================
// 配置
// =============================================================================

import { fetchWithProxyAndTimeout } from '@/lib/utils/fetch-with-proxy'

const S2_API_BASE = 'https://api.semanticscholar.org/graph/v1'
const S2_API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY || ''
const S2_TIMEOUT = 15000

const ARXIV_API_BASE = 'http://export.arxiv.org/api/query'
const ARXIV_TIMEOUT = 15000

const TAVILY_API_BASE = 'https://api.tavily.com'
const TAVILY_TIMEOUT = 15000

/**
 * 收集所有可用的 Tavily API key
 * 支持 TAVILY_API_KEY 以及 TAVILY_API_KEY_1 ~ TAVILY_API_KEY_4
 */
function getTavilyKeys(): string[] {
  const keys: string[] = []
  const mainKey = process.env.TAVILY_API_KEY
  if (mainKey) keys.push(mainKey)
  for (let i = 1; i <= 4; i++) {
    const key = process.env[`TAVILY_API_KEY_${i}`]
    if (key && !keys.includes(key)) keys.push(key)
  }
  return keys
}

/** 避免重复 API 调用的内存缓存（5 分钟） */
const _cache = new Map<string, { data: PaperSearchResult; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

function getCached(key: string): PaperSearchResult | undefined {
  const entry = _cache.get(key)
  if (entry && entry.expiresAt > Date.now()) return entry.data
  if (entry) _cache.delete(key)
  return undefined
}

function setCache(key: string, data: PaperSearchResult): void {
  _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

// =============================================================================
// Semantic Scholar API
// =============================================================================

interface S2SearchResponse {
  data?: Array<{
    paperId: string
    title: string
    authors: Array<{ name: string }>
    year?: number
    venue?: string
    citationCount?: number
    abstract?: string
    openAccessPdf?: { url: string }
    fieldsOfStudy?: string[]
  }>
  total?: number
}

/**
 * 通过 Semantic Scholar API 搜索论文
 *
 * 无需 API key 也可使用（rate limit: 100 req/5min）
 */
export async function searchSemanticScholar(
  query: string,
  options?: SearchOptions
): Promise<ExternalPaper[]> {
  try {
    const limit = options?.limit || 10
    const fields = [
      'paperId',
      'title',
      'authors',
      'year',
      'venue',
      'citationCount',
      'abstract',
      'openAccessPdf',
      'fieldsOfStudy',
    ].join(',')

    const params = new URLSearchParams()
    params.set('query', query)
    params.set('fields', fields)
    params.set('limit', String(limit))

    if (options?.yearFrom) params.set('publicationDateOrYear', `${options.yearFrom}:${options.yearTo || ''}`)

    const headers: Record<string, string> = {}
    if (S2_API_KEY) headers['x-api-key'] = S2_API_KEY

    const response = await fetchWithProxyAndTimeout(
      `${S2_API_BASE}/paper/search?${params.toString()}`,
      { headers },
      S2_TIMEOUT
    )

    if (!response.ok) {
      console.warn('[ExternalPaperSearch] S2 API error:', response.status, await response.text().catch(() => ''))
      return []
    }

    const data: S2SearchResponse = await response.json()
    const papers = (data.data || [])
      .filter((p) => p.title && p.title.length > 5)
      .map((p) => {
        const paper: ExternalPaper = {
          id: p.paperId,
          title: p.title,
          authors: p.authors?.map((a) => a.name).filter(Boolean) || [],
          year: p.year,
          venue: p.venue,
          abstract: p.abstract?.slice(0, 800),
          url: `https://www.semanticscholar.org/paper/${p.paperId}`,
          pdfUrl: p.openAccessPdf?.url,
          citationCount: p.citationCount,
          source: 'semantic_scholar',
        }
        return paper
      })

    // 按引用量排序（如果要求）
    if (options?.sortByCitations) {
      papers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
    }

    return papers
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[ExternalPaperSearch] S2 API timeout')
    } else {
      console.error('[ExternalPaperSearch] S2 search error:', error)
    }
    return []
  }
}

// =============================================================================
// arXiv API
// =============================================================================

/**
 * 通过 arXiv API 搜索论文
 *
 * 无需 API key，返回 Atom XML 格式
 */
export async function searchArxiv(
  query: string,
  options?: SearchOptions
): Promise<ExternalPaper[]> {
  try {
    const limit = Math.min(options?.limit || 10, 50)

    // 构建 arXiv 查询语法
    // 支持 AND/OR/NOT，但这里做简单包装
    const searchQuery = query
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((w) => `all:${w}`)
      .join(' AND ')

    const params = new URLSearchParams()
    params.set('search_query', searchQuery)
    params.set('start', '0')
    params.set('max_results', String(limit))
    params.set('sortBy', options?.sortByCitations ? 'cited' : 'relevance')
    params.set('sortOrder', 'descending')

    const response = await fetchWithProxyAndTimeout(
      `${ARXIV_API_BASE}?${params.toString()}`,
      {},
      ARXIV_TIMEOUT
    )

    if (!response.ok) {
      console.warn('[ExternalPaperSearch] arXiv API error:', response.status)
      return []
    }

    const xml = await response.text()
    return parseArxivXml(xml)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[ExternalPaperSearch] arXiv API timeout')
    } else {
      console.error('[ExternalPaperSearch] arXiv search error:', error)
    }
    return []
  }
}

function parseArxivXml(xml: string): ExternalPaper[] {
  const papers: ExternalPaper[] = []

  // 简单 XML 解析：提取 entry 元素
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match: RegExpExecArray | null

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1]

    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/)
    const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/)
    const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/)
    const publishedMatch = entry.match(/<published>(\d{4})/)
    const pdfMatch = entry.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"/)

    // 提取作者
    const authors: string[] = []
    const authorRegex = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g
    let authorMatch: RegExpExecArray | null
    while ((authorMatch = authorRegex.exec(entry)) !== null) {
      authors.push(authorMatch[1].trim())
    }

    if (titleMatch) {
      const paper: ExternalPaper = {
        id: idMatch ? idMatch[1].trim().split('/').pop() || '' : '',
        title: titleMatch[1].trim().replace(/\s+/g, ' '),
        authors,
        year: publishedMatch ? parseInt(publishedMatch[1]) : undefined,
        abstract: summaryMatch ? summaryMatch[1].trim().replace(/\s+/g, ' ').slice(0, 800) : undefined,
        url: idMatch ? idMatch[1].trim() : undefined,
        pdfUrl: pdfMatch ? pdfMatch[1] : undefined,
        source: 'arxiv',
      }
      papers.push(paper)
    }
  }

  return papers
}

// =============================================================================
// Tavily Web Search（补充检索）
// =============================================================================

interface TavilySearchResponse {
  results?: Array<{
    title: string
    url: string
    content: string
    score: number
  }>
  answer?: string
}

/**
 * 通过 Tavily API 搜索学术相关内容
 *
 * Tavily 的优势：可以搜索到综述博客、新闻报道、机构页面等非论文内容
 * 用于补充论文检索的盲区
 */
export async function searchTavily(
  query: string,
  options?: SearchOptions
): Promise<ExternalPaper[]> {
  const keys = getTavilyKeys()
  if (keys.length === 0) {
    console.warn('[ExternalPaperSearch] Tavily API key not configured')
    return []
  }

  for (let idx = 0; idx < keys.length; idx++) {
    const key = keys[idx]
    try {
      const response = await fetchWithProxyAndTimeout(
        `${TAVILY_API_BASE}/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: key,
            query: `${query} research paper academic`,
            search_depth: 'advanced',
            max_results: options?.limit || 8,
            include_answer: false,
            include_images: false,
          }),
        },
        TAVILY_TIMEOUT
      )

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        const isQuotaError = errText.toLowerCase().includes('usage limit') || errText.toLowerCase().includes('exceeds')
        if (isQuotaError && idx < keys.length - 1) {
          console.warn(`[ExternalPaperSearch] Tavily key ${idx + 1}/${keys.length} quota exhausted, trying next...`)
          continue
        }
        console.warn('[ExternalPaperSearch] Tavily API error:', response.status, errText.slice(0, 200))
        return []
      }

      const data: TavilySearchResponse = await response.json()
      const papers: ExternalPaper[] = (data.results || [])
        .filter((r) => r.title && r.title.length > 5)
        .map((r) => ({
          id: `tavily-${Buffer.from(r.url).toString('base64').slice(0, 16)}`,
          title: r.title,
          authors: [], // Tavily 不返回作者信息
          abstract: r.content?.slice(0, 500),
          url: r.url,
          source: 'tavily',
          relevanceScore: r.score,
        }))

      if (papers.length > 0) {
      }
      return papers
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`[ExternalPaperSearch] Tavily key ${idx + 1} timeout`)
      } else {
        console.error(`[ExternalPaperSearch] Tavily key ${idx + 1} error:`, error)
      }
      // 继续尝试下一个 key
    }
  }

  console.error('[ExternalPaperSearch] All Tavily keys failed')
  return []
}

// =============================================================================
// 统一检索入口
// =============================================================================

/**
 * 为论文主题检索真实学术文献
 *
 * 策略：
 * 1. 并行调用 Semantic Scholar + arXiv + Tavily
 * 2. 去重（按标题相似度）
 * 3. 按相关性和引用量排序
 * 4. 返回 top N
 *
 * @param topic 论文主题/关键词
 * @param options 检索选项
 * @returns 检索结果（含真实论文信息）
 */
export async function searchPapersForTopic(
  topic: string,
  options?: SearchOptions
): Promise<PaperSearchResult> {
  const cacheKey = `papers:${topic}:${options?.limit || 10}:${options?.yearFrom || ''}:${options?.yearTo || ''}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const limit = options?.limit || 10


  // 并行检索三个来源
  const [s2Papers, arxivPapers, tavilyPapers] = await Promise.all([
    searchSemanticScholar(topic, { ...options, limit: Math.max(limit, 15) }).catch((err) => {
      console.warn('[ExternalPaperSearch] S2 failed:', err)
      return []
    }),
    searchArxiv(topic, { ...options, limit: Math.max(limit, 10) }).catch((err) => {
      console.warn('[ExternalPaperSearch] arXiv failed:', err)
      return []
    }),
    searchTavily(topic, { ...options, limit: Math.max(limit, 8) }).catch((err) => {
      console.warn('[ExternalPaperSearch] Tavily failed:', err)
      return []
    }),
  ])

  // 合并并去重
  const allPapers: ExternalPaper[] = []
  const seenTitles = new Set<string>()

  function normalizeTitle(title: string): string {
    return title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
  }

  function isDuplicate(paper: ExternalPaper): boolean {
    const normalized = normalizeTitle(paper.title)
    if (seenTitles.has(normalized)) return true
    // 模糊匹配：检查与已有标题的相似度
    const seenArray = Array.from(seenTitles)
    for (let i = 0; i < seenArray.length; i++) {
      const seen = seenArray[i]
      // 简单包含检查
      if (normalized.includes(seen) || seen.includes(normalized)) {
        if (Math.abs(normalized.length - seen.length) < Math.max(normalized.length, seen.length) * 0.3) {
          return true
        }
      }
    }
    seenTitles.add(normalized)
    return false
  }

  // 按优先级合并：Semantic Scholar > arXiv > Tavily
  for (const p of s2Papers) if (!isDuplicate(p)) allPapers.push(p)
  for (const p of arxivPapers) if (!isDuplicate(p)) allPapers.push(p)
  for (const p of tavilyPapers) if (!isDuplicate(p)) allPapers.push(p)

  // 排序：有引用量 > 有年份 > 有摘要 > 其他
  allPapers.sort((a, b) => {
    const scoreA = (a.citationCount || 0) * 0.5 + (a.year || 0) * 0.01 + (a.abstract ? 10 : 0) + (a.authors.length > 0 ? 5 : 0)
    const scoreB = (b.citationCount || 0) * 0.5 + (b.year || 0) * 0.01 + (b.abstract ? 10 : 0) + (b.authors.length > 0 ? 5 : 0)
    return scoreB - scoreA
  })

  // 取 top N
  const finalPapers = allPapers.slice(0, limit)

  const result: PaperSearchResult = {
    papers: finalPapers,
    totalFound: s2Papers.length + arxivPapers.length + tavilyPapers.length,
    sources: [
      s2Papers.length > 0 ? 'semantic_scholar' : '',
      arxivPapers.length > 0 ? 'arxiv' : '',
      tavilyPapers.length > 0 ? 'tavily' : '',
    ].filter(Boolean),
    query: topic,
  }

  setCache(cacheKey, result)

  return result
}

/**
 * 将检索到的论文注入到 prompt 中
 *
 * 生成的格式：
 * 【检索到的相关文献（真实学术数据库结果）】
 * [1] 作者. "标题" [J]. 期刊, 年份.
 *   摘要：...
 *   被引次数：...
 *
 * 【约束】
 * 以上文献来自真实检索，请优先引用。如需引用其他文献，标注 [CITATION NEEDED]。
 */
export function injectPapersIntoPrompt(prompt: string, papers: ExternalPaper[]): string {
  if (papers.length === 0) return prompt

  const paperSection = papers
    .map((p, i) => {
      const authors = p.authors.length > 0 ? p.authors.join(', ') : 'Unknown'
      const year = p.year ? `, ${p.year}` : ''
      const venue = p.venue ? `. *${p.venue}*` : ''
      const citations = p.citationCount ? ` (被引 ${p.citationCount} 次)` : ''
      const abstract = p.abstract ? `\n  摘要：${p.abstract.slice(0, 200)}${p.abstract.length > 200 ? '...' : ''}` : ''
      const url = p.url ? `\n  链接：${p.url}` : ''

      return `[${i + 1}] ${authors}${year}. "${p.title}"${venue}${citations}${abstract}${url}`
    })
    .join('\n\n')

  const injection = `【检索到的真实文献（来自 ${papers[0]?.source === 'semantic_scholar' ? 'Semantic Scholar' : papers[0]?.source === 'arxiv' ? 'arXiv' : 'Tavily'} 等学术数据库）】

以下文献是通过学术搜索引擎实时检索到的真实论文。请在撰写时优先基于这些文献进行引用和分析。

${paperSection}

【引用约束】
- 优先使用上述真实文献，引用格式：[REF-N]（对应上方编号）
- 如果你需要引用上述列表之外的文献，必须确保该文献真实存在
- 对于无法确认真实性的任何陈述，标注 [CITATION NEEDED]
- 禁止编造作者名、期刊名、卷期号、DOI 或实验数据

---

`

  return injection + prompt
}

/**
 * 构建带外部文献检索增强的 prompt
 *
 * 这是高阶 API：一步完成检索 + 注入
 */
export async function buildPromptWithPaperSearch(
  prompt: string,
  topic: string,
  options?: SearchOptions
): Promise<{ prompt: string; papers: ExternalPaper[] }> {
  const result = await searchPapersForTopic(topic, options)
  const enrichedPrompt = injectPapersIntoPrompt(prompt, result.papers)
  return { prompt: enrichedPrompt, papers: result.papers }
}

/**
 * 为论文生成各阶段选择合适的检索策略
 */
export function getSearchStrategyForStage(
  stage: 'proposal' | 'structure' | 'writing' | 'data' | 'formatting'
): SearchOptions {
  switch (stage) {
    case 'proposal':
      // 选题阶段：检索高被引综述，了解领域全貌
      return {
        limit: 15,
        yearFrom: new Date().getFullYear() - 5,
        sortByCitations: true,
        includeAbstract: true,
      }
    case 'structure':
      // 架构阶段：检索近期顶刊论文
      return {
        limit: 12,
        yearFrom: new Date().getFullYear() - 3,
        sortByCitations: true,
        includeAbstract: true,
      }
    case 'writing':
      // 写作阶段：检索细分方向的论文
      return {
        limit: 10,
        yearFrom: new Date().getFullYear() - 5,
        sortByCitations: false,
        includeAbstract: true,
      }
    case 'data':
      // 数据分析阶段：检索方法论论文
      return {
        limit: 8,
        yearFrom: new Date().getFullYear() - 10,
        sortByCitations: true,
        includeAbstract: true,
      }
    case 'formatting':
      // 排版阶段不需要检索
      return { limit: 0 }
    default:
      return { limit: 10 }
  }
}
