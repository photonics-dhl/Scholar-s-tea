/**
 * Scholar's Tea — 论文生成增强服务
 *
 * 为 AI 论文生成提供：
 * 1. RAG 增强：生成前检索社区论文库，注入真实文献上下文
 * 2. 引用验证：生成后验证 [REF-N] 占位符，替换为真实引用或标记 [CITATION NEEDED]
 */

import { searchKnowledgeBase, searchMemories } from './rag-service'
import { chatWithAI, type ChatMessage } from './claude-service'

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
 * 检索源优先级：
 * 1. 社区论文库（KnowledgeDocument）
 * 2. 用户研究记忆（ResearchMemory）
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
  }
): Promise<RAGContext> {
  const limit = options?.limit || 5
  const papers: PaperRef[] = []

  // 1. 检索社区论文库
  const kbResult = await searchKnowledgeBase(topic, {
    limit,
    threshold: 0.65, // 稍微降低阈值，确保有更多结果
    discipline: options?.discipline,
  })

  if (kbResult.results && !kbResult.error) {
    for (const r of kbResult.results) {
      papers.push({
        id: r.id,
        title: r.title,
        abstract: r.content?.slice(0, 500),
        venue: r.source || undefined,
      })
    }
  }

  // 2. 检索研究记忆（如果启用）
  if (options?.includeMemories !== false) {
    const memResult = await searchMemories(topic, {
      limit: Math.min(3, limit),
      threshold: 0.65,
      discipline: options?.discipline,
    })

    if (memResult.results && !memResult.error) {
      for (const r of memResult.results) {
        // 避免重复
        if (!papers.some((p) => p.id === r.id)) {
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

  // 3. 构建上下文文本
  const contextText = papers.length > 0
    ? papers
        .map(
          (p, i) =>
            `[文献${i + 1}] ${p.title}${p.authors ? ` (${p.authors.join(', ')}${p.year ? `, ${p.year}` : ''})` : ''}${p.venue ? ` — ${p.venue}` : ''}${p.abstract ? `\n摘要: ${p.abstract.slice(0, 300)}` : ''}`
        )
        .join('\n\n')
    : ''

  return {
    papers,
    contextText,
    source: papers.length > 0 ? 'mixed' : 'knowledge_base',
  }
}

/**
 * 构建 RAG 增强的 prompt 前缀
 */
export function buildRAGPromptPrefix(ragContext: RAGContext): string {
  if (!ragContext.contextText) {
    return ''
  }

  return `【相关文献参考】
以下是从社区论文库中检索到的与你研究主题相关的高质量文献，请在撰写时参考这些文献的观点和方法，并适当引用：

${ragContext.contextText}

【引用要求】
- 你可以使用 [REF-1], [REF-2] 等格式引用上述文献
- 如果你有其他确定知道的文献，也可以引用
- 不确定的引用请标注 [CITATION NEEDED]
- 尽量使引用真实、具体、可验证

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
      verification = JSON.parse(jsonStr)
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
  }
): Promise<{
  ragContext: RAGContext
  ragPrefix: string
  verify: (generatedText: string) => Promise<CitationVerificationResult>
}> {
  const ragContext = await retrieveRelatedPapers(topic, {
    discipline: options?.discipline,
    limit: 5,
    includeMemories: options?.includeMemories,
  })

  const ragPrefix = buildRAGPromptPrefix(ragContext)

  return {
    ragContext,
    ragPrefix,
    verify: (generatedText: string) => verifyCitations(generatedText, topic),
  }
}
