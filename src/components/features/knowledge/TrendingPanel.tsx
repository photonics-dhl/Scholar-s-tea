'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Flame, Eye, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getDisciplineLabel } from '@/lib/knowledge/categories'
import { isNew, formatDate } from '@/lib/knowledge/utils'

interface TrendingDoc {
  id: string
  title: string
  discipline: string | null
  viewCount: number
  createdAt: string
}

export function TrendingPanel() {
  const [docs, setDocs] = useState<TrendingDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/knowledge?pageSize=5&sortBy=viewCount&sortOrder=desc')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setDocs(data.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Trending
          </h3>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (docs.length === 0) {
    return null
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Hot This Week
        </h3>
      </div>
      <div className="space-y-1">
        {docs.map((doc, idx) => (
          <Link
            key={doc.id}
            href={`/knowledge/${doc.id}`}
            className="flex items-start gap-2 px-2 py-2 rounded-lg text-xs hover:bg-muted/50 transition-colors group"
          >
            <span
              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                idx === 0
                  ? 'bg-orange-100 text-orange-700'
                  : idx === 1
                    ? 'bg-amber-100 text-amber-700'
                    : idx === 2
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-muted text-muted-foreground'
              }`}
            >
              {idx + 1}
            </span>
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
                  <span className="text-[10px] text-orange-600 font-medium">
                    New
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
