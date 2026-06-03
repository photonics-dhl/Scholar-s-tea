'use client'

import { useMemo } from 'react'
import { Tag, X } from 'lucide-react'

interface KnowledgeDoc {
  id: string
  title: string
  metadata: Record<string, unknown> | null
}

interface TagCloudProps {
  documents: KnowledgeDoc[]
  activeTag: string | null
  onTagClick: (tag: string | null) => void
}

export function TagCloud({ documents, activeTag, onTagClick }: TagCloudProps) {
  const tagStats = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const doc of documents) {
      const tags = (doc.metadata?.tags as string[]) || []
      for (const t of tags) {
        counts[t] = (counts[t] || 0) + 1
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
  }, [documents])

  if (tagStats.length === 0) return null

  const maxCount = tagStats[0]?.[1] || 1

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-teal-500" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Popular Tags
          </h3>
        </div>
        {activeTag && (
          <button
            onClick={() => onTagClick(null)}
            className="text-[10px] text-muted-foreground hover:text-journal-primary flex items-center gap-0.5 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tagStats.map(([tag, count]) => {
          const isActive = activeTag === tag
          const intensity = Math.max(0.3, count / maxCount)
          return (
            <button
              key={tag}
              onClick={() => onTagClick(isActive ? null : tag)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150 border ${
                isActive
                  ? 'bg-journal-primary text-white border-journal-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-journal-border/40 hover:border-journal-primary/40 hover:text-foreground'
              }`}
              title={`${count} document${count > 1 ? 's' : ''}`}
            >
              {tag}
              {!isActive && (
                <span className="ml-1 text-[10px] opacity-60">{count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
