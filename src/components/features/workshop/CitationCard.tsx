'use client'

import { useState } from 'react'
import { ExternalLink, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Citation {
  id: string
  title: string
  source?: string
  discipline?: string | null
  similarity: number
}

interface CitationCardProps {
  citations: Citation[]
}

const DISCIPLINE_COLORS: Record<string, string> = {
  ai: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  optics: 'bg-sky-100 text-sky-700 border-sky-200',
  photonics: 'bg-violet-100 text-violet-700 border-violet-200',
  physics: 'bg-amber-100 text-amber-700 border-amber-200',
  materials: 'bg-rose-100 text-rose-700 border-rose-200',
  'social sciences': 'bg-teal-100 text-teal-700 border-teal-200',
}

function getDisciplineClass(discipline?: string | null): string {
  if (!discipline) return 'bg-muted text-muted-foreground border-border'
  const key = discipline.toLowerCase()
  return DISCIPLINE_COLORS[key] || 'bg-journal-primary/10 text-journal-primary border-journal-primary/20'
}

function SimilarityBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  let color = 'bg-rose-400'
  if (score >= 0.8) color = 'bg-emerald-500'
  else if (score >= 0.65) color = 'bg-amber-400'
  else if (score >= 0.5) color = 'bg-sky-400'

  return (
    <div className="flex items-center gap-1.5" title={`Relevance: ${pct}%`}>
      <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  )
}

/**
 * RAG citation source cards
 * Shows knowledge base sources with discipline badge, relevance score, and link.
 */
export function CitationCard({ citations }: CitationCardProps) {
  const [expanded, setExpanded] = useState((citations?.length || 0) <= 3)

  if (!citations || citations.length === 0) return null

  const visible = expanded ? citations : citations.slice(0, 3)
  const hasMore = citations.length > 3

  return (
    <div className="mt-4 pt-3 border-t border-journal-primary/10">
      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
        <BookOpen className="h-3 w-3" />
        Knowledge Base Sources ({citations.length})
      </p>

      <div className="flex flex-col gap-2">
        {visible.map((c) => (
          <a
            key={c.id}
            href={`/knowledge/${c.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2.5 rounded-lg bg-journal-primary/[0.03] border border-journal-primary/10 px-3 py-2 hover:bg-journal-primary/[0.06] hover:border-journal-primary/20 transition-colors"
          >
            <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0 text-journal-primary/60 group-hover:text-journal-primary transition-colors" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate group-hover:text-journal-primary transition-colors">
                {c.title}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {c.discipline && (
                  <span
                    className={cn(
                      'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border',
                      getDisciplineClass(c.discipline)
                    )}
                  >
                    {c.discipline}
                  </span>
                )}
                {c.source && (
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {c.source}
                  </span>
                )}
                <SimilarityBar score={c.similarity} />
              </div>
            </div>
          </a>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-xs text-journal-primary hover:text-journal-primary/80 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show {citations.length - 3} more
            </>
          )}
        </button>
      )}
    </div>
  )
}
