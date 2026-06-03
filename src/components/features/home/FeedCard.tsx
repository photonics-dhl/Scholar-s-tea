'use client'

import Link from 'next/link'
import { MessageSquare, FileText, Users, TrendingUp, Clock, Heart, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'

export type FeedItemType = 'post' | 'publication' | 'group' | 'activity'

export interface FeedItem {
  id: string
  type: FeedItemType
  title: string
  summary?: string
  author?: string
  authorAvatar?: string
  time: string
  href: string
  discipline?: string
  stats?: {
    likes?: number
    comments?: number
    citations?: number
    members?: number
  }
  meta?: string // e.g., journal name for papers
}

const typeConfig: Record<FeedItemType, { label: string; labelEn: string; icon: typeof MessageSquare; color: string }> = {
  post: { label: '讨论', labelEn: 'Post', icon: MessageSquare, color: 'bg-journal-gold/10 text-journal-gold border-journal-gold/20' },
  publication: { label: '论文', labelEn: 'Paper', icon: FileText, color: 'bg-journal-primary/10 text-journal-primary border-journal-primary/20' },
  group: { label: '课题组', labelEn: 'Group', icon: Users, color: 'bg-tea-primary/10 text-tea-primary border-tea-primary/20' },
  activity: { label: '动态', labelEn: 'Activity', icon: TrendingUp, color: 'bg-tea-accent/10 text-tea-accent border-tea-accent/20' },
}

interface FeedCardProps {
  item: FeedItem
  lang: 'zh' | 'en'
}

export function FeedCard({ item, lang }: FeedCardProps) {
  const config = typeConfig[item.type]
  const TypeIcon = config.icon

  const authorInitials = item.author
    ? item.author.slice(0, 2).toUpperCase()
    : '?'

  return (
    <Link
      href={item.href}
      className="group block rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-primary/20"
    >
      {/* Header: type badge + discipline + time */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <Badge variant="outline" className={cn('text-[11px] px-2 py-0.5 font-normal', config.color)}>
          <TypeIcon className="h-3 w-3 mr-1" />
          {lang === 'zh' ? config.label : config.labelEn}
        </Badge>
        {item.discipline && (
          <Badge variant="secondary" className="text-[11px] px-2 py-0.5 font-normal">
            {item.discipline}
          </Badge>
        )}
        <span className="text-[11px] text-muted-foreground ml-auto flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {item.time}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-medium text-[15px] leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
        {item.title}
      </h3>

      {/* Summary */}
      {item.summary && (
        <p className="text-[13px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {item.summary}
        </p>
      )}

      {/* Meta for publications */}
      {item.meta && (
        <p className="text-[11px] text-muted-foreground mb-3">
          {item.meta}
        </p>
      )}

      {/* Footer: author + stats */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[9px] bg-muted">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{item.author || 'Anonymous'}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {item.stats?.likes !== undefined && item.stats.likes > 0 && (
            <span className="flex items-center gap-0.5">
              <Heart className="h-3 w-3" />
              {item.stats.likes}
            </span>
          )}
          {item.stats?.comments !== undefined && item.stats.comments > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageCircle className="h-3 w-3" />
              {item.stats.comments}
            </span>
          )}
          {item.stats?.citations !== undefined && item.stats.citations > 0 && (
            <span className="flex items-center gap-0.5 text-journal-primary">
              <FileText className="h-3 w-3" />
              {item.stats.citations}
            </span>
          )}
          {item.stats?.members !== undefined && item.stats.members > 0 && (
            <span className="flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {item.stats.members}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
