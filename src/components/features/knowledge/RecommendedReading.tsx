'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Sparkles, Eye } from 'lucide-react'
import { getDisciplineLabel } from '@/lib/knowledge/categories'
import { isNew, formatDate } from '@/lib/knowledge/utils'

interface KnowledgeDoc {
  id: string
  title: string
  discipline: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  viewCount: number
}

interface RecommendedReadingProps {
  documents: KnowledgeDoc[]
  visitedIds: Set<string>
}

export function RecommendedReading({ documents, visitedIds }: RecommendedReadingProps) {
  const recommendations = useMemo(() => {
    if (documents.length === 0) return []

    // Collect user interests from visited docs
    const disciplineInterest: Record<string, number> = {}
    const tagInterest: Record<string, number> = {}
    let visitedCount = 0

    for (const doc of documents) {
      if (!visitedIds.has(doc.id)) continue
      visitedCount++
      if (doc.discipline) {
        disciplineInterest[doc.discipline] = (disciplineInterest[doc.discipline] || 0) + 1
      }
      const tags = (doc.metadata?.tags as string[]) || []
      for (const tag of tags) {
        tagInterest[tag] = (tagInterest[tag] || 0) + 1
      }
    }

    // If no reading history, recommend newest docs
    if (visitedCount === 0) {
      return documents
        .filter((d) => !visitedIds.has(d.id))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 5)
    }

    // Score unvisited docs by similarity to user interests
    const scored = documents
      .filter((d) => !visitedIds.has(d.id))
      .map((doc) => {
        let score = 0
        if (doc.discipline && disciplineInterest[doc.discipline]) {
          score += disciplineInterest[doc.discipline] * 3
        }
        const tags = (doc.metadata?.tags as string[]) || []
        for (const tag of tags) {
          if (tagInterest[tag]) {
            score += tagInterest[tag] * 2
          }
        }
        // Boost new docs slightly
        if (isNew(doc.createdAt)) score += 1
        return { doc, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    return scored.map((s) => s.doc)
  }, [documents, visitedIds])

  if (recommendations.length === 0) return null

  const hasHistory = visitedIds.size > 0

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Sparkles className="h-3.5 w-3.5 text-journal-gold" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {hasHistory ? 'Recommended For You' : 'New This Week'}
        </h3>
      </div>
      <div className="space-y-1">
        {recommendations.map((doc) => (
          <Link
            key={doc.id}
            href={`/knowledge/${doc.id}`}
            className="flex items-start gap-2 px-2 py-2 rounded-lg text-xs hover:bg-muted/50 transition-colors group"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground line-clamp-2 group-hover:text-journal-primary transition-colors leading-tight">
                {doc.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {doc.discipline && (
                  <span className="text-[10px] text-muted-foreground/70">
                    {getDisciplineLabel(doc.discipline)}
                  </span>
                )}
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
                  <Eye className="h-2.5 w-2.5" />
                  {doc.viewCount}
                </span>
                {isNew(doc.createdAt) && (
                  <span className="text-[10px] text-orange-600 font-medium">New</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
