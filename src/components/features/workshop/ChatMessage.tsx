'use client'

import { useState, useEffect } from 'react'
import { User, Bot, AlertCircle, Lightbulb, FileText, Download, Copy, Check, ShieldCheck, ShieldAlert, ShieldX, BookOpen, BarChart3, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { StreamText } from './StreamText'
import { CitationCard } from './CitationCard'
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown'
import { ImageLightbox } from '@/components/features/tea-party/ImageLightbox'
import type { ChatMessage } from '@/hooks/useChat'
import { PeerReviewScoreCard } from './PeerReviewScoreCard'
import { GrantApplicationWizard } from './GrantApplicationWizard'

interface ChatMessageProps {
  message: ChatMessage
  isStreaming?: boolean
  streamingContent?: string
  index?: number
}

/**
 * 从 AI 回复中提取并移除 <think> 标签内容
 * 返回 { cleanContent, thinkContent }
 */
function extractThinkBlocks(content: string): {
  cleanContent: string
  thinkContent: string
} {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g
  const thinks: string[] = []
  let match
  while ((match = thinkRegex.exec(content)) !== null) {
    thinks.push(match[1].trim())
  }
  const cleanContent = content.replace(thinkRegex, '').trim()
  return {
    cleanContent,
    thinkContent: thinks.join('\n\n'),
  }
}

/**
 * 单条聊天消息组件
 * 用户消息：tea-primary 渐变气泡（右对齐）
 * AI 消息：浅色卡片背景（左对齐），支持 Markdown 渲染和 think 折叠
 * 系统消息：居中提示
 */
export function ChatMessageItem({
  message,
  isStreaming,
  streamingContent,
  index = 0,
}: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isSystem = message.role === 'system'
  const [copied, setCopied] = useState(false)

  const showStream = isStreaming && isAssistant && streamingContent

  // 处理 think 标签
  const { cleanContent, thinkContent } = isAssistant
    ? extractThinkBlocks(message.content)
    : { cleanContent: message.content, thinkContent: '' }

  const displayContent = showStream
    ? extractThinkBlocks(streamingContent).cleanContent
    : cleanContent

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: create temporary textarea
      const textarea = document.createElement('textarea')
      textarea.value = displayContent
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in-up',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 size-9 rounded-full flex items-center justify-center shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-tea-primary to-tea-mint text-tea-primary-foreground'
            : isAssistant
              ? 'bg-gradient-to-br from-convo-blue to-convo-blue/80 text-white'
              : 'bg-destructive/10 text-destructive'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : isAssistant ? (
          <Bot className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 max-w-[88%] sm:max-w-[82%]',
          isUser ? 'text-right' : 'text-left'
        )}
      >
        <div className="space-y-2">
          {/* Attachments (only for user messages) */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {message.attachments.map((att, i) => (
                <AttachmentPreview key={`${att.url}-${i}`} attachment={att} />
              ))}
            </div>
          )}

          <div
            className={cn(
              'rounded-2xl px-4 py-3 inline-block text-left shadow-sm transition-shadow duration-200 select-text',
              isUser
                ? 'bg-gradient-to-br from-tea-primary to-tea-mint text-white rounded-tr-md'
                : isAssistant
                  ? 'bg-white border border-border/50 text-foreground rounded-tl-md hover:shadow-md'
                  : 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-md'
            )}
          >
            <div className="relative group/message">
              {isAssistant && !showStream && (
                <button
                  onClick={handleCopy}
                  className="absolute -top-2 -right-2 opacity-0 group-hover/message:opacity-100 transition-opacity z-10 flex items-center gap-1 rounded-md bg-muted border border-border/60 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 shadow-sm"
                  title="复制内容"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>复制</span>
                    </>
                  )}
                </button>
              )}
              {isAssistant ? (
                <div className="relative select-text">
                  <SimpleMarkdown content={displayContent} className="select-text" />
                  {showStream && (
                    <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap leading-relaxed max-w-prose select-text">
                  {displayContent}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Think Block (collapsible reasoning) */}
        {!showStream && isAssistant && thinkContent && (
          <details className="mt-2 ml-1 group/think">
            <summary className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none select-none w-fit">
              <Lightbulb className="h-3 w-3 transition-transform group-open/think:rotate-12" />
              <span>思考过程</span>
              <span className="text-[10px] opacity-60">(点击展开)</span>
            </summary>
            <div className="mt-1.5 p-3 rounded-lg bg-muted/50 border border-border/40 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {thinkContent}
            </div>
          </details>
        )}

        {/* Timestamp */}
        <Timestamp timestamp={message.timestamp} />

        {/* Citation Verification Status (Hermes-enhanced modes) */}
        {!showStream && isAssistant && message.citations && (
          <CitationVerifyBadge citations={message.citations} />
        )}

        {/* Retrieved Papers (external academic database search results) */}
        {!showStream && isAssistant && message.papers && message.papers.length > 0 && (
          <RetrievedPapers papers={message.papers} />
        )}

        {/* RAG Citations (only for completed assistant messages) */}
        {!showStream && isAssistant && message.ragContext && message.ragContext.length > 0 && (
          <div className="mt-1">
            <CitationCard citations={message.ragContext} />
          </div>
        )}

        {/* Structured Data Visualization (peer_review / grant) */}
        {!showStream && isAssistant && !!message.structured && (
          <StructuredDataView structured={message.structured} />
        )}
      </div>
    </div>
  )
}

/** 附件预览组件 */
function AttachmentPreview({ attachment }: { attachment: import('@/hooks/useChat').ChatAttachment }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (attachment.type === 'image') {
    return (
      <>
        <button
          onClick={() => setLightboxOpen(true)}
          className="relative rounded-lg overflow-hidden border border-white/20 shadow-sm group"
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-20 h-20 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </button>
        <ImageLightbox
          src={attachment.url}
          alt={attachment.name}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </>
    )
  }

  // File attachment
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(attachment.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      window.open(attachment.url, '_blank')
    }
  }

  return (
    <a
      href={attachment.url}
      download={attachment.name}
      onClick={handleDownload}
      className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/20 transition-colors"
    >
      <FileText className="h-4 w-4 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium truncate max-w-[120px]">{attachment.name}</p>
        {attachment.size && <p className="text-[10px] opacity-70">{attachment.size}</p>}
      </div>
      <Download className="h-3 w-3 flex-shrink-0 opacity-70" />
    </a>
  )
}

/** 引用验证状态 Badge */
function CitationVerifyBadge({ citations }: { citations: import('@/hooks/useChat').CitationStatus }) {
  const { verified, unverified, score } = citations
  const total = verified + unverified

  if (total === 0) return null

  const isHigh = score >= 80
  const isMedium = score >= 50

  const config = isHigh
    ? {
        icon: ShieldCheck,
        label: '引用已验证',
        sub: `${verified}/${total} 通过 Semantic Scholar 确认`,
        className: 'bg-green-50 text-green-700 border-green-200',
        iconClass: 'text-green-500',
      }
    : isMedium
      ? {
          icon: ShieldAlert,
          label: '部分引用待核实',
          sub: `${verified}/${total} 已确认，${unverified} 个待补充`,
          className: 'bg-amber-50 text-amber-700 border-amber-200',
          iconClass: 'text-amber-500',
        }
      : {
          icon: ShieldX,
          label: '引用可信度低',
          sub: `仅 ${verified}/${total} 通过验证，建议人工复核`,
          className: 'bg-red-50 text-red-700 border-red-200',
          iconClass: 'text-red-500',
        }

  const Icon = config.icon

  return (
    <div className={cn('mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs', config.className)}>
      <Icon className={cn('h-3.5 w-3.5', config.iconClass)} />
      <span className="font-medium">{config.label}</span>
      <span className="opacity-70">·</span>
      <span className="opacity-80">{config.sub}</span>
    </div>
  )
}

/** 检索到的外部学术文献展示 */
function RetrievedPapers({
  papers,
}: {
  papers: Array<{ title: string; authors: string[]; year?: number; venue?: string; url?: string }>
}) {
  const [expanded, setExpanded] = useState(false)

  if (!papers || papers.length === 0) return null

  return (
    <div className="mt-3 rounded-lg border border-journal-primary/10 bg-journal-primary/[0.03] p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-journal-primary hover:text-journal-primary/80 transition-colors w-full"
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span>基于 {papers.length} 篇真实文献生成（Semantic Scholar / arXiv / Tavily）</span>
        <span className="ml-auto text-[10px] opacity-60">
          {expanded ? '点击收起' : '点击展开'}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
          {papers.map((paper, i) => (
            <div
              key={i}
              className="text-xs p-2 rounded bg-white/60 border border-border/40"
            >
              <div className="font-medium text-foreground leading-relaxed">
                {paper.url ? (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-journal-primary hover:underline"
                  >
                    {paper.title}
                  </a>
                ) : (
                  paper.title
                )}
              </div>
              <div className="text-muted-foreground mt-0.5">
                {paper.authors.length > 0 && (
                  <span>{paper.authors.slice(0, 3).join(', ')}</span>
                )}
                {paper.year && (
                  <span className="ml-1">({paper.year})</span>
                )}
                {paper.venue && (
                  <span className="ml-1 italic">{paper.venue}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** 结构化数据可视化路由 */
function StructuredDataView({ structured }: { structured: unknown }) {
  if (!structured || typeof structured !== 'object') return null

  const data = structured as Record<string, unknown>

  // Peer Review: has scores and verdict
  if (data.scores && data.verdict) {
    return (
      <div className="mt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
          <BarChart3 className="h-3.5 w-3.5 text-convo-blue" />
          <span>结构化评审结果</span>
        </div>
        <PeerReviewScoreCard data={structured as any} />
      </div>
    )
  }

  // Grant Application: has title and sections
  if (data.title && data.sections) {
    return (
      <div className="mt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
          <FileCheck className="h-3.5 w-3.5 text-journal-primary" />
          <span>结构化申请书框架</span>
        </div>
        <GrantApplicationWizard data={structured as any} />
      </div>
    )
  }

  return null
}

/** SSR-safe timestamp component */
function Timestamp({ timestamp }: { timestamp: number }) {
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    setTimeStr(
      new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    )
  }, [timestamp])

  return (
    <p className="text-[11px] text-muted-foreground mt-1.5 px-1 min-h-[1em]">
      {timeStr}
    </p>
  )
}
