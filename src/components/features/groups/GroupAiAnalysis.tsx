'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Lightbulb, Target, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface GroupAiAnalysisProps {
  groupId: string
  groupName: string
  disciplines?: string[]
  className?: string
}

/**
 * AI 课题组分析卡片
 * 一键生成研究方向总结、优势领域、合作建议
 */
export function GroupAiAnalysis({
  groupId,
  groupName,
  disciplines = [],
  className,
}: GroupAiAnalysisProps) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<{
    summary?: string
    strengths?: string[]
    suggestions?: string[]
  } | null>(null)

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `请分析课题组「${groupName}」的研究方向、优势领域和合作建议。${disciplines.length > 0 ? `该课题组涉及的学科领域包括：${disciplines.join('、')}。` : ''}请从以下几个方面给出分析：\n1. 研究方向总结（100字以内）\n2. 优势领域（3-5条）\n3. 潜在合作建议（2-3条）`,
            },
          ],
        }),
      })

      const data = await res.json()
      if (data.success && data.data?.content) {
        const content = data.data.content
        // Simple parsing
        const summary = content.match(/研究方向总结[：:]?\s*([\s\S]*?)(?=优势领域|$)/i)?.[1]?.trim()
        const strengths = content
          .match(/优势领域[：:]?\s*([\s\S]*?)(?=合作建议|$)/i)?.[1]
          ?.split(/\n|；/)
          .map((s: string) => s.replace(/^\d+[\.)、]\s*/, '').trim())
          .filter((s: string) => s.length > 5)
          .slice(0, 5)
        const suggestions = content
          .match(/合作建议[：:]?\s*([\s\S]*?)$/i)?.[1]
          ?.split(/\n|；/)
          .map((s: string) => s.replace(/^\d+[\.)、]\s*/, '').trim())
          .filter((s: string) => s.length > 5)
          .slice(0, 3)

        setAnalysis({ summary, strengths, suggestions })
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  if (!analysis) {
    return (
      <Card className={cn('border-tea-primary/20', className)}>
        <CardContent className="p-6 text-center">
          <div className="h-12 w-12 rounded-xl bg-tea-primary/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6 text-tea-primary" />
          </div>
          <h3 className="font-medium mb-1">AI 智能分析</h3>
          <p className="text-xs text-muted-foreground mb-4">
            一键生成课题组研究方向总结、优势领域和合作建议
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={loading}
            className="border-tea-primary/30 hover:bg-tea-primary/5"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1.5" />
            )}
            {loading ? '分析中...' : '开始分析'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-tea-primary/20', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-tea-primary" />
          AI 智能分析
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {analysis.summary && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
              <Target className="h-3 w-3" />
              研究方向总结
            </h4>
            <p className="text-sm leading-relaxed">{analysis.summary}</p>
          </div>
        )}

        {analysis.strengths && analysis.strengths.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              优势领域
            </h4>
            <ul className="space-y-1.5">
              {analysis.strengths.map((strength, i) => (
                <li
                  key={i}
                  className="text-sm flex items-start gap-2"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-journal-gold/15 text-journal-gold text-[10px] flex items-center justify-center font-medium mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.suggestions && analysis.suggestions.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
              <Handshake className="h-3 w-3" />
              合作建议
            </h4>
            <ul className="space-y-1.5">
              {analysis.suggestions.map((suggestion, i) => (
                <li
                  key={i}
                  className="text-sm flex items-start gap-2"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-tea-primary/15 text-tea-primary text-[10px] flex items-center justify-center font-medium mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full text-xs"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          重新分析
        </Button>
      </CardContent>
    </Card>
  )
}
