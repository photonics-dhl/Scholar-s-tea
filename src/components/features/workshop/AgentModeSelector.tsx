'use client'

import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils/cn'
import {
  getAllAgentModes,
  getAgentMode,
  type AgentMode,
} from '@/lib/ai/agent-modes'

interface AgentModeSelectorProps {
  currentMode: AgentMode
  onChange: (mode: AgentMode) => void
  className?: string
}

/**
 * Agent 模式选择器
 * 下拉菜单切换不同的 AI 助手模式
 */
export function AgentModeSelector({
  currentMode,
  onChange,
  className,
}: AgentModeSelectorProps) {
  const modes = getAllAgentModes()
  const activeMode = getAgentMode(currentMode)
  const ActiveIcon = activeMode.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'flex items-center gap-2 h-9 px-3 text-sm font-medium',
            activeMode.bgColor,
            activeMode.color,
            className
          )}
        >
          <ActiveIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{activeMode.label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {modes.map((mode) => {
          const ModeIcon = mode.icon
          const isActive = mode.id === currentMode
          return (
            <DropdownMenuItem
              key={mode.id}
              onClick={() => onChange(mode.id)}
              className={cn(
                'flex items-start gap-3 py-2.5 cursor-pointer',
                isActive && mode.bgColor
              )}
            >
              <ModeIcon className={cn('h-4 w-4 mt-0.5', mode.color)} />
              <div className="flex-1">
                <p className={cn('text-sm font-medium', isActive && mode.color)}>
                  {mode.label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {mode.description}
                </p>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
