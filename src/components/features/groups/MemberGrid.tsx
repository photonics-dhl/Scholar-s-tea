'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'

interface Member {
  id: string
  user: {
    name: string | null
    avatar: string | null
  }
  role: 'LEADER' | 'ADVISOR' | 'MEMBER'
  joinedAt: string | Date
}

interface MemberGridProps {
  members: Member[]
  className?: string
}

const roleConfig = {
  LEADER: {
    label: '负责人',
    color: 'bg-journal-gold/15 text-journal-gold border-journal-gold/30',
    badgeColor: 'bg-journal-gold text-white',
  },
  ADVISOR: {
    label: '导师',
    color: 'bg-convo-blue/15 text-convo-blue border-convo-blue/30',
    badgeColor: 'bg-convo-blue text-white',
  },
  MEMBER: {
    label: '成员',
    color: 'bg-muted text-muted-foreground border-border',
    badgeColor: 'bg-muted-foreground text-background',
  },
}

/**
 * 成员网格组件
 * 展示课题组所有成员，按角色区分颜色
 */
export function MemberGrid({ members, className }: MemberGridProps) {
  if (members.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <p className="text-sm">暂无成员</p>
      </div>
    )
  }

  // Sort: LEADER first, then ADVISOR, then MEMBER
  const sorted = [...members].sort((a, b) => {
    const order = { LEADER: 0, ADVISOR: 1, MEMBER: 2 }
    return order[a.role] - order[b.role]
  })

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3', className)}>
      {sorted.map((member) => {
        const config = roleConfig[member.role]
        const initials = member.user.name?.slice(0, 2) || '?';

        return (
          <div
            key={member.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-sm',
              config.color
            )}
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              {member.user.avatar ? (
                <img src={member.user.avatar} alt={member.user.name || ''} />
              ) : null}
              <AvatarFallback className={cn('text-xs', config.badgeColor)}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {member.user.name || '匿名用户'}
              </p>
              <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5 mt-0.5', config.color)}>
                {config.label}
              </Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}
