'use client';

import Image from 'next/image';
import { Building2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils/cn';
import type { GroupWithRelations } from '@/types';

interface GroupHeaderProps {
  group: GroupWithRelations;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  className?: string;
}

const statusConfig = {
  PENDING: {
    label: '待验证',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500',
  },
  VERIFIED: {
    label: '已认证',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500',
  },
  REJECTED: {
    label: '已拒绝',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500',
  },
};

export function GroupHeader({
  group,
  isFollowing = false,
  onFollowToggle,
  className,
}: GroupHeaderProps) {
  const status = statusConfig[group.verificationStatus] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <div className={cn('relative', className)}>
      {/* Banner */}
      <div
        className="h-48 w-full bg-cover bg-center"
        style={{
          backgroundImage: group.banner
            ? `url(${group.banner})`
            : 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--primary) / 0.05) 100%)',
        }}
      />

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative -mt-16 flex items-end justify-between">
          {/* Logo & Basic Info */}
          <div className="flex items-end gap-4">
            {/* Logo */}
            <div className="flex h-32 w-32 items-center justify-center rounded-xl border-4 border-background bg-background shadow-lg">
              {group.logo ? (
                <Image
                  src={group.logo}
                  alt={group.name}
                  width={128}
                  height={128}
                  className="rounded-xl object-cover"
                />
              ) : (
                <Building2 className="h-16 w-16 text-muted-foreground" />
              )}
            </div>

            {/* Name & Institution */}
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{group.name}</h1>
                <Badge variant="outline" className={status.className}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
              <p className="mt-1 flex items-center text-muted-foreground">
                {group.institution?.logo && (
                  <Image
                    src={group.institution.logo}
                    alt=""
                    width={16}
                    height={16}
                    className="mr-1.5"
                  />
                )}
                {group.institution?.name}
                {group.college && ` · ${group.college.name}`}
                {group.department && ` · ${group.department.name}`}
              </p>
            </div>
          </div>

          {/* Follow Button */}
          {onFollowToggle && (
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              onClick={onFollowToggle}
              className="mb-2"
            >
              {isFollowing ? '取消关注' : '关注'}
            </Button>
          )}
        </div>

        {/* Description */}
        {group.description && (
          <p className="mt-4 max-w-3xl text-muted-foreground">{group.description}</p>
        )}

        {/* Disciplines Tags */}
        {group.disciplines?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {group.disciplines.map(({ discipline }) => (
              <Badge key={discipline.id} variant="secondary">
                {discipline.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats Bar */}
        <div className="mt-6 flex items-center gap-6 border-t pt-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{group._count.members}</p>
            <p className="text-xs text-muted-foreground">成员</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{group._count.publications}</p>
            <p className="text-xs text-muted-foreground">论文</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{group._count.news}</p>
            <p className="text-xs text-muted-foreground">动态</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{group._count.patents}</p>
            <p className="text-xs text-muted-foreground">专利</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{group.score}</p>
            <p className="text-xs text-muted-foreground">评分</p>
          </div>
        </div>
      </div>
    </div>
  );
}
