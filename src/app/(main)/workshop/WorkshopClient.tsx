'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, PanelLeft, PanelLeftClose, Bot, Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

import { useChat } from '@/hooks/useChat'
import { useHermesCapabilities } from '@/hooks/useHermesCapabilities'
import { getAgentMode, type AgentMode, agentModes } from '@/lib/ai/agent-modes'

import { AgentSidebar } from '@/components/features/workshop/AgentSidebar'
import { AgentModeSelector } from '@/components/features/workshop/AgentModeSelector'
import { ChatMessageItem } from '@/components/features/workshop/ChatMessage'
import { ChatInput } from '@/components/features/workshop/ChatInput'
import { WelcomeScreen } from '@/components/features/workshop/WelcomeScreen'
import { PeerReviewPanel } from '@/components/features/workshop/PeerReviewPanel'
import { PaperGenerationPanel } from '@/components/features/workshop/PaperGenerationPanel'

const VALID_MODES = Object.keys(agentModes) as AgentMode[]

export default function WorkshopClient() {
  const searchParams = useSearchParams()
  const initialModeParam = searchParams.get('mode') as AgentMode | null
  const initialMode = initialModeParam && VALID_MODES.includes(initialModeParam)
    ? initialModeParam
    : 'general'

  const {
    sessions,
    currentSessionId,
    messages,
    mode,
    loading,
    error,
    streamingContent,
    dbAvailable,
    createSession,
    switchSession,
    deleteSession,
    changeMode,
    sendMessage,
    stopGeneration,
    clearMessages,
  } = useChat(initialMode)

  const { capabilities: hermesCaps } = useHermesCapabilities()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [modeInitialized, setModeInitialized] = useState(false)

  const activeMode = getAgentMode(mode)

  // Handle URL mode parameter
  useEffect(() => {
    if (!modeInitialized && initialMode !== 'general' && mode !== initialMode) {
      changeMode(initialMode)
      setModeInitialized(true)
    }
  }, [initialMode, mode, changeMode, modeInitialized])

  // Auto-scroll: only scroll when new user message is added or AI starts responding
  // Don't scroll if user has manually scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, streamingContent])

  const handleModeChange = (newMode: AgentMode) => {
    changeMode(newMode)
    // Create new session when switching modes for fresh context
    if (messages.length > 0) {
      createSession(newMode)
    }
  }

  const handleSend = (content: string, options?: Record<string, unknown>) => {
    // Map mode to action for the API
    const actionMap: Record<AgentMode, string | undefined> = {
      general: undefined,
      paper: 'analyze',
      grant: 'grant',
      survey: 'survey',
      research: 'suggest',
      community_manager: undefined,
      peer_review: 'peer_review',
      paper_generation: 'paper_generation',
    }

    const action = (options?.action as string) || actionMap[mode]

    sendMessage(content, {
      action,
      ...options,
      // 审稿和基金模式默认启用结构化输出
      structured:
        options?.structured !== undefined
          ? options.structured
          : action === 'peer_review' || action === 'grant',
    })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-4 md:-mx-0">
      {/* Sidebar */}
      <AgentSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        mode={mode}
        isOpen={sidebarOpen}
        dbAvailable={dbAvailable}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCreateSession={() => createSession(mode)}
        onSwitchSession={switchSession}
        onDeleteSession={deleteSession}
        onChangeMode={handleModeChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle (desktop) */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-8 w-8"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>

            {/* Mode selector */}
            <AgentModeSelector
              currentMode={mode}
              onChange={handleModeChange}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Hermes Capability Badges */}
            {hermesCaps?.raw && hermesCaps.raw.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5">
                {hermesCaps.raw.map((tool) => (
                  <span
                    key={tool}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-tea-primary/10 text-tea-primary border border-tea-primary/20"
                    title={`Hermes 工具: ${tool}`}
                  >
                    {tool === 'web' && '搜索'}
                    {tool === 'browser' && '浏览'}
                    {tool === 'code_execution' && '代码'}
                    {tool === 'vision' && '视觉'}
                    {tool === 'image_gen' && '绘图'}
                    {tool === 'skills' && '技能'}
                    {tool === 'todo' && '待办'}
                    {tool === 'memory' && '记忆'}
                    {tool === 'session_search' && '回溯'}
                    {tool === 'clarify' && '澄清'}
                    {!['web','browser','code_execution','vision','image_gen','skills','todo','memory','session_search','clarify'].includes(tool) && tool}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Sparkles className={cn('h-4 w-4', activeMode.color)} />
              <span className="text-sm font-medium hidden sm:inline">
                AI Workshop
              </span>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden border-0 rounded-none shadow-none">
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 py-5 space-y-6 bg-dot-pattern"
            >
              {messages.length === 0 && !loading && (
                <WelcomeScreen
                  mode={activeMode}
                  onQuickPrompt={handleSend}
                />
              )}

              {messages.map((message, i) => (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  index={i}
                  isStreaming={
                    loading &&
                    i === messages.length - 1 &&
                    message.role === 'assistant'
                  }
                  streamingContent={
                    loading &&
                    i === messages.length - 1 &&
                    message.role === 'assistant'
                      ? streamingContent
                      : undefined
                  }
                />
              ))}

              {/* Streaming placeholder (before message is added to list) */}
              {loading && streamingContent && messages.length > 0 &&
                messages[messages.length - 1].role === 'user' && (
                  <div className="flex gap-3 animate-fade-in-up">
                    <div className="flex-shrink-0 size-9 rounded-full bg-gradient-to-br from-convo-blue to-convo-blue/80 flex items-center justify-center">
                      <Bot className="size-4 text-convo-blue-foreground" />
                    </div>
                    <div className="flex-1 max-w-[85%]">
                      <div className="bg-gradient-to-br from-convo-blue to-convo-blue/80 text-convo-blue-foreground rounded-2xl rounded-tl-md px-4 py-3 inline-block shadow-sm select-text">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed select-text">
                          {streamingContent}
                          <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Loading indicator (no streaming yet) */}
              {loading && !streamingContent && (
                <div className="flex gap-3 animate-fade-in-up">
                  <div className="size-9 rounded-full bg-gradient-to-br from-convo-blue to-convo-blue/80 flex items-center justify-center">
                    <Bot className="size-4 text-convo-blue-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-convo-blue/10 rounded-2xl rounded-tl-md px-4 py-3 inline-block border border-convo-blue/20">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin text-convo-blue" />
                        <span>AI 思考中</span>
                        <span className="flex gap-0.5">
                          <span
                            className="w-1 h-1 rounded-full bg-convo-blue animate-typing-bounce"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="w-1 h-1 rounded-full bg-convo-blue animate-typing-bounce"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="w-1 h-1 rounded-full bg-convo-blue animate-typing-bounce"
                            style={{ animationDelay: '300ms' }}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex gap-3 animate-fade-in-up">
                  <div className="size-9 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="size-4 text-destructive" />
                  </div>
                  <div className="flex-1 max-w-[85%]">
                    <div className="bg-destructive/5 text-destructive rounded-2xl rounded-tl-md px-4 py-3 border border-destructive/15">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">出错了</p>
                          <p className="text-sm mt-0.5 opacity-90 leading-relaxed">{error}</p>
                        </div>
                        <button
                          onClick={() => {
                            const lastUser = [...messages].reverse().find((m) => m.role === 'user')
                            if (lastUser) {
                              handleSend(lastUser.content)
                            }
                          }}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-destructive/10 hover:bg-destructive/20 transition-colors flex-shrink-0 mt-0.5"
                          title="重试"
                        >
                          <RotateCcw className="h-3 w-3" />
                          重试
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-tea-primary/10 p-4 bg-background">
              {mode === 'peer_review' && messages.length === 0 && !loading ? (
                <PeerReviewPanel onSend={handleSend} loading={loading} />
              ) : mode === 'paper_generation' && messages.length === 0 && !loading ? (
                <PaperGenerationPanel onSend={handleSend} loading={loading} />
              ) : (
                <ChatInput
                  onSend={handleSend}
                  onStop={stopGeneration}
                  loading={loading}
                  placeholder={`${activeMode.label}模式：输入你的问题...`}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
