'use client'

import { useState } from 'react'
import { Gavel, Send, Loader2, BookOpen, Lightbulb, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'

interface PeerReviewPanelProps {
  onSend: (content: string, options?: { action?: string; focus?: string }) => void
  loading: boolean
}

const FOCUS_OPTIONS = [
  { id: 'full', label: '全面评审', icon: Gavel },
  { id: 'methodology', label: '方法评审', icon: BookOpen },
  { id: 'writing', label: '写作评审', icon: FileText },
  { id: 'suggestions', label: '改进建议', icon: Lightbulb },
]

export function PeerReviewPanel({ onSend, loading }: PeerReviewPanelProps) {
  const [content, setContent] = useState('')
  const [focus, setFocus] = useState('full')

  const handleSubmit = () => {
    if (!content.trim() || loading) return

    const focusMap: Record<string, string> = {
      full: '请对这篇论文进行全面的同行评审',
      methodology: '请重点评审研究方法部分，包括实验设计、数据分析、对照组设置',
      writing: '请重点评审写作质量，包括结构、逻辑、语言表达',
      suggestions: '请给出具体的修改建议，帮助提升论文质量',
    }

    onSend(content, {
      action: 'peer_review',
      focus: focusMap[focus] || focusMap.full,
    })
    setContent('')
  }

  return (
    <div className="space-y-4">
      {/* Focus selector */}
      <div className="flex flex-wrap gap-2">
        {FOCUS_OPTIONS.map((option) => {
          const Icon = option.icon
          const isActive = focus === option.id
          return (
            <Button
              key={option.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFocus(option.id)}
              className={cn(
                'gap-1.5',
                isActive && 'bg-red-500 hover:bg-red-600 text-white'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
            </Button>
          )
        })}
      </div>

      {/* Input area */}
      <Card className="border-red-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gavel className="h-4 w-4 text-red-500" />
            粘贴论文内容
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请粘贴论文的标题、摘要、引言、方法、结果等部分的内容。支持分段粘贴，AI 将综合评审。"
            className="min-h-[200px] resize-y"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {content.length} 字符
              </Badge>
              {content.length > 12000 && (
                <Badge variant="destructive" className="text-xs">
                  超过 12000 字符将截断
                </Badge>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
              className="gap-2 bg-red-500 hover:bg-red-600"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? '评审中...' : '开始评审'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">💡 使用提示</p>
        <p>• 粘贴论文内容越完整，评审结果越准确</p>
        <p>• 支持分段多次粘贴，AI 会综合所有内容</p>
        <p>• 可选择不同的评审侧重点</p>
      </div>
    </div>
  )
}
