'use client'

import { ExternalLink, BookOpen } from 'lucide-react'

interface Citation {
  id: string
  title: string
  source?: string
}

interface CitationCardProps {
  citations: Citation[]
}

/**
 * RAG 引用来源展示卡片
 * 在 AI 回复底部展示知识库引用来源
 */
export function CitationCard({ citations }: CitationCardProps) {
  if (!citations || citations.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-tea-primary/10">
      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
        <BookOpen className="h-3 w-3" />
        参考来源
      </p>
      <div className="flex flex-wrap gap-2">
        {citations.map((citation) => (
          <a
            key={citation.id}
            href={`/api/v1/ai/knowledge?id=${citation.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-tea-primary/5 border border-tea-primary/10 px-2.5 py-1.5 text-xs text-tea-primary hover:bg-tea-primary/10 transition-colors"
          >
            <span className="truncate max-w-[200px]">{citation.title}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  )
}
