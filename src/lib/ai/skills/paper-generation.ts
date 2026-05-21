/**
 * Paper Generation Skill —— AI 论文生成工作流
 *
 * 将 5 阶段论文生成流程封装为可复用的 Skill：
 * 1. proposal   → 选题立项
 * 2. structure  → 架构规划
 * 3. writing    → 正文写作
 * 4. data       → 数据/图表
 * 5. formatting → 排版交付
 *
 * 特性：
 * - 阶段间上下文自动传递（proposal → structure → writing）
 * - 每阶段可选质量门控
 * - 自动路由到 ZCHAT（含图片时）
 */

import type { Skill, SkillStage } from './types'
import {
  PAPER_GENERATION_SYSTEM_PROMPT,
  buildProposalPrompt,
  buildStructurePrompt,
  buildWritingPrompt,
  buildDataAnalysisPrompt,
  buildFormattingPrompt,
  buildQualityReviewPrompt,
} from '@/lib/ai/paper-generation-prompts'

// =============================================================================
// 阶段定义
// =============================================================================

const proposalStage: SkillStage = {
  id: 'proposal',
  name: '选题立项',
  description: '生成开题报告框架，明确研究问题和创新点',
  promptBuilder: (input) => {
    const topic = (input.topic as string) || ''
    const background = (input.background as string) || (input._ragPrefix as string) || undefined
    const content = (input.content as string) || undefined
    return buildProposalPrompt(topic, background, content)
  },
  // 默认使用 Skill defaultModel (glm-5.1)，主模型失败时自动回退到 MiniMax → gpt-5 → deepseek-v4-flash
  temperature: 0.7,
  qualityGate: { enabled: true },
}

const structureStage: SkillStage = {
  id: 'structure',
  name: '架构规划',
  description: '设计论文结构，规划章节和图表',
  promptBuilder: (input, context) => {
    const topic = (input.topic as string) || context.topic
    // 如果已有 proposal 输出，注入作为上下文
    const proposal = context.stageOutputs['proposal']
    const content = (input.content as string) || undefined
    return buildStructurePrompt(topic, proposal, content)
  },
  temperature: 0.7,
  qualityGate: { enabled: true },
}

const writingStage: SkillStage = {
  id: 'writing',
  name: '正文写作',
  description: '分段生成学术文本，保持严谨风格',
  promptBuilder: (input, context) => {
    const section = (input.section as string) || '引言'
    const topic = (input.topic as string) || context.topic
    const wordCount = (input.wordCount as number) || undefined
    // 注入 RAG 前缀、structure 阶段的大纲和已有写作内容
    const ragPrefix = (input._ragPrefix as string) || ''
    const structure = context.stageOutputs['structure']
    const existingContent = (input.content as string) || undefined
    const contextText = [ragPrefix, structure, existingContent].filter(Boolean).join('\n\n')
    return buildWritingPrompt(section, topic, contextText || undefined, wordCount)
  },
  temperature: 0.6,
  maxTokens: 4096,
  qualityGate: {
    enabled: true,
    promptBuilder: (output, context) => {
      const section = context.stageOutputs['_currentSection'] || '正文'
      return buildQualityReviewPrompt(output, section)
    },
  },
}

const dataStage: SkillStage = {
  id: 'data',
  name: '数据/图表',
  description: '统计方法建议和图表描述（支持上传数据图片进行分析）',
  promptBuilder: (input) => {
    const dataDescription = (input.dataDescription as string) || ''
    const analysisGoal = (input.analysisGoal as string) || ''
    const images = (input._images as string[] | undefined) || []
    return buildDataAnalysisPrompt(dataDescription, analysisGoal, images)
  },
  temperature: 0.5,
  qualityGate: { enabled: true },
}

const formattingStage: SkillStage = {
  id: 'formatting',
  name: '排版交付',
  description: '按用户指定格式转换为 LaTeX / Markdown / 纯文本之一',
  promptBuilder: (input, context) => {
    const format = (input.format as 'latex' | 'markdown' | 'plain') || 'markdown'
    // 收集所有阶段输出作为待排版内容
    const allContent = Object.entries(context.stageOutputs)
      .filter(([k]) => k !== 'formatting')
      .map(([k, v]) => `## ${k}\n${v}`)
      .join('\n\n')
    const content = (input.content as string) || allContent
    return buildFormattingPrompt(content, format)
  },
  temperature: 0.3,
  maxTokens: 8192,
}

// =============================================================================
// Skill 定义
// =============================================================================

export const paperGenerationSkill: Skill = {
  id: 'paper-generation',
  name: 'AI论文生成',
  description: '从选题到成稿的全流程学术写作辅助，支持5阶段工作流',
  version: '2.0.0',
  systemPrompt: PAPER_GENERATION_SYSTEM_PROMPT,
  stages: [proposalStage, structureStage, writingStage, dataStage, formattingStage],
  defaultModel: 'glm-5.1',
  defaultMaxTokens: 4096,
  defaultTemperature: 0.6,
}

// =============================================================================
// 便捷函数
// =============================================================================

/**
 * 获取 Skill 阶段元数据（用于 UI 展示）
 */
export function getPaperGenerationStages() {
  return paperGenerationSkill.stages.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
  }))
}

/**
 * 检查阶段 ID 是否有效
 */
export function isValidPaperStage(stageId: string): boolean {
  return paperGenerationSkill.stages.some((s) => s.id === stageId)
}

/**
 * 获取阶段的默认参数
 */
export function getPaperStageDefaults(stageId: string): {
  temperature?: number
  maxTokens?: number
} {
  const stage = paperGenerationSkill.stages.find((s) => s.id === stageId)
  return {
    temperature: stage?.temperature ?? paperGenerationSkill.defaultTemperature,
    maxTokens: stage?.maxTokens ?? paperGenerationSkill.defaultMaxTokens,
  }
}
