'use client'

import { useState } from 'react'
import {
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Brain,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
// ScrollArea not available, using native scroll
import { cn } from '@/lib/utils/cn'
import { getAgentMode, type AgentMode } from '@/lib/ai/agent-modes'
import type { ChatSession } from '@/hooks/useChat'

interface AgentSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  mode: AgentMode
  isOpen: boolean
  onToggle: () => void
  onCreateSession: () => void
  onSwitchSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onChangeMode: (mode: AgentMode) => void
}

/**
 * Agent 工作台侧边栏
 * 包含：模式选择、新建对话、历史对话列表
 */
export function AgentSidebar({
  sessions,
  currentSessionId,
  mode,
  isOpen,
  onToggle,
  onCreateSession,
  onSwitchSession,
  onDeleteSession,
  onChangeMode,
}: AgentSidebarProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null)
  const activeMode = getAgentMode(mode)

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-50 w-72 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-tea-primary" />
            <span className="font-semibold text-sm">对话历史</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onCreateSession}
              title="新建对话"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={onToggle}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-10 border-dashed border-tea-primary/30 hover:border-tea-primary/60 hover:bg-tea-primary/5"
            onClick={onCreateSession}
          >
            <Plus className="h-4 w-4 text-tea-primary" />
            <span className="text-sm">新建对话</span>
          </Button>
        </div>

        {/* Current Mode Badge */}
        <div className="px-3 pb-2">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
              activeMode.bgColor,
              activeMode.color
            )}
          >
            <activeMode.icon className="h-3.5 w-3.5" />
            <span className="font-medium">{activeMode.label}</span>
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 px-3 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">暂无对话</p>
              <p className="text-xs mt-1">点击上方按钮开始</p>
            </div>
          ) : (
            <div className="space-y-1 pb-3">
              {sessions.map((session) => {
                const sessionMode = getAgentMode(session.mode)
                const ModeIcon = sessionMode.icon
                const isActive = session.id === currentSessionId
                const isHovered = hoveredSession === session.id

                return (
                  <button
                    key={session.id}
                    onClick={() => onSwitchSession(session.id)}
                    onMouseEnter={() => setHoveredSession(session.id)}
                    onMouseLeave={() => setHoveredSession(null)}
                    className={cn(
                      'w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group',
                      isActive
                        ? 'bg-tea-primary/10 border border-tea-primary/20'
                        : 'hover:bg-muted border border-transparent'
                    )}
                  >
                    <ModeIcon
                      className={cn(
                        'h-4 w-4 mt-0.5 flex-shrink-0',
                        sessionMode.color
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm truncate',
                          isActive
                            ? 'font-medium text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {session.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">
                          {formatTime(session.updatedAt)}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full',
                            sessionMode.bgColor,
                            sessionMode.color
                          )}
                        >
                          {sessionMode.label}
                        </span>
                      </div>
                    </div>

                    {/* Delete button (visible on hover) */}
                    {(isHovered || isActive) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSession(session.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t text-[11px] text-muted-foreground text-center">
          对话保存在本地浏览器中
        </div>
      </aside>

      {/* Toggle button (when sidebar is closed on desktop) */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-20 z-30 hidden md:flex h-9 w-9 border shadow-sm bg-background"
          onClick={onToggle}
          title="展开侧边栏"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      )}
    </>
  )
}
