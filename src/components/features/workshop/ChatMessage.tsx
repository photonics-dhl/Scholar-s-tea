'use client'

import { User, Bot, AlertCircle, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { StreamText } from './StreamText'
import { CitationCard } from './CitationCard'
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown'
import type { ChatMessage } from '@/hooks/useChat'

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

  const showStream = isStreaming && isAssistant && streamingContent

  // 处理 think 标签
  const { cleanContent, thinkContent } = isAssistant
    ? extractThinkBlocks(message.content)
    : { cleanContent: message.content, thinkContent: '' }

  const displayContent = showStream
    ? extractThinkBlocks(streamingContent).cleanContent
    : cleanContent

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
          'flex-1 max-w-[85%]',
          isUser ? 'text-right' : 'text-left'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 inline-block text-left shadow-sm transition-shadow duration-200 hover:shadow-md',
            isUser
              ? 'bg-gradient-to-br from-tea-primary to-tea-mint text-white rounded-tr-md'
              : isAssistant
                ? 'bg-white border border-border/60 text-foreground rounded-tl-md'
                : 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-md'
          )}
        >
          {showStream ? (
            <StreamText content={displayContent} speed={5} />
          ) : isAssistant ? (
            <SimpleMarkdown content={displayContent} />
          ) : (
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {displayContent}
            </div>
          )}
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
        <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        {/* RAG Citations (only for completed assistant messages) */}
        {!showStream && isAssistant && message.ragContext && message.ragContext.length > 0 && (
          <div className="mt-1">
            <CitationCard citations={message.ragContext} />
          </div>
        )}
      </div>
    </div>
  )
}
