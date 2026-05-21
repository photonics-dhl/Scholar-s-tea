/**
 * 论文生成后质量审查服务（Post-hoc Quality Review）
 *
 * 在论文/基金/审稿内容生成后，可选触发一次独立的质量审查，
 * 检测逻辑一致性、引用完整性、原创性风险和格式规范问题。
 */

import { callHermesGateway } from './hermes-gateway-adapter'
import type { ChatMessage } from './claude-service'

// =============================================================================
// 类型定义
// =============================================================================

export interface QualityIssue {
  severity: 'critical' | 'warning' | 'suggestion'
  category: 'logic' | 'citation' | 'originality' | 'format' | 'grammar'
  /** 问题位置，如"第3段""引言部分" */
  location?: string
  description: string
  suggestion: string
}

export interface QualityReviewResult {
  issues: QualityIssue[]
  /** 综合评分 1-10 */
  overallScore: number
  verdict: 'pass' | 'needs_revision'
  summary: string
}

// =============================================================================
// System Prompt
// =============================================================================

const QUALITY_REVIEW_SYSTEM_PROMPT = `你是一位严格的学术质量审查专家。你的任务是对已生成的学术内容进行独立审查，找出潜在问题并提出具体改进建议。

## 审查维度

1. **逻辑一致性 (logic)**
   - 论证链条是否完整？前提→推理→结论是否成立？
   - 前后文是否矛盾？（如方法部分说用 A 算法，结果部分说用 B 算法）
   - 研究问题与方法是否匹配？

2. **引用完整性 (citation)**
   - 关键论断是否有引用支撑？
   - [REF-N] 占位符是否过多？（>30% 的关键论断无引用则标记为问题）
   - 引用与论述是否对应？

3. **原创性风险 (originality)**
   - 创新点是否空泛？（如仅说"首次提出"而无具体技术细节）
   - 是否存在与输入材料高度相似的段落？

4. **格式规范 (format)**
   - 章节结构是否符合学术规范？
   - 公式、表格、图表引用是否规范？
   - 术语使用是否一致？

5. **语言表达 (grammar)**
   - 是否存在口语化表达？
   - 是否存在绝对化表述（"最好""唯一"）？
   - 是否存在歧义或模糊表达？

## 输出格式

请严格按以下结构输出：

【综合评分】X/10
【审查结论】pass / needs_revision
【总体评价】（100字以内概括主要优缺点）

【问题清单】（按严重程度排序）

### [critical] 严重问题
1. [类别:logic|citation|originality|format|grammar] [位置] 问题描述
   → 修改建议：...

### [warning] 警告
1. [类别] [位置] 问题描述
   → 修改建议：...

### [suggestion] 建议
1. [类别] [位置] 问题描述
   → 修改建议：...

## 评分标准
- 10： flawless，可直接投稿/提交
- 8-9： minor issues，小修后可提交
- 6-7： major issues，需要修改逻辑或补充内容
- <6： critical issues，需要大幅重写

## 约束
- 只指出问题，不直接修改原文
- 每个问题必须附带具体的修改建议（不只是"请改进"）
- 优先指出 critical 和 warning 级别的问题
- 如无重大问题，直接给出 pass 结论`

// =============================================================================
// 核心函数：质量审查
// =============================================================================

/**
 * 对学术内容进行质量审查
 *
 * @param content 待审查的学术内容（论文/基金申请书/审稿意见等）
 * @param contentType 内容类型，影响审查侧重点
 * @returns 审查结果
 */
export async function reviewPaperQuality(
  content: string,
  contentType: 'paper' | 'grant' | 'review' = 'paper'
): Promise<QualityReviewResult> {
  const typePrompt: Record<string, string> = {
    paper: '这是一篇学术论文或论文片段',
    grant: '这是一份科研项目申请书',
    review: '这是一份审稿意见或学术分析',
  }

  const userPrompt = `【质量审查任务】

${typePrompt[contentType]}。请对其进行独立质量审查。

【待审查内容】
${content.slice(0, 12000)}

请按照系统提示中的格式输出审查结果。`

  const messages: ChatMessage[] = [
    { role: 'system', content: QUALITY_REVIEW_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]

  try {
    const result = await callHermesGateway(messages, {
      skill: 'research-paper-writing',
      personality: 'critic',
      timeout: 60_000,
      maxTokens: 2048,
      temperature: 0.3,
    })

    if (result.error) {
      return {
        issues: [],
        overallScore: 0,
        verdict: 'needs_revision',
        summary: `质量审查失败: ${result.error}`,
      }
    }

    return parseQualityReview(result.content)
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    return {
      issues: [],
      overallScore: 0,
      verdict: 'needs_revision',
      summary: `质量审查异常: ${message}`,
    }
  }
}

// =============================================================================
// 解析函数：将 AI 输出解析为结构化结果
// =============================================================================

/**
 * 解析质量审查文本输出为结构化结果
 *
 * 当前使用 regex 解析，后续可迁移到 JSON mode
 */
function parseQualityReview(rawText: string): QualityReviewResult {
  const text = rawText.trim()

  // 解析综合评分
  const scoreMatch = text.match(/【综合评分】\s*(\d+(?:\.\d+)?)\s*\/\s*10/)
  const overallScore = scoreMatch ? Math.min(10, Math.max(0, parseFloat(scoreMatch[1]))) : 5

  // 解析结论
  const verdictMatch = text.match(/【审查结论】\s*(pass|needs_revision)/i)
  const verdict = verdictMatch ? (verdictMatch[1].toLowerCase() as 'pass' | 'needs_revision') : 'needs_revision'

  // 解析总体评价
  const summaryMatch = text.match(/【总体评价】\s*([\s\S]+?)(?=【问题清单】|$)/)
  const summary = summaryMatch ? summaryMatch[1].trim() : '未提供总体评价'

  // 解析问题列表
  const issues: QualityIssue[] = []

  // 匹配格式: ### [critical] 或 1. [类别] [位置] 问题描述 → 修改建议
  const issuePattern = /(?:^|\n)(?:###\s*\[?(critical|warning|suggestion)\]?|\d+\.\s*)\s*\[?\s*(logic|citation|originality|format|grammar)\s*\]?\s*(?:\[([^\]]+)\])?\s*([\s\S]+?)(?=→|修改建议|$)/gi

  let match
  while ((match = issuePattern.exec(text)) !== null) {
    const severity = (match[1] || 'suggestion').toLowerCase() as QualityIssue['severity']
    const category = (match[2] || 'grammar').toLowerCase() as QualityIssue['category']
    const location = match[3]?.trim()
    const description = match[4]?.trim()

    // 查找对应的修改建议
    const afterIssue = text.slice(match.index + match[0].length)
    const suggestionMatch = afterIssue.match(/→\s*修改建议[：:]\s*([\s\S]+?)(?=\n(?:\d+\.\s*\[|###\s*\[|$))/i)
    const suggestion = suggestionMatch ? suggestionMatch[1].trim() : '请根据问题描述自行修改'

    if (description && description.length > 5) {
      issues.push({
        severity,
        category,
        location,
        description,
        suggestion,
      })
    }
  }

  // 如果 regex 没匹配到，fallback：按行简单解析
  if (issues.length === 0) {
    const lines = text.split('\n').filter((l) => l.trim().length > 10)
    for (const line of lines.slice(0, 10)) {
      if (line.includes('问题') || line.includes('建议') || line.includes('不足')) {
        issues.push({
          severity: 'suggestion',
          category: 'grammar',
          description: line.trim(),
          suggestion: '请参考审查文本中的具体建议',
        })
      }
    }
  }

  return {
    issues,
    overallScore,
    verdict,
    summary,
  }
}
