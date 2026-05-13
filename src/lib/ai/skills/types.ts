/**
 * Scholar's Tea — 轻量级 AI Skill 系统类型定义
 *
 * Skill = 可复用的、结构化的 AI 工作流模板
 * 设计原则：
 * - 纯 TypeScript，零外部依赖
 * - Prompt 模板驱动，非 agent 循环
 * - 支持多阶段工作流 + 上下文传递 + 质量门控
 * - 易于扩展：新增 Skill = 新增一个配置文件
 */

import type { ChatMessage } from '@/lib/ai/claude-service'

/** Skill 阶段上下文 —— 跨阶段传递的共享状态 */
export interface SkillContext {
  /** 用户输入的主题/任务 */
  topic: string
  /** 各阶段输出结果（按 stageId 索引） */
  stageOutputs: Record<string, string>
  /** 元数据（用户ID、学科领域、时间戳等） */
  metadata: Record<string, unknown>
}

/** Skill 阶段定义 */
export interface SkillStage {
  /** 阶段唯一标识 */
  id: string
  /** 阶段名称 */
  name: string
  /** 阶段描述 */
  description: string
  /** Prompt 构建函数：接收输入参数和上下文，返回完整 prompt */
  promptBuilder: (input: Record<string, unknown>, context: SkillContext) => string
  /** 使用的模型（覆盖 Skill 默认值） */
  model?: string
  /** 最大 token 数（覆盖 Skill 默认值） */
  maxTokens?: number
  /** 温度（覆盖 Skill 默认值） */
  temperature?: number
  /** 质量门控：生成后是否进行自批判 */
  qualityGate?: {
    enabled: boolean
    /** 质量评审 prompt 构建器（默认使用通用模板） */
    promptBuilder?: (output: string, context: SkillContext) => string
  }
  /** 下一阶段路由：固定 ID 或动态决策 */
  nextStage?:
    | string
    | ((output: string, context: SkillContext) => string | null)
}

/** Skill 定义 */
export interface Skill {
  /** Skill 唯一标识（kebab-case） */
  id: string
  /** 显示名称 */
  name: string
  /** 一句话描述 */
  description: string
  /** 版本号 */
  version: string
  /** 系统提示词 */
  systemPrompt: string
  /** 工作流阶段 */
  stages: SkillStage[]
  /** 默认模型 */
  defaultModel?: string
  /** 默认最大 token 数 */
  defaultMaxTokens?: number
  /** 默认温度 */
  defaultTemperature?: number
}

/** Skill 执行配置 */
export interface SkillExecutionOptions {
  /** 指定起始阶段（默认从第一个阶段开始） */
  startStage?: string
  /** 指定结束阶段（默认执行到工作流结束） */
  endStage?: string
  /** 是否启用流式输出 */
  stream?: boolean
  /** 是否启用质量门控 */
  enableQualityGate?: boolean
  /** 是否使用 ZCHAT 多模态模型（用于含图片的任务） */
  useVision?: boolean
  /** 附加的上下文消息（如历史对话） */
  historyMessages?: ChatMessage[]
}

/** Skill 执行结果 */
export interface SkillExecutionResult {
  /** 最终输出（最后一个阶段的输出） */
  output: string
  /** 各阶段完整输出 */
  stageOutputs: Record<string, string>
  /** 完整上下文 */
  context: SkillContext
  /** 质量评审结果（如启用） */
  qualityReviews?: Record<string, string>
}

/** Skill 注册表 */
export type SkillRegistry = Map<string, Skill>
