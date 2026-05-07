'use client'

import { FileText, Award, Newspaper, UserPlus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TimelineEvent {
  id: string
  type: 'publication' | 'patent' | 'news' | 'member'
  title: string
  description?: string
  date: string
}

const eventConfig: Record<
  TimelineEvent['type'],
  { icon: LucideIcon; color: string; bg: string; label: string }
> = {
  publication: {
    icon: FileText,
    color: 'text-journal-primary',
    bg: 'bg-journal-primary/10',
    label: '发表论文',
  },
  patent: {
    icon: Award,
    color: 'text-journal-gold',
    bg: 'bg-journal-gold/10',
    label: '申请专利',
  },
  news: {
    icon: Newspaper,
    color: 'text-convo-blue',
    bg: 'bg-convo-blue/10',
    label: '发布动态',
  },
  member: {
    icon: UserPlus,
    color: 'text-tea-primary',
    bg: 'bg-tea-primary/10',
    label: '新成员',
  },
}

interface ActivityTimelineProps {
  events: TimelineEvent[]
  className?: string
}

/**
 * 课题组活动时间线
 * 展示论文、专利、动态、成员加入等事件
 */
export function ActivityTimeline({ events, className }: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <p className="text-sm">暂无活动记录</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-0', className)}>
      {events.map((event, index) => {
        const config = eventConfig[event.type]
        const Icon = config.icon
        const isLast = index === events.length - 1

        return (
          <div key={event.id} className="flex gap-4 group">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 border-background shadow-sm',
                  config.bg
                )}
              >
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-border mt-1 group-hover:bg-border/80 transition-colors" />
              )}
            </div>

            {/* Content */}
            <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-medium',
                    config.bg,
                    config.color
                  )}
                >
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground">{event.date}</span>
              </div>
              <h4 className="text-sm font-medium group-hover:text-journal-primary transition-colors">
                {event.title}
              </h4>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
