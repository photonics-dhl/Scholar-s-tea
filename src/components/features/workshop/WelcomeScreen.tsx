'use client'

import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AgentModeConfig } from '@/lib/ai/agent-modes'

interface WelcomeScreenProps {
  mode: AgentModeConfig
  onQuickPrompt: (text: string) => void
}

/**
 * Agent 模式专属欢迎界面
 * 展示模式介绍、能力特点和快捷提示模板
 */
export function WelcomeScreen({ mode, onQuickPrompt }: WelcomeScreenProps) {
  const ModeIcon = mode.icon

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-10">
      {/* Mode Icon with pulse */}
      <div
        className={`relative size-16 rounded-2xl ${mode.bgColor} flex items-center justify-center mb-5`}
      >
        <ModeIcon className={`size-8 ${mode.color}`} />
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${mode.bgColor.replace('/10', '')} opacity-75`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${mode.bgColor.replace('/10', '')}`}
            />
          </span>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold mb-1.5">{mode.welcome.title}</h2>
      <p className="text-muted-foreground max-w-sm mb-6">
        {mode.welcome.subtitle}
      </p>

      {/* Features */}
      <div className="grid gap-2 w-full max-w-md mb-8">
        {mode.welcome.features.map((feature, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/50 text-sm text-muted-foreground"
          >
            <Sparkles className={`h-4 w-4 flex-shrink-0 ${mode.color}`} />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      {/* Quick Prompts */}
      <div className="w-full max-w-lg space-y-2.5">
        <p className="text-xs text-muted-foreground mb-2">试试这些：</p>
        {mode.quickPrompts.map((prompt, i) => {
          const PromptIcon = prompt.icon
          return (
            <Button
              key={i}
              variant="outline"
              className={`justify-start h-auto py-3 px-4 text-left w-full ${mode.borderColor} hover:${mode.bgColor} transition-all duration-200`}
              onClick={() => onQuickPrompt(prompt.text)}
            >
              <PromptIcon
                className={`h-4 w-4 mr-3 flex-shrink-0 ${mode.color}`}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block">{prompt.label}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {prompt.text}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </Button>
          )
        })}
      </div>
    </div>
  )
}
