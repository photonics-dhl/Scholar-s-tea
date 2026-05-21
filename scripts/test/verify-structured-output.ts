/**
 * 验证结构化输出功能（Phase 3 + Phase 4）
 *
 * 不实际调用 AI API，只验证解析逻辑和类型正确性。
 */

import { parsePeerReviewJson } from '../../src/lib/ai/peer-review-prompts'
import { parseGrantApplicationJson } from '../../src/lib/ai/grant-application-prompts'

// ------------------------------------------------------------------
// 测试数据：模拟 AI 返回的 JSON
// ------------------------------------------------------------------

const samplePeerReviewJson = JSON.stringify({
  summary: '本文提出了一种新的联邦学习方法，在隐私保护和模型性能之间取得了良好平衡。',
  scores: {
    novelty: { score: 8, comment: '研究问题较为新颖，隐私保护与联邦学习的结合有一定创新。' },
    methodology: { score: 7, comment: '实验设计基本合理，但缺少与更多基线方法的对比。' },
    soundness: { score: 8, comment: '数据支撑结论充分，统计检验恰当。' },
    writing: { score: 9, comment: '结构清晰，逻辑连贯，语言表达准确。' },
    references: { score: 7, comment: '参考文献较完整，但遗漏了2篇近期相关工作。' },
    reproducibility: { score: 6, comment: '代码未公开，部分超参数未报告。' },
    impact: { score: 7, comment: '对联邦学习领域有一定贡献，实际应用价值待验证。' },
  },
  overallComment: '总体而言，这是一篇质量较好的论文，建议 minor revision 后接受。',
  verdict: 'minor_revision',
  suggestions: [
    { priority: 'P0', description: '补充与最新基线方法的对比实验', location: '实验部分' },
    { priority: 'P1', description: '公开代码和超参数设置', location: '方法部分' },
    { priority: 'P2', description: '增加对异构数据场景的讨论', location: '讨论部分' },
  ],
})

const sampleGrantJson = JSON.stringify({
  title: '面向异构联邦学习的自适应隐私保护机制研究',
  sections: {
    background: {
      content: '联邦学习通过分布式协同训练保护数据隐私，但在异构数据场景下面临严峻挑战...',
      keyPoints: ['联邦学习的隐私保护需求日益增长', '异构数据导致现有方法性能下降', '自适应隐私机制是可行解决方案'],
    },
    researchContent: {
      content: '本项目围绕异构联邦学习中的隐私保护问题展开研究...',
      objectives: ['设计自适应隐私预算分配算法', '构建异构鲁棒的联邦学习框架', '验证算法在真实数据集上的有效性'],
    },
    innovation: {
      content: '本项目的创新点主要体现在以下三个方面...',
      points: [
        { type: '原始创新', content: '首次提出基于数据分布特征的自适应隐私预算分配机制', support: '理论分析和实验验证', effect: '在保证同等隐私水平下提升模型精度 5-8%' },
        { type: '集成创新', content: '构建面向异构联邦学习的统一隐私保护框架', support: '融合差分隐私和安全多方计算', effect: '支持多种异构场景下的隐私保护' },
      ],
    },
    feasibility: {
      content: '本项目的技术路线清晰，团队具备相关研究基础...',
      analysis: '团队已有3篇相关顶会论文，具备算法原型和实验平台。',
    },
    expectedOutcomes: {
      content: '预期发表高水平论文3-4篇，申请发明专利2项...',
      metrics: [
        { type: '论文', description: 'CCF-A/B 类论文', quantity: '3-4 篇' },
        { type: '专利', description: '国家发明专利', quantity: '2 项' },
        { type: '软件', description: '开源联邦学习隐私保护工具包', quantity: '1 套' },
      ],
    },
  },
  budget: {
    total: '80万元',
    breakdown: [
      { category: '设备费', amount: '20万元', justification: '购买 GPU 服务器用于大规模实验' },
      { category: '材料费', amount: '10万元', justification: '数据集购买和云算力租赁' },
      { category: '差旅费', amount: '8万元', justification: '学术会议交流和合作访问' },
      { category: '劳务费', amount: '30万元', justification: '研究生助研津贴' },
      { category: '管理费', amount: '12万元', justification: '单位管理费和其他支出' },
    ],
  },
  timeline: {
    phases: [
      { phase: '第1年', tasks: ['文献调研和算法设计', '基础理论分析'], milestones: ['完成自适应隐私机制设计', '发表1篇理论分析论文'] },
      { phase: '第2年', tasks: ['算法实现和实验验证', '框架构建和优化'], milestones: ['完成开源工具包开发', '发表2篇实验论文'] },
      { phase: '第3年', tasks: ['大规模场景验证', '成果总结和转化'], milestones: ['完成真实场景部署验证', '申请专利并结题'] },
    ],
  },
  references: ['[REF-1] McMahan et al., 2017, AISTATS', '[REF-2] Dwork et al., 2014, JPC'],
})

// ------------------------------------------------------------------
// 测试执行
// ------------------------------------------------------------------

function testPeerReviewParse() {
  console.log('\n[TEST] parsePeerReviewJson')
  const result = parsePeerReviewJson(samplePeerReviewJson)

  if (!result) {
    console.error('  ❌ 解析失败')
    return false
  }

  const checks = [
    ['summary', typeof result.summary === 'string' && result.summary.length > 0],
    ['scores count', Object.keys(result.scores).length === 7],
    ['novelty score', result.scores.novelty.score === 8],
    ['verdict', result.verdict === 'minor_revision'],
    ['suggestions', result.suggestions.length === 3],
    ['suggestion priority', result.suggestions[0].priority === 'P0'],
    ['suggestion location', result.suggestions[0].location === '实验部分'],
  ] as const

  let pass = true
  for (const [name, ok] of checks) {
    console.log(`  ${ok ? '✓' : '❌'} ${name}`)
    if (!ok) pass = false
  }

  return pass
}

function testGrantParse() {
  console.log('\n[TEST] parseGrantApplicationJson')
  const result = parseGrantApplicationJson(sampleGrantJson)

  if (!result) {
    console.error('  ❌ 解析失败')
    return false
  }

  const checks = [
    ['title', result.title.length > 0],
    ['background content', result.sections.background.content.length > 0],
    ['background keyPoints', result.sections.background.keyPoints.length === 3],
    ['researchContent objectives', result.sections.researchContent.objectives.length === 3],
    ['innovation points', result.sections.innovation.points.length === 2],
    ['innovation point type', result.sections.innovation.points[0].type === '原始创新'],
    ['feasibility analysis', result.sections.feasibility.analysis.length > 0],
    ['expectedOutcomes metrics', result.sections.expectedOutcomes.metrics.length === 3],
    ['budget total', result.budget.total === '80万元'],
    ['budget breakdown', result.budget.breakdown.length === 5],
    ['timeline phases', result.timeline.phases.length === 3],
    ['references', result.references.length === 2],
  ] as const

  let pass = true
  for (const [name, ok] of checks) {
    console.log(`  ${ok ? '✓' : '❌'} ${name}`)
    if (!ok) pass = false
  }

  return pass
}

function testMarkdownCodeBlockExtraction() {
  console.log('\n[TEST] markdown code block extraction')

  const wrapped = '```json\n' + samplePeerReviewJson + '\n```'
  const result = parsePeerReviewJson(wrapped)

  if (result && result.verdict === 'minor_revision') {
    console.log('  ✓ 支持 ```json 代码块包裹')
    return true
  }

  console.log('  ❌ 代码块提取失败')
  return false
}

function testInvalidFallback() {
  console.log('\n[TEST] invalid JSON fallback')

  const result = parsePeerReviewJson('not json at all')
  if (result === null) {
    console.log('  ✓ 非法输入返回 null')
    return true
  }

  console.log('  ❌ 非法输入未返回 null')
  return false
}

// ------------------------------------------------------------------
// 主入口
// ------------------------------------------------------------------

let allPass = true

allPass = testPeerReviewParse() && allPass
allPass = testGrantParse() && allPass
allPass = testMarkdownCodeBlockExtraction() && allPass
allPass = testInvalidFallback() && allPass

console.log('\n' + (allPass ? '✅ 全部测试通过' : '❌ 部分测试失败'))
process.exit(allPass ? 0 : 1)
