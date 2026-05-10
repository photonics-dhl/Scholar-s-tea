'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, PanelLeft, PanelLeftClose, Bot, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

import { useChat } from '@/hooks/useChat'
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
    createSession,
    switchSession,
    deleteSession,
    changeMode,
    sendMessage,
    stopGeneration,
  } = useChat(initialMode)

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

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

    sendMessage(content, {
      action: actionMap[mode],
      ...options,
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

          <div className="flex items-center gap-2">
            <Sparkles className={cn('h-4 w-4', activeMode.color)} />
            <span className="text-sm font-medium hidden sm:inline">
              思想工坊
            </span>
          </div>
        </header>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden border-0 rounded-none shadow-none">
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-5 bg-dot-pattern"
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
                      <div className="bg-gradient-to-br from-convo-blue to-convo-blue/80 text-convo-blue-foreground rounded-2xl rounded-tl-md px-4 py-3 inline-block shadow-sm">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
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
                  <div className="size-9 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Bot className="size-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-destructive/10 text-destructive rounded-2xl rounded-tl-md px-4 py-3 inline-block border border-destructive/20">
                      <p className="text-sm">{error}</p>
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
