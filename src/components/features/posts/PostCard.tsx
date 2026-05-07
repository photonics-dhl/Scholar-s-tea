'use client'

import Link from 'next/link'
import {
  MessageSquare,
  Eye,
  ArrowUp,
  Clock,
  Pin,
  Lock,
  Flame,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface PostCardProps {
  post: {
    id: string
    title: string
    content?: string
    author: {
      name: string | null
      avatar?: string | null
    }
    isPinned?: boolean
    isLocked?: boolean
    viewCount: number
    score: number
    createdAt: string
    _count?: {
      comments: number
    }
    tags?: Array<{ tag: { name: string } }>
  }
  href: string
  className?: string
  /** 是否允许在列表页投票（需要额外 API 支持） */
  onVote?: (postId: string, value: 1 | -1) => void
  voting?: boolean
}

/**
 * 帖子卡片组件 v2
 * 参考 GitHub Issues + Reddit 的混合风格
 * 左侧投票区 + 右侧内容区，信息层级清晰
 */
export function PostCard({ post, href, className, onVote, voting }: PostCardProps) {
  const initials = post.author.name?.slice(0, 2) || '匿名'
  const isHot = post.score >= 10 || (post._count?.comments || 0) >= 5

  return (
    <div
      className={cn(
        'group flex gap-0 rounded-xl border bg-card overflow-hidden transition-all duration-200',
        'hover:shadow-md hover:border-tea-primary/25',
        isHot && 'border-l-4 border-l-tea-accent',
        className
      )}
    >
      {/* 左侧投票区 - 弱化设计 */}
      <div className="flex flex-col items-center gap-0 px-2 py-3 min-w-[44px]">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded hover:bg-transparent hover:text-tea-primary/70 text-gray-300"
          disabled={voting}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onVote?.(post.id, 1)
          }}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <span
          className={cn(
            'text-xs font-medium tabular-nums leading-tight text-muted-foreground/70',
          )}
        >
          {post.score}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded hover:bg-transparent hover:text-destructive/60 text-gray-300 rotate-180"
          disabled={voting}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onVote?.(post.id, -1)
          }}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* 右侧内容区 */}
      <Link href={href} className="flex-1 min-w-0 block p-4">
        {/* 顶部标签行 */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {post.isPinned && (
            <Badge variant="default" className="text-[10px] h-5 bg-tea-accent hover:bg-tea-accent">
              <Pin className="h-2.5 w-2.5 mr-1" />
              置顶
            </Badge>
          )}
          {post.isLocked && (
            <Badge variant="secondary" className="text-[10px] h-5">
              <Lock className="h-2.5 w-2.5 mr-1" />
              锁定
            </Badge>
          )}
          {isHot && !post.isPinned && (
            <Badge variant="outline" className="text-[10px] h-5 border-orange-300 text-orange-600">
              <Flame className="h-2.5 w-2.5 mr-1" />
              热门
            </Badge>
          )}
          {post.tags?.map(({ tag }) => (
            <Badge
              key={tag.name}
              variant="outline"
              className="text-[10px] h-5 font-normal text-muted-foreground hover:text-foreground hover:border-tea-primary/40 transition-colors"
            >
              {tag.name}
            </Badge>
          ))}
        </div>

        {/* 标题 */}
        <h3 className="font-semibold text-sm md:text-base line-clamp-2 mb-2 group-hover:text-tea-primary transition-colors">
          {post.title}
        </h3>

        {/* 内容预览 */}
        {post.content && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {post.content.replace(/<[^>]*>/g, '').slice(0, 150)}
          </p>
        )}

        {/* 底部信息栏 */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[8px] bg-tea-primary/10 text-tea-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {post.author.name || '匿名用户'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {post._count?.comments || 0}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.viewCount}
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
