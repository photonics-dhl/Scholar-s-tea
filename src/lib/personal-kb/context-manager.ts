/**
 * 对话上下文管理器
 * 策略（混合策略 C）：
 * 1. 默认只发送最近 30 轮完整对话（滑动窗口底线）
 * 2. 超过 100K tokens 时显示阈值提醒
 * 3. 提供"压缩并继续"功能
 */

import type { ChatMessage } from '@/hooks/useChat'
import { estimateTokens } from './chunker'

const MAX_HISTORY_ROUNDS = 30 // 保留最近 30 轮（user + assistant 算一轮）
const TOKEN_WARNING_THRESHOLD = 100000 // 100K tokens 提醒

export interface ContextManagerState {
  totalTokens: number
  isWarning: boolean
  hiddenRounds: number // 被滑动窗口隐藏的轮次数
  summary?: string // 已生成的摘要
}

/**
 * 计算一组消息的总 token 量
 */
export function calculateContextTokens(messages: ChatMessage[]): number {
  let total = 0
  for (const msg of messages) {
    total += estimateTokens(msg.content) + 4 // +4 for role overhead
  }
  return Math.ceil(total)
}

/**
 * 应用滑动窗口：只保留最近 N 轮对话
 * 一轮 = user message + assistant message
 */
export function applySlidingWindow(messages: ChatMessage[]): {
  visible: ChatMessage[]
  hiddenCount: number
} {
  if (messages.length === 0) return { visible: [], hiddenCount: 0 }

  // 按时间戳排序
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp)

  // 找到 user-assistant 配对，从后往前数 MAX_HISTORY_ROUNDS 轮
  const pairs: { userIndex: number; assistantIndex: number }[] = []
  let currentUser: number | null = null

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].role === 'user') {
      currentUser = i
    } else if (sorted[i].role === 'assistant' && currentUser !== null) {
      pairs.push({ userIndex: currentUser, assistantIndex: i })
      currentUser = null
    }
  }

  if (pairs.length <= MAX_HISTORY_ROUNDS) {
    return { visible: sorted, hiddenCount: 0 }
  }

  // 只保留最近 MAX_HISTORY_ROUNDS 轮
  const startPairIndex = pairs.length - MAX_HISTORY_ROUNDS
  const startIndex = pairs[startPairIndex].userIndex

  const visible = sorted.slice(startIndex)
  const hiddenCount = startIndex

  return { visible, hiddenCount }
}

/**
 * 获取上下文管理状态（用于 UI 显示）
 */
export function getContextState(messages: ChatMessage[]): ContextManagerState {
  const { visible, hiddenCount } = applySlidingWindow(messages)
  const totalTokens = calculateContextTokens(visible)

  return {
    totalTokens,
    isWarning: totalTokens > TOKEN_WARNING_THRESHOLD,
    hiddenRounds: hiddenCount,
  }
}

/**
 * 生成对话摘要
 * 调用 AI API 将隐藏的早期对话压缩为摘要
 */
export async function generateConversationSummary(
  hiddenMessages: ChatMessage[]
): Promise<string> {
  if (hiddenMessages.length === 0) return ''

  const conversationText = hiddenMessages
    .map((m) => `${m.role === 'user' ? '用户' : 'AI'}：${m.content.slice(0, 500)}`)
    .join('\n\n')

  try {
    const res = await fetch('/api/v1/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `请将以下对话压缩为一份简洁的摘要（500字以内），保留所有关键事实、结论和待讨论的问题，丢弃闲聊和重复内容：\n\n${conversationText}`,
          },
        ],
        mode: 'general',
        stream: false,
        useRag: false,
      }),
    })

    const data = await res.json()
    if (data.success && data.data?.content) {
      return data.data.content
    }
  } catch (err) {
    console.error('[ContextManager] Summary generation failed:', err)
  }

  return ''
}

/**
 * 将摘要注入为 system message
 */
export function injectSummary(
  messages: ChatMessage[],
  summary: string
): ChatMessage[] {
  if (!summary) return messages

  const summaryMsg: ChatMessage = {
    id: `summary-${Date.now()}`,
    role: 'system',
    content: `【历史对话摘要】\n${summary}`,
    timestamp: Date.now() - 1,
  }

  // 插入到第一条 user message 之前
  const firstUserIndex = messages.findIndex((m) => m.role === 'user')
  if (firstUserIndex === -1) return [summaryMsg, ...messages]

  const result = [...messages]
  result.splice(firstUserIndex, 0, summaryMsg)
  return result
}
