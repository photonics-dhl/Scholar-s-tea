'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { AgentMode } from '@/lib/ai/agent-modes'

export interface ChatAttachment {
  type: 'image' | 'file'
  url: string
  name: string
  size?: string
}

export interface CitationStatus {
  verified: number
  unverified: number
  score: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  attachments?: ChatAttachment[]
  ragContext?: Array<{
    id: string
    title: string
    source?: string
  }>
  /** 引用验证结果（仅 Hermes 增强模式生成） */
  citations?: CitationStatus
  /** 论文生成时检索到的真实外部文献 */
  papers?: Array<{
    title: string
    authors: string[]
    year?: number
    venue?: string
    url?: string
  }>
  /** 结构化数据（JSON 解析结果），仅 peer_review / grant 等结构化模式 */
  structured?: unknown
}

export interface ChatSession {
  id: string
  title: string
  mode: AgentMode
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  /** 对应数据库 WorkshopSession.id（登录用户） */
  dbId?: string
}

const STORAGE_KEY = 'scholars-tea-chat-sessions'
const MAX_SESSIONS = 50

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function getInitials(title: string): string {
  return title.slice(0, 20) + (title.length > 20 ? '...' : '')
}

/** 清理 AI 错误响应中的 HTML 标签，提取可读文本 */
function sanitizeErrorMessage(text: string, status: number): string {
  if (!text || text.length < 10) {
    if (status === 503) return 'AI 服务暂时不可用（503），请稍后重试。如果持续出现，可能是论文内容过长，建议缩短后重试。'
    if (status === 502) return 'AI 服务网关错误（502），请稍后重试'
    if (status === 504) return 'AI 服务响应超时（504），请稍后重试'
    if (status === 429) return 'AI 服务请求过多（429），请稍后重试'
    if (status === 400) return '请求格式错误（400），请检查输入内容'
    return `AI 服务错误 (${status})`
  }
  // 尝试提取 HTML title
  const titleMatch = text.match(/<title>([^<]*)<\/title>/i)
  if (titleMatch) {
    const title = titleMatch[1].trim()
    if (title && title.length > 3) {
      return `${title} (${status})`
    }
  }
  // 移除 HTML 标签
  let clean = text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
  if (clean.length > 200) {
    clean = clean.slice(0, 200) + '…'
  }
  if (!clean) {
    return `AI 服务错误 (${status})`
  }
  return clean
}

function loadLocalSessions(): ChatSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalSessions(sessions: ChatSession[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)))
  } catch {
    // Storage full or unavailable
  }
}

/** 从服务器加载会话列表 */
async function loadDbSessions(): Promise<ChatSession[]> {
  const res = await fetch('/api/v1/workshop/sessions')
  if (!res.ok) return []
  const data = await res.json()
  if (!data.success || !Array.isArray(data.data)) return []

  return data.data.map((s: Record<string, unknown>) => ({
    id: s.id as string,
    dbId: s.id as string,
    title: s.title as string,
    mode: (s.mode as string) as AgentMode,
    messages: [], // 懒加载，切换时再获取详情
    createdAt: new Date(s.createdAt as string).getTime(),
    updatedAt: new Date(s.updatedAt as string).getTime(),
  }))
}

/** 从服务器加载单个会话的完整消息 */
async function loadDbSessionDetail(dbId: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/v1/workshop/sessions/${dbId}`)
  if (!res.ok) return []
  const data = await res.json()
  if (!data.success || !data.data?.messages) return []

  return (data.data.messages as Array<Record<string, unknown>>).map((m) => ({
    id: m.id as string,
    role: (m.role as string) as ChatMessage['role'],
    content: m.content as string,
    timestamp: new Date(m.createdAt as string).getTime(),
    citations: m.citations ? JSON.parse(m.citations as string) : undefined,
    ragContext: m.ragContext ? JSON.parse(m.ragContext as string) : undefined,
    attachments: m.attachments ? JSON.parse(m.attachments as string) : undefined,
  }))
}

/** 在服务器创建新会话 */
async function createDbSession(title: string, mode: string): Promise<string | null> {
  const res = await fetch('/api/v1/workshop/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, mode }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.success ? (data.data.id as string) : null
}

/** 在服务器删除会话 */
async function deleteDbSession(dbId: string): Promise<boolean> {
  const res = await fetch(`/api/v1/workshop/sessions/${dbId}`, { method: 'DELETE' })
  return res.ok
}

/** 更新服务器会话标题/mode */
async function patchDbSession(dbId: string, patch: { title?: string; mode?: string }): Promise<boolean> {
  const res = await fetch(`/api/v1/workshop/sessions/${dbId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return res.ok
}

/** 批量保存消息到服务器 */
async function saveDbMessages(
  dbId: string,
  messages: ChatMessage[]
): Promise<boolean> {
  const res = await fetch(`/api/v1/workshop/sessions/${dbId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        citations: m.citations,
        ragContext: m.ragContext,
        attachments: m.attachments,
      })),
    }),
  })
  return res.ok
}

export function useChat(initialMode: AgentMode = 'general') {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [mode, setMode] = useState<AgentMode>(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [dbAvailable, setDbAvailable] = useState(false)

  // Load sessions: try DB first, fallback to localStorage
  useEffect(() => {
    if (initialized) return

    let cancelled = false
    ;(async () => {
      try {
        const dbSessions = await loadDbSessions()
        if (!cancelled) {
          if (dbSessions.length > 0) {
            setSessions(dbSessions)
            setDbAvailable(true)
          } else {
            // Fallback to localStorage (guest or DB empty)
            const local = loadLocalSessions()
            setSessions(local)
          }
          setInitialized(true)
        }
      } catch {
        if (!cancelled) {
          const local = loadLocalSessions()
          setSessions(local)
          setInitialized(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [initialized])

  const currentSession = sessions.find((s) => s.id === currentSessionId) || null

  // Switch session: lazy-load messages from DB if needed
  const switchSession = useCallback(
    async (sessionId: string) => {
      setCurrentSessionId(sessionId)
      setError(null)
      setStreamingContent('')

      const session = sessions.find((s) => s.id === sessionId)
      if (session?.dbId && session.messages.length === 0) {
        // Lazy load from DB
        const dbMessages = await loadDbSessionDetail(session.dbId)
        setMessages(dbMessages)
        setMode(session.mode)
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, messages: dbMessages } : s))
        )
      } else if (session) {
        setMessages(session.messages)
        setMode(session.mode)
      }
    },
    [sessions]
  )

  const createSession = useCallback(
    async (newMode: AgentMode = mode) => {
      const localId = generateId()

      // Try create in DB first
      let dbId: string | null = null
      if (dbAvailable) {
        try {
          dbId = await createDbSession('新对话', newMode)
        } catch {
          // DB unavailable, continue with local only
        }
      }

      const session: ChatSession = {
        id: dbId || localId,
        dbId: dbId || undefined,
        title: '新对话',
        mode: newMode,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      setSessions((prev) => [session, ...prev])
      setCurrentSessionId(session.id)
      setMessages([])
      setMode(newMode)
      setError(null)
      setStreamingContent('')
      return session.id
    },
    [mode, dbAvailable]
  )

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId)
      if (session?.dbId) {
        try {
          await deleteDbSession(session.dbId)
        } catch {
          // Ignore DB delete errors
        }
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (currentSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId)
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[0].id)
          setMessages(remaining[0].messages)
          setMode(remaining[0].mode)
        } else {
          setCurrentSessionId(null)
          setMessages([])
        }
      }
    },
    [currentSessionId, sessions]
  )

  const updateSessionTitle = useCallback(
    async (sessionId: string, title: string) => {
      const session = sessions.find((s) => s.id === sessionId)
      if (session?.dbId) {
        patchDbSession(session.dbId, { title }).catch(() => {})
      }
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
      )
    },
    [sessions]
  )

  const changeMode = useCallback(
    async (newMode: AgentMode) => {
      setMode(newMode)
      if (currentSessionId && currentSession) {
        if (currentSession.dbId) {
          patchDbSession(currentSession.dbId, { mode: newMode }).catch(() => {})
        }
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId ? { ...s, mode: newMode } : s
          )
        )
      }
    },
    [currentSessionId, currentSession]
  )

  const sendMessage = useCallback(
    async (content: string, options?: Record<string, unknown>) => {
      const attachments: ChatAttachment[] | undefined =
        options && Array.isArray((options as Record<string, unknown>).attachments)
          ? ((options as Record<string, unknown>).attachments as ChatAttachment[])
          : undefined

      if ((!content.trim() && !attachments?.length) || loading) return

      // Ensure we have a session
      let activeSessionId = currentSessionId
      if (!activeSessionId) {
        activeSessionId = await createSession(mode)
      }

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
        attachments,
      }

      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setLoading(true)
      setError(null)
      setStreamingContent('')

      // Update session with user message
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: updatedMessages,
                updatedAt: Date.now(),
                title:
                  s.title === '新对话'
                    ? getInitials(content.trim() || (attachments?.[0]?.name ?? '附件'))
                    : s.title,
              }
            : s
        )
      )

      const doFetch = async (attempt = 1): Promise<Response> => {
        abortRef.current = new AbortController()

        // Build API messages
        const apiMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const res = await fetch('/api/v1/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            attachments: userMessage.attachments,
            mode,
            stream: true,
            ...options,
            useRag: true,
          }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) {
          const contentType = res.headers.get('content-type')
          let errorMessage = sanitizeErrorMessage('', res.status)
          try {
            if (contentType?.includes('application/json')) {
              const data = await res.json()
              errorMessage = data.error?.message || errorMessage
            } else {
              const text = await res.text()
              errorMessage = sanitizeErrorMessage(text, res.status)
            }
          } catch {
            // ignore parse errors
          }
          // 对网络不稳定类错误自动重试 1 次
          const retryable = res.status === 503 || res.status === 502 || res.status === 504
          if (retryable && attempt < 2) {
            console.warn(`[useChat] ${res.status} error, retrying in 2s...`)
            await new Promise((r) => setTimeout(r, 2000))
            return doFetch(attempt + 1)
          }
          throw new Error(errorMessage)
        }
        return res
      }

      try {
        const res = await doFetch()

        const contentType = res.headers.get('content-type')
        let finalMessages: ChatMessage[] = []

        if (contentType?.includes('text/event-stream')) {
          // Handle SSE streaming
          const reader = res.body?.getReader()
          const decoder = new TextDecoder()
          let fullContent = ''
          let ragContext: ChatMessage['ragContext']

          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  if (data === '[DONE]') continue
                  try {
                    const parsed = JSON.parse(data)
                    // Support both unified format { content } and OpenAI/MiniMax format { choices:[{delta:{content}}] }
                    const content =
                      parsed.content ||
                      parsed.choices?.[0]?.delta?.content ||
                      parsed.choices?.[0]?.text ||
                      ''
                    if (content) {
                      fullContent += content
                      setStreamingContent(fullContent)
                    }
                    if (parsed.ragContext) {
                      ragContext = parsed.ragContext
                    }
                  } catch {
                    // Ignore parse errors for incomplete chunks
                  }
                }
              }
            }
          }

          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: fullContent,
            timestamp: Date.now(),
            ragContext,
          }

          finalMessages = [...updatedMessages, assistantMessage]
          setMessages(finalMessages)
          setStreamingContent('')

          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? { ...s, messages: finalMessages, updatedAt: Date.now() }
                : s
            )
          )
        } else {
          // Handle non-streaming response
          const data = await res.json()

          if (data.success && data.data?.content) {
            const assistantMessage: ChatMessage = {
              id: generateId(),
              role: 'assistant',
              content: data.data.content,
              timestamp: Date.now(),
              ragContext: data.data.ragContext,
              citations: data.data.citations,
              papers: data.data.papers,
              structured: data.data.structured,
            }

            finalMessages = [...updatedMessages, assistantMessage]
            setMessages(finalMessages)

            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSessionId
                  ? { ...s, messages: finalMessages, updatedAt: Date.now() }
                  : s
              )
            )
          } else {
            throw new Error(data.error?.message || 'AI 响应为空')
          }
        }

        // Async persist to DB (fire-and-forget)
        const session = sessions.find((s) => s.id === activeSessionId)
        if (session?.dbId && finalMessages.length > 0) {
          saveDbMessages(session.dbId, finalMessages).catch(() => {})
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('已取消生成')
        } else {
          setError(err instanceof Error ? err.message : '网络错误，请重试')
        }
      } finally {
        setLoading(false)
        abortRef.current = null
      }
    },
    [messages, loading, currentSessionId, mode, createSession, sessions]
  )

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setStreamingContent('')
    if (currentSessionId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s
        )
      )
    }
  }, [currentSessionId])

  // Persist local sessions on change (for non-DB users)
  useEffect(() => {
    if (!initialized) return
    const hasDbSession = sessions.some((s) => s.dbId)
    if (!hasDbSession) {
      saveLocalSessions(sessions)
    }
  }, [sessions, initialized])

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    mode,
    loading,
    error,
    streamingContent,
    dbAvailable,
    createSession,
    switchSession,
    deleteSession,
    updateSessionTitle,
    changeMode,
    sendMessage,
    stopGeneration,
    clearMessages,
  }
}
