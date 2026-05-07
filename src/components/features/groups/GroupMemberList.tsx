'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import type { GroupMemberWithUser } from '@/types';

interface GroupMemberListProps {
  members: GroupMemberWithUser[];
  className?: string;
}

const roleConfig = {
  LEADER: {
    label: '负责人',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  ADVISOR: {
    label: '顾问',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500',
  },
  MEMBER: {
    label: '成员',
    className: 'bg-muted text-muted-foreground',
  },
};

export function GroupMemberList({ members, className }: GroupMemberListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {members.map((member) => {
        const config = roleConfig[member.role];
        return (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.user.avatar || undefined} />
                <AvatarFallback>
                  {member.user.name?.[0] || member.user.email[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.user.name || '未命名用户'}</p>
                <p className="text-sm text-muted-foreground">{member.user.email}</p>
              </div>
            </div>
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
