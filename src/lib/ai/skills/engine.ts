/**
 * Scholar's Tea — Skill 执行引擎
 *
 * 核心能力：
 * - 注册和检索 Skill
 * - 执行单阶段或多阶段工作流
 * - 上下文传递（前一阶段的输出注入后续阶段）
 * - 质量门控（生成后自批判）
 * - 自动路由（图片 → ZCHAT，文本 → MiniMax）
 */

import {
  chatWithAI,
  chatWithZCHAT,
  hasVisionContent,
  type ChatMessage,
} from '@/lib/ai/claude-service'
import type {
  Skill,
  SkillStage,
  SkillContext,
  SkillExecutionOptions,
  SkillExecutionResult,
  SkillRegistry,
} from './types'

// =============================================================================
// Skill 注册表
// =============================================================================

const _registry: SkillRegistry = new Map()

export function registerSkill(skill: Skill): void {
  _registry.set(skill.id, skill)
}

export function getSkill(id: string): Skill | undefined {
  return _registry.get(id)
}

export function listSkills(): Skill[] {
  return Array.from(_registry.values())
}

export function unregisterSkill(id: string): boolean {
  return _registry.delete(id)
}

// =============================================================================
// 单阶段执行
// =============================================================================

interface StageExecutionInput {
  skill: Skill
  stage: SkillStage
  params: Record<string, unknown>
  context: SkillContext
  useVision?: boolean
}

/**
 * 执行单个 Skill 阶段
 */
async function executeStage({
  skill,
  stage,
  params,
  context,
  useVision,
}: StageExecutionInput): Promise<{ content: string; error?: string }> {
  const prompt = stage.promptBuilder(params, context)
  const systemPrompt = skill.systemPrompt
  const model = stage.model || skill.defaultModel || 'MiniMax-M2.7'
  const maxTokens = stage.maxTokens || skill.defaultMaxTokens || 4096
  const temperature =
    stage.temperature !== undefined
      ? stage.temperature
      : skill.defaultTemperature !== undefined
        ? skill.defaultTemperature
        : 0.7

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ]

  // 自动路由：含图片 → ZCHAT，纯文本 → MiniMax
  const shouldUseVision = useVision || hasVisionContent(messages)

  if (shouldUseVision) {
    return chatWithZCHAT(messages, {
      systemPrompt,
      maxTokens,
      temperature,
      model: process.env.ZCHAT_VISION_MODEL || 'claude-sonnet-4-5',
    })
  }

  return chatWithAI(messages)
}

// =============================================================================
// 质量门控
// =============================================================================

/**
 * 对阶段输出执行质量评审（自批判）
 */
async function runQualityGate(
  skill: Skill,
  stage: SkillStage,
  output: string,
  context: SkillContext
): Promise<string> {
  const defaultReviewPrompt = `请对以下内容进行质量评审，从以下维度给出简短评价（每维度1-2句话）：
1. 原创性：是否有新意？
2. 严谨性：论证是否充分？
3. 清晰度：表达是否清楚？
4. 完整性：是否覆盖所有要求？

请用中文回答，总体给出一个 "通过/需修改" 结论。

待评审内容：
${output.slice(0, 3000)}`

  const reviewPrompt = stage.qualityGate?.promptBuilder
    ? stage.qualityGate.promptBuilder(output, context)
    : defaultReviewPrompt

  const reviewMessages: ChatMessage[] = [
    { role: 'system', content: '你是一位严格的学术质量评审员。' },
    { role: 'user', content: reviewPrompt },
  ]

  const result = await chatWithAI(reviewMessages)
  return result.content || '质量评审未返回结果'
}

// =============================================================================
// 多阶段工作流执行
// =============================================================================

/**
 * 执行完整 Skill 工作流
 *
 * @param skillId Skill 标识
 * @param input 初始输入参数（必须包含 topic）
 * @param options 执行选项
 * @returns 执行结果（包含各阶段输出和最终输出）
 */
export async function executeSkill(
  skillId: string,
  input: Record<string, unknown>,
  options: SkillExecutionOptions = {}
): Promise<SkillExecutionResult> {
  const skill = getSkill(skillId)
  if (!skill) {
    throw new Error(`Skill not found: ${skillId}`)
  }

  const topic = (input.topic as string) || ''
  if (!topic) {
    throw new Error('Skill execution requires "topic" in input')
  }

  // 初始化上下文
  const context: SkillContext = {
    topic,
    stageOutputs: {},
    metadata: {
      skillId,
      skillVersion: skill.version,
      executedAt: new Date().toISOString(),
      ...(input.metadata || {}),
    },
  }

  // 确定起始和结束阶段
  const stageIds = skill.stages.map((s) => s.id)
  const startIdx = options.startStage
    ? stageIds.indexOf(options.startStage)
    : 0
  const endIdx = options.endStage
    ? stageIds.indexOf(options.endStage)
    : skill.stages.length - 1

  if (startIdx === -1) throw new Error(`Start stage not found: ${options.startStage}`)
  if (endIdx === -1) throw new Error(`End stage not found: ${options.endStage}`)

  const stagesToRun = skill.stages.slice(startIdx, endIdx + 1)
  const qualityReviews: Record<string, string> = {}

  // 顺序执行各阶段
  for (const stage of stagesToRun) {
    // 构建阶段输入：合并用户输入 + 前一阶段输出
    const stageInput = {
      ...input,
      ...context.stageOutputs,
      _stageId: stage.id,
      _stageName: stage.name,
    }

    const result = await executeStage({
      skill,
      stage,
      params: stageInput,
      context,
      useVision: options.useVision,
    })

    if (result.error) {
      throw new Error(`Stage "${stage.id}" failed: ${result.error}`)
    }

    context.stageOutputs[stage.id] = result.content

    // 质量门控
    const enableQG =
      options.enableQualityGate !== undefined
        ? options.enableQualityGate
        : stage.qualityGate?.enabled || false

    if (enableQG) {
      const review = await runQualityGate(skill, stage, result.content, context)
      qualityReviews[stage.id] = review
    }
  }

  // 确定最终输出
  const lastStageId = stagesToRun[stagesToRun.length - 1].id
  const finalOutput = context.stageOutputs[lastStageId] || ''

  return {
    output: finalOutput,
    stageOutputs: context.stageOutputs,
    context,
    qualityReviews: Object.keys(qualityReviews).length > 0 ? qualityReviews : undefined,
  }
}

/**
 * 执行单阶段（用于已有工作流的逐步执行场景）
 */
export async function executeSkillStage(
  skillId: string,
  stageId: string,
  input: Record<string, unknown>,
  context?: Partial<SkillContext>,
  options?: { useVision?: boolean }
): Promise<{ content: string; error?: string }> {
  const skill = getRegistry().get(skillId)
  if (!skill) {
    return { content: '', error: `Skill not found: ${skillId}` }
  }

  const stage = skill.stages.find((s) => s.id === stageId)
  if (!stage) {
    return { content: '', error: `Stage not found: ${stageId} in skill ${skillId}` }
  }

  const fullContext: SkillContext = {
    topic: (input.topic as string) || context?.topic || '',
    stageOutputs: context?.stageOutputs || {},
    metadata: context?.metadata || {},
  }

  const stageInput = {
    ...input,
    ...fullContext.stageOutputs,
    _stageId: stage.id,
    _stageName: stage.name,
  }

  return executeStage({
    skill,
    stage,
    params: stageInput,
    context: fullContext,
    useVision: options?.useVision,
  })
}

function getRegistry(): SkillRegistry {
  return _registry
}
