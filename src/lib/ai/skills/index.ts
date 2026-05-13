/**
 * Scholar's Tea — AI Skill 系统入口
 *
 * 使用方式：
 * ```ts
 * import { executeSkill, getSkill, registerSkill } from '@/lib/ai/skills'
 * import { paperGenerationSkill } from '@/lib/ai/skills/paper-generation'
 *
 * // 注册 Skill（在应用启动时执行一次）
 * registerSkill(paperGenerationSkill)
 *
 * // 执行完整工作流
 * const result = await executeSkill('paper-generation', {
 *   topic: '联邦学习中的隐私保护',
 *   background: '...',
 * })
 *
 * // 执行单阶段
 * const { content } = await executeSkillStage('paper-generation', 'writing', {
 *   topic: '...',
 *   section: '引言',
 * })
 * ```
 */

export * from './types'
export * from './engine'
export * from './paper-generation'
