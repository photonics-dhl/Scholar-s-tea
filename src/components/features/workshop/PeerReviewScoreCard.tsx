'use client'

import { useState } from 'react'
import { Star, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info, Gavel } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { PeerReviewResult, PeerReviewDimension } from '@/lib/ai/peer-review-prompts'

interface PeerReviewScoreCardProps {
  data: PeerReviewResult
}

const DIMENSION_LABELS: Record<PeerReviewDimension, { label: string; color: string; bg: string }> = {
  novelty: { label: '原创性', color: 'text-emerald-600', bg: 'bg-emerald-500' },
  methodology: { label: '方法论', color: 'text-blue-600', bg: 'bg-blue-500' },
  soundness: { label: '可靠性', color: 'text-violet-600', bg: 'bg-violet-500' },
  writing: { label: '写作质量', color: 'text-amber-600', bg: 'bg-amber-500' },
  references: { label: '引用规范', color: 'text-cyan-600', bg: 'bg-cyan-500' },
  reproducibility: { label: '可复现性', color: 'text-rose-600', bg: 'bg-rose-500' },
  impact: { label: '影响力', color: 'text-indigo-600', bg: 'bg-indigo-500' },
}

const VERDICT_CONFIG = {
  accept: { label: 'Accept', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2 },
  minor_revision: { label: 'Minor Revision', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Info },
  major_revision: { label: 'Major Revision', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertTriangle },
  reject: { label: 'Reject', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
}

function ScoreBar({ score, maxScore = 10, colorClass }: { score: number; maxScore?: number; colorClass: string }) {
  const pct = (score / maxScore) * 100
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold w-8 text-right tabular-nums">{score}</span>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const config =
    priority === 'P0'
      ? { label: 'P0 必须', className: 'bg-red-50 text-red-700 border-red-200' }
      : priority === 'P1'
        ? { label: 'P1 强烈建议', className: 'bg-amber-50 text-amber-700 border-amber-200' }
        : { label: 'P2 可选', className: 'bg-slate-50 text-slate-600 border-slate-200' }

  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', config.className)}>
      {config.label}
    </span>
  )
}

export function PeerReviewScoreCard({ data }: PeerReviewScoreCardProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)

  const verdict = VERDICT_CONFIG[data.verdict] || VERDICT_CONFIG.minor_revision
  const VerdictIcon = verdict.icon

  const overallScore =
    Object.values(data.scores).reduce((sum, s) => sum + s.score, 0) /
    Object.values(data.scores).length

  const dimensions = Object.entries(data.scores) as [PeerReviewDimension, { score: number; comment: string }][]

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-4 mt-3">
      {/* Overall Verdict Card */}
      <div className={cn('rounded-xl border p-4', verdict.bg, verdict.border)}>
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg bg-white/70', verdict.color)}>
            <VerdictIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-bold', verdict.color)}>{verdict.label}</span>
              <span className="text-xs text-muted-foreground">· 综合评分</span>
              <span className="text-sm font-bold tabular-nums">{overallScore.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">/ 10</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{data.summary}</p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="rounded-xl border border-border/60 bg-white p-4 shadow-sm">
        <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Gavel className="h-3.5 w-3.5 text-convo-blue" />
          各维度评分
        </h4>
        <div className="space-y-3">
          {dimensions.map(([key, { score, comment }]) => {
            const cfg = DIMENSION_LABELS[key]
            const isOpen = expanded[key]
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs font-medium w-16', cfg.color)}>{cfg.label}</span>
                  <ScoreBar score={score} colorClass={cfg.bg} />
                </div>
                {comment && (
                  <button
                    onClick={() => toggleExpand(key)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors ml-[5.5rem]"
                  >
                    {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {isOpen ? '收起评语' : '查看评语'}
                  </button>
                )}
                {isOpen && comment && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed ml-[5.5rem] bg-muted/40 rounded-lg px-3 py-2">
                    {comment}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Suggestions */}
      {data.suggestions && data.suggestions.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-white p-4 shadow-sm">
          <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            修改建议 ({data.suggestions.length} 条)
          </h4>
          <div className="space-y-2.5">
            {data.suggestions
              .slice(0, showAllSuggestions ? undefined : 5)
              .map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[11px] text-muted-foreground mt-0.5 tabular-nums w-4">
                    {i + 1}.
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PriorityBadge priority={s.priority} />
                      {s.location && (
                        <span className="text-[10px] text-muted-foreground">{s.location}</span>
                      )}
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{s.description}</p>
                  </div>
                </div>
              ))}
          </div>
          {data.suggestions.length > 5 && (
            <button
              onClick={() => setShowAllSuggestions(!showAllSuggestions)}
              className="mt-3 text-[11px] text-convo-blue hover:underline flex items-center gap-1"
            >
              {showAllSuggestions ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  查看全部 {data.suggestions.length} 条建议
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
