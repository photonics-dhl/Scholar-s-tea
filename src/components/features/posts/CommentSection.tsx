'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  Heart,
  CornerDownRight,
  Send,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'

interface CommentAuthor {
  id: string
  name: string | null
  avatar: string | null
}

interface Comment {
  id: string
  content: string
  author: CommentAuthor
  isPinned: boolean
  createdAt: string
  upvotes: number
  downvotes: number
  score: number
  children: Comment[]
}

interface CommentSectionProps {
  comments: Comment[]
  postAuthorId?: string
  commentCount: number
  isLocked: boolean
  onSubmitComment: (content: string) => void
  onSubmitReply: (parentId: string, content: string) => void
  onLikeComment?: (commentId: string) => void
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

function CommentItem({
  comment,
  postAuthorId,
  onReply,
  depth = 0,
}: {
  comment: Comment
  postAuthorId?: string
  onReply: (commentId: string, authorName: string) => void
  depth?: number
}) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.score > 0 ? comment.score : 0)
  const isAuthor = comment.author.id === postAuthorId

  const [isAnimating, setIsAnimating] = useState(false)

  const handleLike = () => {
    setIsAnimating(true)
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    setTimeout(() => setIsAnimating(false), 400)
  }

  return (
    <div
      className={cn(
        'group animate-fade-in-up',
        depth > 0 && 'ml-12'
      )}
      style={{ animationDelay: `${depth * 50}ms` }}
    >
      <div className="flex gap-3 py-4">
        {/* Avatar */}
        <Avatar className={cn('flex-shrink-0', depth > 0 ? 'h-7 w-7' : 'h-9 w-9')}>
          <AvatarFallback
            className={cn(
              'bg-gradient-to-br from-tea-primary/20 to-tea-mint/20 text-tea-primary font-medium',
              depth > 0 ? 'text-[10px]' : 'text-xs'
            )}
          >
            {comment.author.name?.slice(0, 2) || '匿'}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('font-medium', depth > 0 ? 'text-sm' : 'text-sm')}>
              {comment.author.name || '匿名用户'}
            </span>
            {isAuthor && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-tea-primary/10 text-tea-primary font-medium">
                作者
              </span>
            )}
            {comment.isPinned && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-journal-gold/10 text-journal-gold font-medium">
                置顶
              </span>
            )}
          </div>

          {/* Content */}
          <p className={cn('text-foreground leading-relaxed', depth > 0 ? 'text-sm' : 'text-[15px]')}>
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>

            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors duration-200',
                liked
                  ? 'text-red-500'
                  : 'text-muted-foreground hover:text-red-400'
              )}
            >
              <Heart
                className={cn(
                  'h-3.5 w-3.5 transition-all duration-200',
                  liked && 'fill-current',
                  isAnimating && 'animate-like-bounce'
                )}
              />
              <span>{likeCount > 0 ? likeCount : '点赞'}</span>
            </button>

            <button
              onClick={() => onReply(comment.id, comment.author.name || '匿名用户')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-tea-primary transition-colors"
            >
              <CornerDownRight className="h-3 w-3" />
              回复
            </button>
          </div>

          {/* Children */}
          {comment.children.length > 0 && (
            <div className="mt-2 space-y-0">
              {comment.children.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  postAuthorId={postAuthorId}
                  onReply={onReply}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CommentSection({
  comments,
  postAuthorId,
  commentCount,
  isLocked,
  onSubmitComment,
  onSubmitReply,
}: CommentSectionProps) {
  const [commentContent, setCommentContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyToName, setReplyToName] = useState('')
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitComment = async () => {
    if (!commentContent.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmitComment(commentContent.trim())
      setCommentContent('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !replyingTo || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmitReply(replyingTo, replyContent.trim())
      setReplyContent('')
      setReplyingTo(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplyClick = (commentId: string, authorName: string) => {
    setReplyingTo(commentId)
    setReplyToName(authorName)
    setReplyContent('')
  }

  return (
    <section className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">
          {commentCount} 条评论
        </h2>
      </div>

      {/* Comment Form */}
      {!isLocked && (
        <div className="mb-8 animate-fade-in-up">
          <div className="flex gap-3">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="text-xs bg-gradient-to-br from-tea-primary/20 to-tea-mint/20 text-tea-primary">
                我
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="写下你的评论..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="min-h-[80px] resize-y bg-muted/30 border-transparent focus:bg-background focus:border-input transition-colors"
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentContent.trim() || isSubmitting}
                  size="sm"
                  className="gap-1.5 rounded-full px-5"
                >
                  <Send className="h-3.5 w-3.5" />
                  发布
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Form (floating) */}
      {replyingTo && (
        <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border/50 animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              回复 <span className="font-medium text-foreground">@{replyToName}</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder={`回复 @${replyToName}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[60px] text-sm resize-y"
              rows={2}
              autoFocus
            />
            <div className="flex flex-col gap-1.5">
              <Button
                size="sm"
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || isSubmitting}
                className="gap-1"
              >
                <Send className="h-3 w-3" />
                发布
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="divide-y divide-border/30">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postAuthorId={postAuthorId}
            onReply={handleReplyClick}
          />
        ))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground animate-fade-in-up">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">暂无评论，来说点什么吧</p>
        </div>
      )}
    </section>
  )
}
