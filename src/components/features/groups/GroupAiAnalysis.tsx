'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Lightbulb, Target, Handshake, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface GroupAiAnalysisProps {
  groupId: string
  groupName: string
  disciplines?: string[]
  className?: string
}

interface AnalysisResult {
  summary?: string
  strengths?: string[]
  suggestions?: string[]
}

/**
 * AI 课题组分析卡片
 * 一键生成研究方向总结、优势领域、合作建议
 * 会自动抓取课题组的论文、专利、成员数据作为分析输入
 */
export function GroupAiAnalysis({
  groupId,
  groupName,
  disciplines = [],
  className,
}: GroupAiAnalysisProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    try {
      // 并行获取课题组的论文、专利、成员数据
      const [pubsRes, patsRes, membersRes] = await Promise.all([
        fetch(`/api/v1/groups/${groupId}/publications?pageSize=15`).catch(() => null),
        fetch(`/api/v1/groups/${groupId}/patents?pageSize=10`).catch(() => null),
        fetch(`/api/v1/groups/${groupId}/members`).catch(() => null),
      ])

      let publications: Array<Record<string, unknown>> = []
      let patents: Array<Record<string, unknown>> = []
      let members: Array<Record<string, unknown>> = []

      if (pubsRes?.ok) {
        const d = await pubsRes.json()
        if (d.success) publications = d.data || []
      }
      if (patsRes?.ok) {
        const d = await patsRes.json()
        if (d.success) patents = d.data || []
      }
      if (membersRes?.ok) {
        const d = await membersRes.json()
        if (d.success) members = d.data || []
      }

      // 构建数据摘要
      const pubSummary =
        publications.length > 0
          ? publications
              .slice(0, 10)
              .map((p, i) => {
                const title = (p.title as string) || '无标题'
                const year = p.year ? ` (${p.year})` : ''
                const authors = Array.isArray(p.authors) && p.authors.length > 0
                  ? ` — ${(p.authors as string[]).join(', ')}`
                  : ''
                const abstract = (p.abstract as string)?.slice(0, 120)
                const absStr = abstract ? `\n   摘要：${abstract}...` : ''
                return `${i + 1}. ${title}${year}${authors}${absStr}`
              })
              .join('\n')
          : '暂无论文数据'

      const patSummary =
        patents.length > 0
          ? patents
              .slice(0, 10)
              .map((p, i) => {
                const title = (p.title as string) || '无标题'
                const number = p.number ? ` (专利号: ${p.number})` : ''
                const status = p.status ? ` [${p.status}]` : ''
                return `${i + 1}. ${title}${number}${status}`
              })
              .join('\n')
          : '暂无专利数据'

      const memberNames = members
        .map((m: any) => {
          const name = m.user?.name || '未知'
          const role = m.role === 'LEADER' ? ' (负责人)' : m.role === 'ADVISOR' ? ' (导师)' : ''
          return `${name}${role}`
        })
        .join('、')

      const memberSummary = members.length > 0
        ? `课题组成员 (${members.length}人)：${memberNames}`
        : '暂无成员数据'

      const disciplineStr = disciplines.length > 0
        ? `学科领域：${disciplines.join('、')}`
        : ''

      const prompt = `请基于以下课题组的真实数据，分析其研究方向、优势领域和合作建议。

课题组名称：${groupName}
${disciplineStr}
${memberSummary}

【论文列表】（共${publications.length}篇）
${pubSummary}

【专利列表】（共${patents.length}项）
${patSummary}

请严格按照以下格式输出分析结果，不要输出思考过程：

## 研究方向总结
（100字以内，基于论文和专利的主题进行归纳总结）

## 优势领域
1. （第一条优势）
2. （第二条优势）
3. （第三条优势）
4. （可选第四条）
5. （可选第五条）

## 合作建议
1. （第一条建议）
2. （第二条建议）
3. （可选第三条）`

      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const data = await res.json()

      if (!data.success || !data.data?.content) {
        throw new Error(data.error?.message || '分析失败')
      }

      const content = data.data.content as string
      const parsed = parseAnalysis(content)
      setAnalysis(parsed)
    } catch (err) {
      console.error('AI analysis error:', err)
      setError(err instanceof Error ? err.message : '分析请求失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (!analysis && !error) {
    return (
      <Card className={cn('border-tea-primary/20', className)}>
        <CardContent className="p-6 text-center">
          <div className="h-12 w-12 rounded-xl bg-tea-primary/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6 text-tea-primary" />
          </div>
          <h3 className="font-medium mb-1">AI 智能分析</h3>
          <p className="text-xs text-muted-foreground mb-4">
            基于论文、专利和成员数据生成深度分析
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

  if (error) {
    return (
      <Card className={cn('border-red-200', className)}>
        <CardContent className="p-6 text-center">
          <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="font-medium mb-1 text-red-600">分析失败</h3>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={loading}
            className="border-red-200 hover:bg-red-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1.5" />
            )}
            {loading ? '分析中...' : '重新分析'}
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
        {analysis?.summary && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
              <Target className="h-3 w-3" />
              研究方向总结
            </h4>
            <p className="text-sm leading-relaxed">{analysis.summary}</p>
          </div>
        )}

        {analysis?.strengths && analysis.strengths.length > 0 && (
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

        {analysis?.suggestions && analysis.suggestions.length > 0 && (
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

/**
 * 解析 AI 返回的分析内容
 * 支持多种格式：Markdown ## 标题、数字列表、纯文本等
 */
function parseAnalysis(content: string): AnalysisResult {
  const result: AnalysisResult = {}

  // 1. 提取研究方向总结
  // 尝试匹配 ## 研究方向总结 或 ### 研究方向总结 等标题后的内容
  const summaryPatterns = [
    /#+\s*研究方向总结[\s\S]*?\n\s*([\s\S]*?)(?=\n\s*#+\s*优势领域|$)/i,
    /研究方向总结[：:]?\s*\n?\s*([\s\S]*?)(?=\n\s*(优势领域|##)|$)/i,
  ]
  for (const pattern of summaryPatterns) {
    const match = content.match(pattern)
    if (match) {
      const text = match[1].trim()
      if (text.length > 5) {
        result.summary = text.replace(/^\s*[-*]\s*/gm, '').trim()
        break
      }
    }
  }

  // 2. 提取优势领域
  const strengthsPatterns = [
    /#+\s*优势领域[\s\S]*?\n\s*([\s\S]*?)(?=\n\s*#+\s*合作建议|$)/i,
    /优势领域[：:]?\s*\n?\s*([\s\S]*?)(?=\n\s*(合作建议|##)|$)/i,
  ]
  for (const pattern of strengthsPatterns) {
    const match = content.match(pattern)
    if (match) {
      const items = extractListItems(match[1])
      if (items.length > 0) {
        result.strengths = items.slice(0, 5)
        break
      }
    }
  }

  // 3. 提取合作建议
  const suggestionsPatterns = [
    /#+\s*合作建议[\s\S]*?\n\s*([\s\S]*?)$/i,
    /合作建议[：:]?\s*\n?\s*([\s\S]*?)$/i,
  ]
  for (const pattern of suggestionsPatterns) {
    const match = content.match(pattern)
    if (match) {
      const items = extractListItems(match[1])
      if (items.length > 0) {
        result.suggestions = items.slice(0, 3)
        break
      }
    }
  }

  // Fallback: 如果以上都没匹配到，尝试从整个内容中提取数字列表作为优势领域
  if (!result.strengths || result.strengths.length === 0) {
    const allItems = extractListItems(content)
    if (allItems.length > 0 && !result.summary) {
      // 第一个可能是总结
      result.summary = allItems[0]
      result.strengths = allItems.slice(1, 6)
    } else if (allItems.length > 0) {
      result.strengths = allItems.slice(0, 5)
    }
  }

  return result
}

/**
 * 从文本中提取列表项
 * 支持：1. xxx、- xxx、* xxx 等格式
 */
function extractListItems(text: string): string[] {
  if (!text) return []

  const lines = text.split('\n')
  const items: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // 匹配数字列表：1. xxx、1) xxx、（1）xxx
    const numMatch = trimmed.match(/^\d+[\.\)、]\s*(.+)$/) ||
                      trimmed.match(/^\(\d+\)\s*(.+)$/) ||
                      trimmed.match(/^（\d+）\s*(.+)$/)
    if (numMatch) {
      const item = numMatch[1].trim()
      if (item.length > 3) items.push(item)
      continue
    }

    // 匹配符号列表：- xxx、* xxx
    const bulletMatch = trimmed.match(/^[-*+]\s*(.+)$/)
    if (bulletMatch) {
      const item = bulletMatch[1].trim()
      if (item.length > 3) items.push(item)
      continue
    }

    // 如果当前行不是列表格式，但上一行是，可能是多行列表项的续行
    if (items.length > 0 && trimmed.length > 3 && !trimmed.startsWith('#')) {
      items[items.length - 1] += ' ' + trimmed
    }
  }

  // 清理：去掉 thinking 过程标记
  return items
    .map((item) =>
      item
        .replace(/由于用户没有提供.*?的一般性知识来给出合理分析[。\s]*/i, '')
        .replace(/我应该[：:]?\s*/i, '')
        .replace(/保持专业、学术的语气[。\s]*/i, '')
        .replace(/我需要基于.*?知识[。\s]*/i, '')
        .replace(/- 保持专业.*?语气\s*/gi, '')
        .trim()
    )
    .filter((item) => item.length > 5 && !item.match(/^[-*]\s*$/))
}
