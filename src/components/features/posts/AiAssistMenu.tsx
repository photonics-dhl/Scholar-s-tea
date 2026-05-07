'use client'

import { useState } from 'react'
import { Sparkles, Wand2, SpellCheck, Tags, AlignLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AiAssistMenuProps {
  onAssist: (type: string, text: string) => Promise<string>
  onResult?: (type: string, result: string) => void
  selectedText?: string
}

/**
 * AI 辅助写作菜单
 * 提供改进表达、检查语法、生成摘要、添加标签等功能
 */
export function AiAssistMenu({ onAssist, onResult, selectedText }: AiAssistMenuProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (type: string, label: string) => {
    if (!selectedText || loading) return
    setLoading(label)
    try {
      const result = await onAssist(type, selectedText)
      if (result && onResult) {
        onResult(type, result)
      }
    } finally {
      setLoading(null)
    }
  }

  const items = [
    { type: 'improve', label: '改进表达', icon: Wand2 },
    { type: 'grammar', label: '检查语法', icon: SpellCheck },
    { type: 'summary', label: '生成摘要', icon: AlignLeft },
    { type: 'tags', label: '推荐标签', icon: Tags },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-tea-primary hover:text-tea-primary hover:bg-tea-primary/10"
          disabled={!selectedText || !!loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span className="text-xs">
            {loading ? '处理中...' : 'AI 优化'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem
              key={item.type}
              onClick={() => handleAction(item.type, item.label)}
              disabled={!!loading}
              className="gap-2 cursor-pointer"
            >
              <Icon className="h-4 w-4 text-tea-primary" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
