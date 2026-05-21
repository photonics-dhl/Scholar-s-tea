/**
 * Scholar's Tea — 论文生成增强服务
 *
 * 为 AI 论文生成提供：
 * 1. RAG 增强：生成前检索社区论文库，注入真实文献上下文
 * 2. 引用验证：生成后验证 [REF-N] 占位符，替换为真实引用或标记 [CITATION NEEDED]
 */

import { searchKnowledgeBase, searchMemories } from './rag-service'
import { chatWithAI, type ChatMessage } from './claude-service'
import {
  searchPapersForTopic,
  injectPapersIntoPrompt,
  getSearchStrategyForStage,
  type ExternalPaper,
  type PaperSearchResult,
} from './external-paper-search'

// =============================================================================
// 类型定义
// =============================================================================

export interface PaperRef {
  id: string
  title: string
  authors?: string[]
  year?: number
  abstract?: string
  venue?: string
  url?: string
  citationCount?: number
}

export interface RAGContext {
  papers: PaperRef[]
  contextText: string
  source: 'knowledge_base' | 'research_memory' | 'mixed'
}

export interface CitationVerificationResult {
  verifiedText: string
  /** 占位符 → 真实引用或 null（无法验证） */
  citationMap: Record<string, PaperRef | null>
  /** 无法验证的引用列表 */
  unverified: string[]
}

// =============================================================================
// RAG 增强：检索相关文献
// =============================================================================

/**
 * 为论文主题检索相关文献
 *
 * 检索源优先级（新策略）：
 * 1. 外部学术数据库（Semantic Scholar + arXiv + Tavily）— **优先使用，解决幻觉问题**
 * 2. 社区论文库（KnowledgeDocument）— 回退
 * 3. 用户研究记忆（ResearchMemory）— 回退
 *
 * @param topic 论文主题
 * @param options 检索选项
 * @returns 检索结果上下文
 */
export async function retrieveRelatedPapers(
  topic: string,
  options?: {
    discipline?: string
    limit?: number
    includeMemories?: boolean
    stage?: 'proposal' | 'structure' | 'writing' | 'data' | 'formatting'
    /** 强制使用外部检索（默认 true） */
    useExternalSearch?: boolean
  }
): Promise<RAGContext> {
  const limit = options?.limit || 10
  const papers: PaperRef[] = []
  let source: RAGContext['source'] = 'knowledge_base'

  // ================================================================
  // 1. 外部学术数据库检索（优先）
  // ================================================================
  if (options?.useExternalSearch !== false) {
    try {
      const searchOptions = options?.stage
        ? getSearchStrategyForStage(options.stage)
        : { limit, yearFrom: new Date().getFullYear() - 5 }

      const externalResult = await searchPapersForTopic(topic, searchOptions)

      if (externalResult.papers.length > 0) {
        for (const p of externalResult.papers) {
          papers.push({
            id: p.id,
            title: p.title,
            authors: p.authors,
            year: p.year,
            abstract: p.abstract,
            venue: p.venue,
            url: p.url,
            citationCount: p.citationCount,
          })
        }
        source = 'mixed'
        console.log(`[PaperEnhancement] External search returned ${papers.length} papers for "${topic}"`)
      }
    } catch (err) {
      console.warn('[PaperEnhancement] External search failed, falling back to local:', err)
    }
  }

  // ================================================================
  // 2. 本地知识库检索（回退 / 补充）
  // ================================================================
  const localLimit = papers.length > 0 ? Math.min(3, limit) : limit

  if (papers.length < limit) {
    const kbResult = await searchKnowledgeBase(topic, {
      limit: localLimit,
      threshold: 0.65,
      discipline: options?.discipline,
    })

    if (kbResult.results && !kbResult.error) {
      for (const r of kbResult.results) {
        // 避免与外部检索结果重复
        if (!papers.some((p) => normalizeTitle(p.title) === normalizeTitle(r.title))) {
          papers.push({
            id: r.id,
            title: r.title,
            abstract: r.content?.slice(0, 500),
            venue: r.source || undefined,
          })
        }
      }
    }
  }

  // 3. 检索研究记忆（如果启用且仍有空缺）
  if (options?.includeMemories !== false && papers.length < limit) {
    const memResult = await searchMemories(topic, {
      limit: Math.min(2, limit - papers.length),
      threshold: 0.65,
      discipline: options?.discipline,
    })

    if (memResult.results && !memResult.error) {
      for (const r of memResult.results) {
        if (!papers.some((p) => p.id === r.id || normalizeTitle(p.title) === normalizeTitle(r.title))) {
          papers.push({
            id: r.id,
            title: r.title,
            abstract: r.content?.slice(0, 500),
            venue: r.source || undefined,
          })
        }
      }
    }
  }

  // ================================================================
  // 4. 构建上下文文本
  // ================================================================
  const contextText = papers.length > 0
    ? papers
        .map(
          (p, i) =>
            `[文献${i + 1}] ${p.title}${p.authors ? ` (${p.authors.join(', ')}${p.year ? `, ${p.year}` : ''})` : ''}${p.venue ? ` — ${p.venue}` : ''}${p.citationCount ? ` (被引 ${p.citationCount} 次)` : ''}${p.abstract ? `\n摘要: ${p.abstract.slice(0, 300)}` : ''}`
        )
        .join('\n\n')
    : ''

  return {
    papers: papers.slice(0, limit),
    contextText,
    source,
  }
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * 构建 RAG 增强的 prompt 前缀
 */
export function buildRAGPromptPrefix(ragContext: RAGContext): string {
  if (!ragContext.contextText) {
    return ''
  }

  const isExternal = ragContext.source !== 'knowledge_base'

  return `【相关文献参考（${isExternal ? '来自 Semantic Scholar / arXiv / Tavily 等真实学术数据库' : '来自社区论文库'}）】
以下是从学术数据库实时检索到的与你研究主题相关的真实文献。请在撰写时**优先基于这些文献**进行引用和分析：

${ragContext.contextText}

【引用要求】
- **优先使用上述文献**，引用格式：[REF-N]（对应上方编号）
- 如需引用列表外的文献，必须确保其真实存在（作者、年份、标题可查）
- 无法确认真实性的引用必须标注 [CITATION NEEDED]
- **禁止编造**作者名、期刊名、卷期号、DOI 或实验数据
- 所有具体数值标注可信度级别：[VERIFIED] / [LIKELY] / [SPECULATIVE] / [CITATION NEEDED]

---

`
}

// =============================================================================
// 引用验证：验证并替换 [REF-N] 占位符
// =============================================================================

/**
 * 从文本中提取引用占位符
 */
function extractCitationPlaceholders(text: string): string[] {
  const matches = text.match(/\[REF-\d+\]/g)
  return matches ? Array.from(new Set(matches)) : []
}

/**
 * 验证 AI 生成文本中的引用占位符
 *
 * 策略：
 * 1. 提取所有 [REF-N] 占位符
 * 2. 使用 AI 评估每个引用是否真实、是否与上下文匹配
 * 3. 将无法验证的替换为 [CITATION NEEDED]
 * 4. 返回验证后的文本和引用映射
 *
 * @param generatedText AI 生成的论文文本
 * @param topic 论文主题
 * @returns 验证结果
 */
export async function verifyCitations(
  generatedText: string,
  topic: string
): Promise<CitationVerificationResult> {
  const placeholders = extractCitationPlaceholders(generatedText)

  if (placeholders.length === 0) {
    return {
      verifiedText: generatedText,
      citationMap: {},
      unverified: [],
    }
  }

  // 构建验证 prompt
  const verifyPrompt = `你是学术引用审核专家。请审核以下论文段落中的引用标注。

论文主题：${topic}

【待审核文本】
${generatedText.slice(0, 6000)}

【审核任务】
1. 检查每个 [REF-N] 引用是否与上下文中的论断匹配
2. 判断引用是否真实存在（是否有明确的作者、年份、论文标题）
3. 对无法验证或明显编造的引用，标记为 [CITATION NEEDED]

【输出格式】
请返回 JSON：
{
  "verified": [
    { "placeholder": "[REF-1]", "assessment": "可信/存疑/无法验证", "reason": "简要原因" }
  ],
  "replacements": [
    { "placeholder": "[REF-1]", "replacement": "[CITATION NEEDED]" }
  ]
}

只返回 JSON，不要其他内容。`

  try {
    const result = await chatWithAI([
      { role: 'user', content: verifyPrompt },
    ])

    if (result.error || !result.content) {
      // 验证失败，返回原文
      return {
        verifiedText: generatedText,
        citationMap: {},
        unverified: placeholders,
      }
    }

    // 解析 JSON
    let verification: {
      verified?: Array<{
        placeholder: string
        assessment: string
        reason: string
      }>
      replacements?: Array<{
        placeholder: string
        replacement: string
      }>
    }

    try {
      const jsonMatch =
        result.content.match(/```json\n?([\s\S]*?)\n?```/) ||
        result.content.match(/(\{[\s\S]*\})/)
      const jsonStr = jsonMatch ? jsonMatch[1] : result.content
      // 清理可能的非法控制字符
      const cleanStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      verification = JSON.parse(cleanStr)
    } catch {
      // JSON 解析失败，返回原文
      return {
        verifiedText: generatedText,
        citationMap: {},
        unverified: placeholders,
      }
    }

    // 应用替换
    let verifiedText = generatedText
    const citationMap: Record<string, PaperRef | null> = {}
    const unverified: string[] = []

    for (const rep of verification.replacements || []) {
      if (rep.replacement === '[CITATION NEEDED]') {
        verifiedText = verifiedText.replaceAll(rep.placeholder, '[CITATION NEEDED]')
        citationMap[rep.placeholder] = null
        unverified.push(rep.placeholder)
      }
    }

    return {
      verifiedText,
      citationMap,
      unverified,
    }
  } catch (error) {
    console.error('Citation verification error:', error)
    return {
      verifiedText: generatedText,
      citationMap: {},
      unverified: placeholders,
    }
  }
}

// =============================================================================
// 高阶 API：一键增强论文生成
// =============================================================================

/**
 * 为论文生成任务准备完整的增强上下文
 *
 * 使用方式：
 * ```ts
 * const enhancement = await preparePaperEnhancement('联邦学习隐私保护', { discipline: 'CS' });
 * // enhancement.ragContext 注入到 prompt
 * // enhancement.verifyFn 在生成后调用
 * ```
 */
export async function preparePaperEnhancement(
  topic: string,
  options?: {
    discipline?: string
    includeMemories?: boolean
    stage?: 'proposal' | 'structure' | 'writing' | 'data' | 'formatting'
    useExternalSearch?: boolean
  }
): Promise<{
  ragContext: RAGContext
  ragPrefix: string
  verify: (generatedText: string) => Promise<CitationVerificationResult>
}> {
  const ragContext = await retrieveRelatedPapers(topic, {
    discipline: options?.discipline,
    limit: 10,
    includeMemories: options?.includeMemories,
    stage: options?.stage,
    useExternalSearch: options?.useExternalSearch,
  })

  const ragPrefix = buildRAGPromptPrefix(ragContext)

  return {
    ragContext,
    ragPrefix,
    verify: (generatedText: string) => verifyCitations(generatedText, topic),
  }
}
