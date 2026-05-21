/**
 * AI 审稿（Peer Review）提示词模板
 *
 * 参考学术审稿最佳实践，设计多维度评审框架。
 */

export const PEER_REVIEW_SYSTEM_PROMPT = `你是国际顶级学术期刊的资深审稿人，拥有丰富的同行评审经验。

## 评审原则
- 客观公正：基于论文本身的质量进行评价，不受作者身份影响
- 建设性：指出问题的同时给出具体改进建议
- 专业性：使用学术界的标准术语和评价框架
- 完整性：覆盖论文的所有核心组成部分

## 评审维度（1-10分制）

### 1. 原创性 (Novelty)
- 研究问题是否新颖？
- 与现有工作的区别是否清晰？
- 贡献是否足够重要？

### 2. 方法论 (Methodology)
- 实验设计是否合理？
- 数据分析方法是否恰当？
- 对照组/基线是否充分？

### 3. 结果可靠性 (Soundness)
- 数据是否支撑结论？
- 统计显著性是否报告？
- 误差分析是否充分？

### 4. 写作质量 (Writing)
- 结构是否清晰？
- 逻辑是否连贯？
- 语言表达是否准确？

### 5. 引用规范 (References)
- 参考文献是否完整？
- 是否遗漏关键相关工作？
- 引用格式是否规范？

### 6. 可复现性 (Reproducibility)
- 方法描述是否足够详细？
- 代码/数据是否公开或可供获取？
- 超参数设置是否报告？

### 7. 影响力 (Impact)
- 对领域发展的潜在贡献？
- 实际应用价值？
- 是否开辟了新的研究方向？

## 输出格式
请按以下结构输出评审意见，并严格遵循富文本格式规范：

1. **论文概要**（100字以内，简洁概括研究目标、方法和主要发现）
2. **各维度评分表**：必须使用 Markdown 表格呈现（| 维度 | 得分 | 评语 |），数字右对齐、文本左对齐
3. **详细评审意见**：
   - 逐条列出优点和不足
   - 重要结论前加 "> [关键] " 或标准 GFM "> [!IMPORTANT]" 提示框
   - 警告或局限性前加 "> [注意] " 或标准 GFM "> [!WARNING]" 提示框
   - 方法改进建议前加 "> [建议] " 或标准 GFM "> [!TIP]" 提示框
   - 对每个维度的长篇详细分析使用折叠区块 <details><summary>展开查看详细分析</summary>详细内容...</details>
4. **综合评审结论**：Accept / Minor Revision / Major Revision / Reject
5. **具体修改建议清单**：按优先级排序，使用有序列表（1. 2. 3.），每条建议附带具体位置引用`

/** 审稿结构化 JSON 模式 System Prompt（叠加在文本 prompt 之上） */
export const PEER_REVIEW_JSON_SYSTEM_PROMPT = `${PEER_REVIEW_SYSTEM_PROMPT}

## 【JSON 结构化输出模式】
本次评审需要输出为严格的 JSON 格式。除 JSON 外不要输出任何其他内容（不要 markdown 代码块标记、不要解释文字）。

JSON Schema：
{
  "summary": "论文概要（100字以内）",
  "scores": {
    "novelty": { "score": 1-10, "comment": "该维度的详细评语" },
    "methodology": { "score": 1-10, "comment": "..." },
    "soundness": { "score": 1-10, "comment": "..." },
    "writing": { "score": 1-10, "comment": "..." },
    "references": { "score": 1-10, "comment": "..." },
    "reproducibility": { "score": 1-10, "comment": "..." },
    "impact": { "score": 1-10, "comment": "..." }
  },
  "overallComment": "综合评审意见的详细文本（可包含优点、问题分析）",
  "verdict": "accept | minor_revision | major_revision | reject",
  "suggestions": [
    { "priority": "P0 | P1 | P2", "description": "具体修改建议", "location": "建议位置（如'第3节方法部分'）" }
  ]
}

约束：
- score 必须是 1-10 的整数
- verdict 必须是四个枚举值之一，小写
- suggestions 至少包含 3 条，按 priority 排序（P0 > P1 > P2）
- 所有字符串字段必须为非空
- 不要输出 markdown 代码块（\`\`\`json），直接输出纯 JSON 字符串`

export function buildPeerReviewPrompt(paperContent: string, focus?: string): string {
  const focusPrompt = focus
    ? `\n请重点关注以下方面：${focus}`
    : ''

  return `请对以下论文进行同行评审：\n\n${paperContent.slice(0, 12000)}${focusPrompt}\n\n请按照系统提示中规定的格式输出完整的评审意见。`
}

/** JSON 模式下的审稿 Prompt */
export function buildPeerReviewJsonPrompt(paperContent: string, focus?: string): string {
  const focusPrompt = focus
    ? `\n请重点关注以下方面：${focus}`
    : ''

  return `【AI 审稿任务 — JSON 结构化输出】

请对以下论文进行严格的同行评审，并以 JSON 格式输出评审结果。

【待审论文】
${paperContent.slice(0, 30000)}
${focusPrompt}

【要求】
1. 严格按照 JSON Schema 输出，不要包含任何非 JSON 内容
2. 评分必须客观公正，基于论文实际质量
3. 每条建议必须具体、可操作
4. 检查论文引用真实性，可疑引用在 overallComment 中标注 [CITATION CHECK NEEDED]`
}

export const PEER_REVIEW_DIMENSIONS = [
  { key: 'novelty', label: '原创性', maxScore: 10 },
  { key: 'methodology', label: '方法论', maxScore: 10 },
  { key: 'soundness', label: '结果可靠性', maxScore: 10 },
  { key: 'writing', label: '写作质量', maxScore: 10 },
  { key: 'references', label: '引用规范', maxScore: 10 },
  { key: 'reproducibility', label: '可复现性', maxScore: 10 },
  { key: 'impact', label: '影响力', maxScore: 10 },
] as const

export type PeerReviewDimension = typeof PEER_REVIEW_DIMENSIONS[number]['key']

export interface PeerReviewSuggestion {
  priority: 'P0' | 'P1' | 'P2'
  description: string
  location?: string
}

export interface PeerReviewResult {
  summary: string
  scores: Record<PeerReviewDimension, { score: number; comment: string }>
  overallComment: string
  verdict: 'accept' | 'minor_revision' | 'major_revision' | 'reject'
  suggestions: PeerReviewSuggestion[]
}

/** 安全解析审稿 JSON 输出 */
export function parsePeerReviewJson(rawText: string): PeerReviewResult | null {
  try {
    // 1. 尝试提取 JSON 块（支持 ```json ... ``` 或纯 JSON）
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || rawText.match(/(\{[\s\S]*\})/)
    const jsonText = jsonMatch ? jsonMatch[1].trim() : rawText.trim()

    // 2. 清理非法控制字符
    const cleaned = jsonText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')

    const data = JSON.parse(cleaned)

    // 3. 验证必要字段
    if (!data.scores || typeof data.summary !== 'string' || typeof data.verdict !== 'string') {
      console.warn('[parsePeerReviewJson] Missing required fields')
      return null
    }

    // 4. 规范化 suggestions
    const suggestions: PeerReviewSuggestion[] = Array.isArray(data.suggestions)
      ? data.suggestions.map((s: any) => ({
          priority: ['P0', 'P1', 'P2'].includes(s.priority) ? s.priority : 'P2',
          description: String(s.description || ''),
          location: s.location ? String(s.location) : undefined,
        }))
      : []

    // 5. 规范化 scores
    const scores: PeerReviewResult['scores'] = {} as any
    for (const dim of PEER_REVIEW_DIMENSIONS) {
      const s = data.scores[dim.key]
      scores[dim.key] = {
        score: Math.min(10, Math.max(1, Math.round(Number(s?.score) || 5))),
        comment: String(s?.comment || ''),
      }
    }

    // 6. 验证 verdict
    const validVerdicts = ['accept', 'minor_revision', 'major_revision', 'reject']
    const verdict = validVerdicts.includes(data.verdict) ? data.verdict : 'minor_revision'

    return {
      summary: String(data.summary || ''),
      scores,
      overallComment: String(data.overallComment || data.overall_comment || ''),
      verdict: verdict as PeerReviewResult['verdict'],
      suggestions,
    }
  } catch (error) {
    console.warn('[parsePeerReviewJson] Parse failed:', error instanceof Error ? error.message : String(error))
    return null
  }
}
