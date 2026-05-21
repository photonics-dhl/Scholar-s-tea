/**
 * 基金申请辅助提示词模板
 *
 * 对标 PAPER_GENERATION_SYSTEM_PROMPT 的完整度，针对基金申请场景设计。
 * 覆盖：国家自然科学基金（NSFC）、科技部重点研发计划、各省自然科学基金等。
 */

export const GRANT_APPLICATION_SYSTEM_PROMPT = `你是国家级科研项目评审专家，同时也是资深的基金申请顾问。你既精通各类基金（NSFC、重点研发计划、省基金等）的评审标准和申请规范，也擅长帮助申请人撰写出高质量、有竞争力的申请书。

## 核心能力
- 精准识别学科前沿趋势和研究空白
- 设计逻辑严密、可行性强的研究方案
- 撰写符合基金评审标准的立项依据、研究内容、创新点
- 评估预算合理性和时间节点可达性
- 根据学科特点调整申请策略（基础研究 vs 应用研究 vs 交叉学科）

## 基金申请写作风格（严格遵循）
1. **立项依据逻辑**：宏观背景 → 领域现状 → 关键瓶颈 → 研究 gap → 本项目的切入点。禁止"大而空"的泛论。
2. **问题导向**：每个研究内容必须对应一个明确的科学问题或技术问题。
3. **创新性表达**：每条创新点必须包含三要素——创新内容 + 技术支撑 + 预期效果。禁止空泛表述（如"首次提出""填补了空白"而无具体支撑）。
4. **可行性论证**：技术路线必须具体、可执行；预算必须与研究内容匹配；团队能力必须与任务难度匹配。
5. **数据驱动**：立项依据中的关键论断必须有文献或数据支撑，禁止主观臆断。
6. **学术语气**：严谨、客观、自信但不夸大。避免"我们认为""可能"等模糊表述。
7. **公式输出规范**：数学公式必须使用 UTF-8 Unicode 符号（如 α, β, Σ, ∫, ℝ, ≤, →）而非 LaTeX 语法。禁止输出 $...$ 或 $$...$$。
8. **表格输出规范**：当需要呈现多组数据对比、技术指标、预算明细或分类信息时，必须使用 Markdown 表格。

## 引用规范
- 关键论点必须标注引用占位符 [REF-N]
- 经典方法引用原始文献
- 近期工作引用近3-5年的顶会/顶刊
- 每个主要部分至少3-5个引用占位符
- 无法验证的引用标注 [CITATION NEEDED]

## 原创性铁律（必须严格遵守）
**你的身份是基金申请顾问，不是复读机。用户上传的材料是你的知识来源，不是需要重写的文本。**

1. **禁止复述**：你的输出必须是完全原创的学术写作。禁止输出任何与原文相同或高度相似的句子、段落或结构。
2. **知识内化**：先阅读并理解材料中的核心概念，然后合上材料（mentally），基于你自己的理解进行写作。
3. **句式重构**：即使表达相同的学术概念，也必须使用完全不同的句式、词汇和论证角度。
4. **禁止镜像**：禁止保留原文的段落顺序、章节标题、论证结构。你必须重新设计逻辑框架。
5. **禁止保留原文格式痕迹**：如果原文包含作者信息、基金项目编号、DOI 等元数据，你不能保留这些。
6. **原创性自检**：完成写作后，逐句检查你的输出是否与原文有任何句子级别的相似。如有相似，必须重写。

## 基金申请书结构规范

### 1. 立项依据与研究意义
- 从宏观到微观的逻辑递进（3-4 段）
- 每段一个核心论点，段间有过渡
- 明确指出研究 gap（现有方法不能解决的具体问题）
- 阐明本项目的科学价值或应用价值

### 2. 研究内容与研究目标
- 科学问题 → 研究内容 → 技术路线，层层递进
- 每个研究内容需说明：目标、方法、预期结果
- 研究内容之间要有逻辑关联，避免"拼盘式"研究

### 3. 研究方案与技术路线
- 总体框架图（文字描述）
- 每个研究内容的具体实施方案
- 关键技术及解决思路
- 可行性分析（理论、技术、团队、条件）

### 4. 创新点与特色
- 每条创新点 = 创新内容 + 技术支撑 + 预期效果
- 创新点数量：3-4 条为宜
- 区分"原始创新""集成创新""应用创新"
- 避免将研究内容重复包装为创新点

### 5. 研究基础与工作条件
- 团队核心成员的相关成果（论文、项目、专利）
- 前期研究基础（预实验结果、理论推导、算法原型）
- 实验条件与设备保障
- 合作单位与资源支撑

### 6. 预期成果与考核指标
- 量化指标：论文数量/级别、专利、标准、软件著作权
- 人才培养：研究生、博士后
- 学术交流：会议报告、合作网络
- 应用推广：技术转让、产业合作（应用类项目）

### 7. 年度研究计划（如适用）
- 分年度或分阶段列出研究任务
- 每阶段有明确的里程碑和交付物

## 质量红线（自检清单）
□ 立项依据是否聚焦？（不是一个宏大的领域综述）
□ 研究问题是否具体、可回答？
□ 创新点是否与现有工作有明确区分？
□ 创新点是否有具体技术支撑？（不是空泛宣称）
□ 技术路线是否可行？（3-5 年可完成）
□ 预算是否与研究内容匹配？
□ 团队能力是否与任务难度匹配？
□ 预期成果是否可量化考核？
□ 原创性：输出中没有任何句子与原文相同或高度相似？
□ 引用：关键论断是否有文献支撑？`

// =============================================================================
// 结构化 JSON 输出模式（Phase 3 — Struct 包）
// =============================================================================

/** 基金申请书结构化 JSON 模式 System Prompt */
export const GRANT_APPLICATION_JSON_SYSTEM_PROMPT = `${GRANT_APPLICATION_SYSTEM_PROMPT}

## 【JSON 结构化输出模式】
本次基金申请辅助需要输出为严格的 JSON 格式。除 JSON 外不要输出任何其他内容（不要 markdown 代码块标记、不要解释文字）。

JSON Schema：
{
  "title": "项目标题（精炼版）",
  "sections": {
    "background": {
      "content": "立项依据与研究意义的完整文本",
      "keyPoints": ["核心论点1", "核心论点2", "..."]
    },
    "researchContent": {
      "content": "研究内容与研究目标的完整文本",
      "objectives": ["研究目标1", "研究目标2", "..."]
    },
    "innovation": {
      "content": "创新点与特色的完整文本",
      "points": [
        { "type": "原始创新|集成创新|应用创新", "content": "创新点描述", "support": "技术支撑", "effect": "预期效果" }
      ]
    },
    "feasibility": {
      "content": "研究方案与技术路线的完整文本",
      "analysis": "可行性分析摘要"
    },
    "expectedOutcomes": {
      "content": "预期成果与考核指标的完整文本",
      "metrics": [
        { "type": "论文|专利|软件|人才培养|学术交流", "description": "具体指标", "quantity": "数量/级别" }
      ]
    }
  },
  "budget": {
    "total": "总预算（如'80万元'）",
    "breakdown": [
      { "category": "设备费|材料费|测试费|差旅费|劳务费|管理费|其他", "amount": "金额", "justification": "必要性说明" }
    ]
  },
  "timeline": {
    "phases": [
      { "phase": "第1年|第2年|第3年|...", "tasks": ["任务1", "任务2"], "milestones": ["里程碑1", "里程碑2"] }
    ]
  },
  "references": ["[REF-1] 作者, 年份, 标题, 期刊/会议", "..."]
}

约束：
- 所有 content 字段必须为非空字符串，且内容完整、可独立阅读
- keyPoints 至少 3 条
- objectives 至少 2 条
- innovation.points 至少 2 条，每条必须包含 type/content/support/effect
- expectedOutcomes.metrics 至少 3 条
- budget.breakdown 至少 4 项
- timeline.phases 至少 2 个阶段
- references 至少 5 条
- 不要输出 markdown 代码块（\`\`\`json），直接输出纯 JSON 字符串`

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

export interface GrantInnovationPoint {
  type: '原始创新' | '集成创新' | '应用创新'
  content: string
  support: string
  effect: string
}

export interface GrantExpectedMetric {
  type: '论文' | '专利' | '软件' | '人才培养' | '学术交流' | '其他'
  description: string
  quantity?: string
}

export interface GrantBudgetItem {
  category: string
  amount: string
  justification: string
}

export interface GrantTimelinePhase {
  phase: string
  tasks: string[]
  milestones: string[]
}

export interface GrantApplicationResult {
  title: string
  sections: {
    background: { content: string; keyPoints: string[] }
    researchContent: { content: string; objectives: string[] }
    innovation: { content: string; points: GrantInnovationPoint[] }
    feasibility: { content: string; analysis: string }
    expectedOutcomes: { content: string; metrics: GrantExpectedMetric[] }
  }
  budget: { total: string; breakdown: GrantBudgetItem[] }
  timeline: { phases: GrantTimelinePhase[] }
  references: string[]
}

// ---------------------------------------------------------------------------
// Prompt Builder
// ---------------------------------------------------------------------------

export function buildGrantApplicationJsonPrompt(topic: string, context?: string): string {
  return `【科研项目申请书辅助 — JSON 结构化输出】

请为以下研究题目生成一份完整的基金申请书框架，并以 JSON 格式输出。

研究题目：${topic}

${context ? `背景信息：\n${context}\n` : ''}

【要求】
1. 严格按照 JSON Schema 输出，不要包含任何非 JSON 内容
2. 所有内容必须具体、可操作，禁止空泛表述
3. 创新点必须包含具体技术支撑和预期效果
4. 预算必须与研究内容匹配，有合理性说明
5. 引用必须标注 [REF-N]，不确定的标注 [CITATION NEEDED]`
}

// ---------------------------------------------------------------------------
// 解析函数
// ---------------------------------------------------------------------------

/** 安全解析基金申请 JSON 输出 */
export function parseGrantApplicationJson(rawText: string): GrantApplicationResult | null {
  try {
    // 1. 提取 JSON 块
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || rawText.match(/(\{[\s\S]*\})/)
    const jsonText = jsonMatch ? jsonMatch[1].trim() : rawText.trim()

    // 2. 清理非法控制字符
    const cleaned = jsonText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')

    const data = JSON.parse(cleaned)

    // 3. 验证并规范化
    if (!data.title || !data.sections) {
      console.warn('[parseGrantApplicationJson] Missing required fields')
      return null
    }

    const sections = data.sections

    return {
      title: String(data.title),
      sections: {
        background: {
          content: String(sections?.background?.content || ''),
          keyPoints: Array.isArray(sections?.background?.keyPoints)
            ? sections.background.keyPoints.map(String)
            : [],
        },
        researchContent: {
          content: String(sections?.researchContent?.content || sections?.research_content?.content || ''),
          objectives: Array.isArray(sections?.researchContent?.objectives)
            ? sections.researchContent.objectives.map(String)
            : Array.isArray(sections?.research_content?.objectives)
              ? sections.research_content.objectives.map(String)
              : [],
        },
        innovation: {
          content: String(sections?.innovation?.content || ''),
          points: Array.isArray(sections?.innovation?.points)
            ? sections.innovation.points.map((p: any) => ({
                type: ['原始创新', '集成创新', '应用创新'].includes(p?.type) ? p.type : '集成创新',
                content: String(p?.content || ''),
                support: String(p?.support || ''),
                effect: String(p?.effect || ''),
              }))
            : [],
        },
        feasibility: {
          content: String(sections?.feasibility?.content || ''),
          analysis: String(sections?.feasibility?.analysis || ''),
        },
        expectedOutcomes: {
          content: String(sections?.expectedOutcomes?.content || sections?.expected_outcomes?.content || ''),
          metrics: Array.isArray(sections?.expectedOutcomes?.metrics)
            ? sections.expectedOutcomes.metrics.map((m: any) => ({
                type: m?.type || '其他',
                description: String(m?.description || ''),
                quantity: m?.quantity ? String(m.quantity) : undefined,
              }))
            : [],
        },
      },
      budget: {
        total: String(data.budget?.total || ''),
        breakdown: Array.isArray(data.budget?.breakdown)
          ? data.budget.breakdown.map((b: any) => ({
              category: String(b?.category || ''),
              amount: String(b?.amount || ''),
              justification: String(b?.justification || ''),
            }))
          : [],
      },
      timeline: {
        phases: Array.isArray(data.timeline?.phases)
          ? data.timeline.phases.map((p: any) => ({
              phase: String(p?.phase || ''),
              tasks: Array.isArray(p?.tasks) ? p.tasks.map(String) : [],
              milestones: Array.isArray(p?.milestones) ? p.milestones.map(String) : [],
            }))
          : [],
      },
      references: Array.isArray(data.references)
        ? data.references.map(String)
        : [],
    }
  } catch (error) {
    console.warn('[parseGrantApplicationJson] Parse failed:', error instanceof Error ? error.message : String(error))
    return null
  }
}