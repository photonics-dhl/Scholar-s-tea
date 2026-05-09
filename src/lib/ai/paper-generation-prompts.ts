/**
 * AI 论文生成（Paper Generation）提示词模板
 *
 * 5阶段工作流：选题立项 → 架构规划 → 正文写作 → 数据/图表 → 排版交付
 */

export const PAPER_GENERATION_SYSTEM_PROMPT = `你是顶级学术期刊的资深编辑和写作顾问，熟悉 Nature、Science、Cell、IEEE、ACM 等期刊的投稿规范和写作风格。

## 核心能力
- 根据研究方向生成高质量的学术文本
- 设计严谨的论文结构和逻辑框架
- 提供统计方法和数据呈现建议
- 输出符合期刊规范的格式化文本

## 写作风格指南
- 使用准确的学术术语，避免口语化
- 遵循 IMRAD 结构（Introduction, Methods, Results, And Discussion）
- 每个段落有明确的主题句和支撑论据
- 适当使用连接词保证逻辑流畅
- 主动语态优先，但方法部分可用被动语态
- 数据驱动：所有结论必须有数据支撑

## 引用规范
- 关键论点必须标注引用占位符 [REF-N]
- 经典方法引用原始文献
- 近期工作引用近3-5年的文献
- 每个主要章节至少3-5个引用占位符`

// ===== 阶段1: 选题立项 =====
export function buildProposalPrompt(topic: string, background?: string): string {
  return `请为以下研究方向生成一份完整的开题报告框架：

研究主题：${topic}
${background ? `\n研究背景：${background}` : ''}

请输出以下内容：
1. 研究背景与意义（300字）
2. 核心科学问题（2-3个）
3. 国内外研究现状概述
4. 本文创新点（3-4条）
5. 预期研究目标
6. 技术路线概述
7. 预期成果形式`
}

// ===== 阶段2: 架构规划 =====
export function buildStructurePrompt(topic: string, proposal?: string): string {
  return `请为以下论文设计完整的结构框架：

论文主题：${topic}
${proposal ? `\n开题报告内容：\n${proposal.slice(0, 2000)}` : ''}

请输出：
1. 论文标题建议（3个备选）
2. 摘要框架（背景、方法、结果、结论）
3. 章节结构（含二级标题）
4. 每个章节的核心内容和字数建议
5. 关键图表规划（每个图表的内容描述）
6. 各章节间的逻辑衔接说明`
}

// ===== 阶段3: 正文写作 =====
export function buildWritingPrompt(
  section: string,
  topic: string,
  context?: string,
  wordCount?: number
): string {
  const targetWords = wordCount || 800
  return `请撰写以下论文章节：

论文主题：${topic}
目标章节：${section}
目标字数：${targetWords}字
${context ? `\n上下文/已有内容：\n${context.slice(0, 3000)}` : ''}

写作要求：
- 使用严谨的学术语言
- 每个段落有明确的主题句
- 关键论点标注引用占位符 [REF-N]
- 逻辑清晰，论证充分
- 适当使用过渡句连接段落

请直接输出该章节的完整文本。`
}

// ===== 阶段4: 数据/图表 =====
export function buildDataAnalysisPrompt(
  dataDescription: string,
  analysisGoal: string
): string {
  return `请为以下研究提供数据分析建议：

数据描述：${dataDescription}
分析目标：${analysisGoal}

请输出：
1. 推荐的统计方法及理由
2. 假设检验设计
3. 图表类型建议及绘制要点
4. 结果呈现方式
5. 潜在的统计陷阱和避免方法`
}

// ===== 阶段5: 排版交付 =====
export function buildFormattingPrompt(content: string, format: 'latex' | 'markdown' | 'plain'): string {
  const formatInstructions: Record<string, string> = {
    latex: '转换为标准 LaTeX 格式，使用 article 文档类，包含必要的宏包。',
    markdown: '转换为 Markdown 格式，使用标准语法，包含标题层级、列表、代码块等。',
    plain: '转换为纯文本格式，保留段落结构，去除所有格式标记。',
  }

  return `请将以下论文内容转换为 ${format.toUpperCase()} 格式：

${content.slice(0, 8000)}

转换要求：
${formatInstructions[format]}
- 保持原有的章节结构
- 数学公式使用合适的标记
- 图表位置用占位符标注
- 引用位置保留 [REF-N] 标记`
}

export type PaperGenerationStage =
  | 'proposal'
  | 'structure'
  | 'writing'
  | 'data'
  | 'formatting'

export const PAPER_GENERATION_STAGES = [
  {
    id: 'proposal' as const,
    label: '选题立项',
    description: '生成开题报告框架，明确研究问题和创新点',
    prompt: '输入研究方向',
  },
  {
    id: 'structure' as const,
    label: '架构规划',
    description: '设计论文结构，规划章节和图表',
    prompt: '输入论文主题',
  },
  {
    id: 'writing' as const,
    label: '正文写作',
    description: '分段生成学术文本，保持严谨风格',
    prompt: '输入目标章节',
  },
  {
    id: 'data' as const,
    label: '数据/图表',
    description: '统计方法建议和图表描述',
    prompt: '输入数据描述',
  },
  {
    id: 'formatting' as const,
    label: '排版交付',
    description: '转换为 LaTeX / Markdown / 纯文本',
    prompt: '输入论文全文',
  },
] as const
