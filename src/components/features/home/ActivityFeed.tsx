'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, MessageSquare, FileText, Users, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'

interface FeedItem {
  id: string
  type: 'post' | 'publication' | 'group' | 'tea-party'
  title: string
  summary?: string
  author?: string
  source?: string
  stats?: { label: string; value: number }
  time: string
  href: string
}

interface ActivityFeedProps {
  title: string
  icon: React.ReactNode
  items: FeedItem[]
  color: string
  delay?: number
}

/**
 * 学术动态信息流卡片组
 * 横向滚动展示最新内容，借鉴小红书信息流密度
 */
export function ActivityFeed({ title, icon, items, color, delay = 0 }: ActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -320 : 320
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }

  const typeConfig = {
    post: { icon: MessageSquare, label: '帖子', color: 'bg-journal-gold/10 text-journal-gold' },
    publication: { icon: FileText, label: '论文', color: 'bg-journal-primary/10 text-journal-primary' },
    group: { icon: Users, label: '课题组', color: 'bg-tea-primary/10 text-tea-primary' },
    'tea-party': { icon: Coffee, label: '茶话会', color: 'bg-tea-accent/10 text-tea-accent' },
  }

  return (
    <section
      className="animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => {
          const config = typeConfig[item.type]
          const TypeIcon = config.icon
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'group flex-shrink-0 w-72 snap-start rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                color
              )}
            >
              {/* Type badge */}
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="secondary"
                  className={cn('text-[10px] px-2 py-0.5', config.color)}
                >
                  <TypeIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {item.time}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-tea-primary transition-colors">
                {item.title}
              </h3>

              {/* Summary */}
              {item.summary && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {item.summary}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  {item.author && (
                    <span className="text-xs text-muted-foreground">
                      {item.author}
                    </span>
                  )}
                  {item.source && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {item.source}
                    </span>
                  )}
                </div>
                {item.stats && (
                  <span className="text-xs font-medium text-tea-primary">
                    {item.stats.value} {item.stats.label}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
