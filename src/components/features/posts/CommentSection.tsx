'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  Heart,
  ThumbsDown,
  CornerDownRight,
  Send,
  X,
  Pin,
  Flame,
  ChevronDown,
  ChevronUp,
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

/* ===================== 单条回复卡片 ===================== */
function ReplyCard({
  comment,
  postAuthorId,
  onReply,
  parentAuthorName,
}: {
  comment: Comment
  postAuthorId?: string
  onReply: (commentId: string, authorName: string) => void
  parentAuthorName: string
}) {
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.score > 0 ? comment.score : 0)
  const [isLikeAnimating, setIsLikeAnimating] = useState(false)
  const isAuthor = comment.author.id === postAuthorId

  const handleLike = () => {
    setIsLikeAnimating(true)
    if (disliked) setDisliked(false)
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    setTimeout(() => setIsLikeAnimating(false), 400)
  }

  const handleDislike = () => {
    if (liked) {
      setLiked(false)
      setLikeCount((prev) => (prev > 0 ? prev - 1 : 0))
    }
    setDisliked(!disliked)
  }

  return (
    <div className="flex gap-2.5 group/reply animate-fade-in-up">
      {/* 左侧时间线 */}
      <div className="flex flex-col items-center flex-shrink-0">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-[10px] bg-gradient-to-br from-tea-primary/15 to-tea-mint/15 text-tea-primary font-medium">
            {comment.author.name?.slice(0, 2) || '匿'}
          </AvatarFallback>
        </Avatar>
        <div className="w-px flex-1 bg-gradient-to-b from-tea-primary/10 to-transparent min-h-[8px]" />
      </div>

      {/* 内容卡片 */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="rounded-lg bg-muted/40 px-3 py-2.5 transition-colors hover:bg-muted/60">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-foreground">
              {comment.author.name || '匿名用户'}
            </span>
            {isAuthor && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-tea-primary/10 text-tea-primary font-medium">
                作者
              </span>
            )}
            <span className="text-[11px] text-muted-foreground ml-auto">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          {/* 引用回复 */}
          <p className="text-[13px] text-muted-foreground mb-1">
            回复 <span className="text-tea-primary font-medium">@{parentAuthorName}</span>
          </p>

          {/* Content */}
          <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>

          {/* Actions — 小红书风格 */}
          <div className="flex items-center gap-3 mt-1.5">
            {/* 点赞 */}
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors duration-200',
                liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
              )}
            >
              <Heart
                className={cn(
                  'h-3.5 w-3.5 transition-all duration-200',
                  liked && 'fill-current',
                  isLikeAnimating && 'animate-like-bounce'
                )}
              />
              <span>{likeCount > 0 ? likeCount : '赞'}</span>
            </button>
            {/* 踩 */}
            <button
              onClick={handleDislike}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors duration-200',
                disliked ? 'text-gray-700' : 'text-muted-foreground hover:text-gray-600'
              )}
            >
              <ThumbsDown
                className={cn(
                  'h-3.5 w-3.5 transition-all duration-200',
                  disliked && 'fill-current'
                )}
              />
              <span>{disliked ? '已踩' : '踩'}</span>
            </button>
            <button
              onClick={() => onReply(comment.id, comment.author.name || '匿名用户')}
              className="text-xs text-muted-foreground hover:text-tea-primary transition-colors"
            >
              回复
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===================== 单条评论卡片 ===================== */
function CommentCard({
  comment,
  postAuthorId,
  onReply,
}: {
  comment: Comment
  postAuthorId?: string
  onReply: (commentId: string, authorName: string) => void
}) {
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.score > 0 ? comment.score : 0)
  const [isLikeAnimating, setIsLikeAnimating] = useState(false)
  const [showAllReplies, setShowAllReplies] = useState(true)
  const isAuthor = comment.author.id === postAuthorId
  const isHot = comment.score >= 5
  const hasReplies = comment.children.length > 0
  const replyCount = comment.children.length

  const handleLike = () => {
    setIsLikeAnimating(true)
    if (disliked) setDisliked(false)
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    setTimeout(() => setIsLikeAnimating(false), 400)
  }

  const handleDislike = () => {
    if (liked) {
      setLiked(false)
      setLikeCount((prev) => (prev > 0 ? prev - 1 : 0))
    }
    setDisliked(!disliked)
  }

  return (
    <div className="animate-fade-in-up">
      {/* 主评论卡片 */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {/* Header Bar - GitHub Issues 风格 */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-muted/30 border-b border-border/30">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-tea-primary/20 to-tea-mint/20 text-tea-primary font-medium">
              {comment.author.name?.slice(0, 2) || '匿'}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">
              {comment.author.name || '匿名用户'}
            </span>
            {isAuthor && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-tea-primary/10 text-tea-primary font-medium shrink-0">
                作者
              </span>
            )}
            {comment.isPinned && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-journal-gold/10 text-journal-gold font-medium shrink-0 flex items-center gap-0.5">
                <Pin className="h-2.5 w-2.5" /> 置顶
              </span>
            )}
            {isHot && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-500 font-medium shrink-0 flex items-center gap-0.5">
                <Flame className="h-2.5 w-2.5" /> 热评
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-[15px] text-foreground leading-relaxed">{comment.content}</p>
        </div>

        {/* Actions Bar - 小红书风格底部操作栏 */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30 bg-muted/20">
          {/* 左侧：回复 + 展开 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onReply(comment.id, comment.author.name || '匿名用户')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-tea-primary transition-colors"
            >
              <CornerDownRight className="h-3.5 w-3.5" />
              回复
            </button>
            {hasReplies && (
              <button
                onClick={() => setShowAllReplies(!showAllReplies)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-tea-primary transition-colors"
              >
                {showAllReplies ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> 收起 {replyCount} 条回复
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> 展开 {replyCount} 条回复
                  </>
                )}
              </button>
            )}
          </div>

          {/* 右侧：点赞 + 踩 — 小红书风格 pill */}
          <div className="flex items-center gap-1 bg-gray-100/80 rounded-full px-1 py-0.5">
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all duration-200',
                liked
                  ? 'bg-red-50 text-red-500'
                  : 'text-muted-foreground hover:text-red-400 hover:bg-gray-200/50'
              )}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-all duration-200',
                  liked && 'fill-current',
                  isLikeAnimating && 'animate-like-bounce'
                )}
              />
              <span className="tabular-nums min-w-[1ch]">{likeCount > 0 ? likeCount : '点赞'}</span>
            </button>
            <div className="w-px h-4 bg-gray-300/60" />
            <button
              onClick={handleDislike}
              className={cn(
                'flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all duration-200',
                disliked
                  ? 'bg-gray-200 text-gray-700'
                  : 'text-muted-foreground hover:text-gray-600 hover:bg-gray-200/50'
              )}
            >
              <ThumbsDown
                className={cn(
                  'h-4 w-4 transition-all duration-200',
                  disliked && 'fill-current'
                )}
              />
              <span>{disliked ? '已踩' : '踩'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 回复列表 - 小红书楼中楼风格 */}
      {hasReplies && showAllReplies && (
        <div className="mt-2 ml-4 pl-4 border-l-2 border-tea-primary/10 space-y-1">
          {comment.children.map((child) => (
            <ReplyCard
              key={child.id}
              comment={child}
              postAuthorId={postAuthorId}
              onReply={onReply}
              parentAuthorName={comment.author.name || '匿名用户'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ===================== 主评论区组件 ===================== */
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
  const replyInputRef = useRef<HTMLTextAreaElement>(null)

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
    // 聚焦到回复输入框
    setTimeout(() => replyInputRef.current?.focus(), 100)
  }

  const cancelReply = () => {
    setReplyingTo(null)
    setReplyToName('')
    setReplyContent('')
  }

  // 排序：置顶 > 热评 > 时间
  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    if (a.score !== b.score) return b.score - a.score
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <section className="space-y-4">
      {/* 评论区头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-tea-primary" />
          <h2 className="text-lg font-semibold">
            评论 <span className="text-muted-foreground text-sm font-normal">({commentCount})</span>
          </h2>
        </div>
        {comments.length > 0 && (
          <span className="text-xs text-muted-foreground">
            按热度排序
          </span>
        )}
      </div>

      {/* 主评论输入框 - 小红书风格 */}
      {!isLocked && (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm p-4 animate-fade-in-up">
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
                className="min-h-[80px] resize-none bg-muted/20 border-transparent focus:bg-background focus:border-input transition-colors rounded-lg"
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentContent.trim() || isSubmitting}
                  size="sm"
                  className="gap-1.5 rounded-full px-5 bg-tea-primary hover:bg-tea-primary/90"
                >
                  <Send className="h-3.5 w-3.5" />
                  发布
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 回复浮层 - 固定在评论区上方 */}
      {replyingTo && (
        <div className="rounded-xl border border-tea-primary/30 bg-tea-primary/5 p-4 animate-fade-in-up sticky top-0 z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-tea-primary font-medium flex items-center gap-1">
              <CornerDownRight className="h-3.5 w-3.5" />
              回复 <span className="font-semibold">@{replyToName}</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={cancelReply}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Textarea
              ref={replyInputRef}
              placeholder={`回复 @${replyToName}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[60px] text-sm resize-none rounded-lg"
              rows={2}
              autoFocus
            />
            <div className="flex flex-col gap-1.5">
              <Button
                size="sm"
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || isSubmitting}
                className="gap-1 bg-tea-primary hover:bg-tea-primary/90"
              >
                <Send className="h-3 w-3" />
                发布
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelReply}>
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-4">
        {sortedComments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            postAuthorId={postAuthorId}
            onReply={handleReplyClick}
          />
        ))}
      </div>

      {/* 空状态 */}
      {comments.length === 0 && (
        <div className="text-center py-16 text-muted-foreground animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 opacity-40" />
          </div>
          <p className="text-sm font-medium">暂无评论</p>
          <p className="text-xs mt-1 opacity-70">来说点什么吧，成为第一个评论的人~</p>
        </div>
      )}
    </section>
  )
}
