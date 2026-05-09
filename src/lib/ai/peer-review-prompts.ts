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
请按以下结构输出评审意见：

1. 论文概要（100字以内）
2. 各维度评分表
3. 详细评审意见（逐条列出优点和不足）
4. 综合评审结论：Accept / Minor Revision / Major Revision / Reject
5. 具体修改建议清单（按优先级排序）`

export function buildPeerReviewPrompt(paperContent: string, focus?: string): string {
  const focusPrompt = focus
    ? `\n请重点关注以下方面：${focus}`
    : ''

  return `请对以下论文进行同行评审：\n\n${paperContent.slice(0, 12000)}${focusPrompt}\n\n请按照系统提示中规定的格式输出完整的评审意见。`
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

export interface PeerReviewResult {
  summary: string
  scores: Record<PeerReviewDimension, { score: number; comment: string }>
  overallComment: string
  verdict: 'accept' | 'minor_revision' | 'major_revision' | 'reject'
  suggestions: string[]
}
