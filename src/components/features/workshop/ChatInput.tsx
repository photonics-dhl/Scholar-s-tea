'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Paperclip, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

/**
 * 增强版聊天输入框
 * 支持多行文本、粘贴附件、快捷键发送
 */
export function ChatInput({
  onSend,
  onStop,
  loading,
  disabled,
  placeholder = '输入你的问题...',
  className,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = () => {
    const message = pastedText
      ? `${input}\n\n【粘贴内容】\n${pastedText}`
      : input

    if (!message.trim() || loading) return
    onSend(message.trim())
    setInput('')
    setPastedText('')
    setShowPaste(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text')
    // If pasted content is long (>200 chars), offer to attach it
    if (pasted.length > 200 && !pastedText) {
      e.preventDefault()
      setPastedText(pasted)
      setShowPaste(true)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Pasted text attachment */}
      {showPaste && pastedText && (
        <div className="relative rounded-lg border border-tea-primary/20 bg-tea-primary/5 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="h-4 w-4 text-tea-primary" />
            <span className="text-xs font-medium text-tea-primary">已粘贴文本</span>
            <span className="text-xs text-muted-foreground">
              ({pastedText.length} 字)
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3">
            {pastedText}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => {
              setPastedText('')
              setShowPaste(false)
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled || loading}
            rows={1}
            className="min-h-[44px] max-h-[200px] pr-10 resize-none focus-visible:ring-tea-primary/30 focus-visible:border-tea-primary/50"
          />
          {!showPaste && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPaste(true)}
              title="粘贴长文本"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          )}
        </div>

        {loading ? (
          <Button
            variant="secondary"
            size="icon"
            onClick={onStop}
            className="h-10 w-10 flex-shrink-0"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className="h-10 w-10 flex-shrink-0 bg-tea-primary hover:bg-tea-primary/90 text-tea-primary-foreground p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Enter 发送 · Shift+Enter 换行 · 粘贴长文本自动识别为附件
      </p>
    </div>
  )
}
