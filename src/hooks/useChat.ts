'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { AgentMode } from '@/lib/ai/agent-modes'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  ragContext?: Array<{
    id: string
    title: string
    source?: string
  }>
}

export interface ChatSession {
  id: string
  title: string
  mode: AgentMode
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'scholars-tea-chat-sessions'
const MAX_SESSIONS = 50

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function getInitials(title: string): string {
  return title.slice(0, 20) + (title.length > 20 ? '...' : '')
}

function loadSessions(): ChatSession[] {
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

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)))
  } catch {
    // Storage full or unavailable
  }
}

export function useChat(initialMode: AgentMode = 'general') {
  // SSR-safe: start with empty sessions to avoid hydration mismatch
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [mode, setMode] = useState<AgentMode>(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Load from localStorage on client side only
  useEffect(() => {
    if (!initialized) {
      const loaded = loadSessions()
      setSessions(loaded)
      setInitialized(true)
    }
  }, [initialized])

  // Current session derived from sessions list
  const currentSession = sessions.find((s) => s.id === currentSessionId) || null

  // Initialize or restore session
  useEffect(() => {
    if (currentSessionId && currentSession) {
      setMessages(currentSession.messages)
      setMode(currentSession.mode)
    }
  }, [currentSessionId, currentSession])

  const createSession = useCallback(
    (newMode: AgentMode = mode) => {
      const session: ChatSession = {
        id: generateId(),
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
    [mode]
  )

  const switchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId)
    setError(null)
    setStreamingContent('')
  }, [])

  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (currentSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId)
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[0].id)
        } else {
          setCurrentSessionId(null)
          setMessages([])
        }
      }
    },
    [currentSessionId, sessions]
  )

  const updateSessionTitle = useCallback(
    (sessionId: string, title: string) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
      )
    },
    []
  )

  const changeMode = useCallback(
    (newMode: AgentMode) => {
      setMode(newMode)
      if (currentSessionId && currentSession) {
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
      if (!content.trim() || loading) return

      // Ensure we have a session
      let activeSessionId = currentSessionId
      if (!activeSessionId) {
        activeSessionId = createSession(mode)
      }

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
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
                    ? getInitials(content.trim())
                    : s.title,
              }
            : s
        )
      )

      try {
        abortRef.current = new AbortController()

        const res = await fetch('/api/v1/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            ...options,
            useRag: true,
          }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error?.message || 'AI 响应失败')
        }

        // Check if response is streaming
        const contentType = res.headers.get('content-type')
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
                    if (parsed.content) {
                      fullContent += parsed.content
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

          const finalMessages = [...updatedMessages, assistantMessage]
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
            }

            const finalMessages = [...updatedMessages, assistantMessage]
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
    [messages, loading, currentSessionId, mode, createSession]
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

  // Persist sessions on change
  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    mode,
    loading,
    error,
    streamingContent,
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
