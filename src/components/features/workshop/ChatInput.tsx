'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Loader2,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Trash2,
  Library,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'
import type { ChatAttachment } from '@/hooks/useChat'

interface ChatInputProps {
  onSend: (message: string, options?: { attachments?: ChatAttachment[] }) => void
  onStop?: () => void
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  personalKBEnabled?: boolean
  onTogglePersonalKB?: (enabled: boolean) => void
  pkbStatus?: {
    lastSearchAt: number | null
    resultCount: number
    error: string | null
  } | null
  contextState?: {
    totalTokens: number
    isWarning: boolean
    hiddenRounds: number
  } | null
}

// Block dangerous file types
const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.dll', '.msi', '.scr', '.vbs', '.js', '.jar']
const isFileBlocked = (filename: string): boolean => {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return BLOCKED_EXTENSIONS.includes(ext)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/**
 * 增强版工坊聊天输入框
 * 支持图片/文件上传、拖放、进度指示、附件预览
 */
export function ChatInput({
  onSend,
  onStop,
  loading,
  disabled,
  placeholder = '输入你的问题...',
  className,
  personalKBEnabled,
  onTogglePersonalKB,
  pkbStatus,
  contextState,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputAreaRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = () => {
    const message = input.trim()
    if ((!message && attachments.length === 0) || loading) return

    onSend(message, { attachments: attachments.length > 0 ? attachments : undefined })
    setInput('')
    setAttachments([])
    setUploadError(null)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const uploadFile = async (file: File, type: 'image' | 'file'): Promise<ChatAttachment | null> => {
    // Validation
    if (isFileBlocked(file.name)) {
      throw new Error(`不支持的文件类型：${file.name.slice(file.name.lastIndexOf('.'))}`)
    }
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error(`文件大小超过 10MB 限制 (${formatFileSize(file.size)})`)
    }
    if (type === 'image') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('仅支持 JPG/PNG/GIF/WebP 格式')
      }
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type === 'image' ? 'IMAGE' : 'FILE')

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/v1/upload')

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            if (data.success && data.data?.url) {
              resolve({
                type,
                url: data.data.url,
                name: file.name,
                size: formatFileSize(file.size),
              })
            } else {
              reject(new Error(data.error?.message || '上传失败'))
            }
          } catch {
            reject(new Error('响应解析失败'))
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText)
            reject(new Error(err.error?.message || `上传失败 (${xhr.status})`))
          } catch {
            reject(new Error(`上传失败 (${xhr.status})`))
          }
        }
      })

      xhr.addEventListener('error', () => reject(new Error('网络错误，请重试')))
      xhr.send(formData)
    })
  }

  const handleFileSelect = async (files: FileList | null, type: 'image' | 'file') => {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      const newAttachments: ChatAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const att = await uploadFile(files[i], type)
        if (att) newAttachments.push(att)
      }
      setAttachments((prev) => [...prev, ...newAttachments])
    } catch (err) {
      const msg = err instanceof Error ? err.message : '上传失败，请重试'
      setUploadError(msg)
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = e.dataTransfer.files
      if (!files || files.length === 0) return

      // Separate images and files, then upload in batches
      const imageFiles: File[] = []
      const otherFiles: File[] = []
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          imageFiles.push(files[i])
        } else {
          otherFiles.push(files[i])
        }
      }
      if (imageFiles.length > 0) {
        handleFileSelect(imageFiles as unknown as FileList, 'image')
      }
      if (otherFiles.length > 0) {
        handleFileSelect(otherFiles as unknown as FileList, 'file')
      }
    },
    []
  )

  const hasContent = input.trim().length > 0 || attachments.length > 0

  return (
    <div className={cn('space-y-2', className)}>
      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div
              key={`${att.type}-${att.url}-${i}`}
              className="relative group flex items-center gap-2 rounded-lg border border-tea-primary/20 bg-tea-primary/5 px-3 py-2"
            >
              {att.type === 'image' ? (
                <div className="flex items-center gap-2">
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                    {att.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-tea-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate max-w-[140px]">{att.name}</p>
                    {att.size && (
                      <p className="text-[10px] text-muted-foreground">{att.size}</p>
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={() => removeAttachment(i)}
                className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">
          <span>{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="ml-auto text-destructive/70 hover:text-destructive underline"
          >
            清除
          </button>
        </div>
      )}

      {/* Input Area with Drag & Drop */}
      <div
        ref={inputAreaRef}
        className={cn(
          'relative rounded-xl border transition-colors',
          isDragOver
            ? 'border-tea-primary bg-tea-primary/5 border-dashed'
            : 'border-border/60 bg-background'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-tea-primary/5 rounded-xl">
            <div className="flex items-center gap-2 text-tea-primary">
              <ImageIcon className="h-5 w-5" />
              <span className="text-sm font-medium">释放以上传文件</span>
            </div>
          </div>
        )}

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading || uploading}
          rows={1}
          className="min-h-[52px] max-h-[200px] pr-12 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none bg-transparent"
        />

        {/* Toolbar inside textarea area */}
        <div className="flex items-center justify-between px-3 pb-2">
          <div className="flex items-center gap-1">
            {/* Image upload */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files, 'image')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled || loading || uploading}
              title="上传图片"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>

            {/* File upload (PDF etc.) */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files, 'file')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || loading || uploading}
              title="上传文件"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Personal Knowledge Base Toggle */}
            {onTogglePersonalKB && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-2 text-xs gap-1',
                  personalKBEnabled
                    ? 'text-tea-primary bg-tea-primary/10 hover:bg-tea-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => onTogglePersonalKB(!personalKBEnabled)}
                disabled={disabled || loading || uploading}
                title={personalKBEnabled ? '私人知识库已启用' : '点击启用私人知识库'}
              >
                <Library className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">知识库</span>
                {personalKBEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-tea-primary" />
                )}
              </Button>
            )}
            {/* PKB status indicator */}
            {personalKBEnabled && pkbStatus?.lastSearchAt && (
              <span className="text-[10px] ml-1">
                {pkbStatus.error ? (
                  <span className="text-red-500" title={pkbStatus.error}>检索失败</span>
                ) : pkbStatus.resultCount > 0 ? (
                  <span className="text-tea-primary">引用 {pkbStatus.resultCount} 段</span>
                ) : (
                  <span className="text-muted-foreground">未匹配到内容</span>
                )}
              </span>
            )}

            {uploading && (
              <div className="flex items-center gap-1.5 ml-1">
                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tea-primary rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{uploadProgress}%</span>
              </div>
            )}
          </div>

          {/* Send / Stop button */}
          <div className="flex items-center gap-2">
            {loading ? (
              <Button
                variant="secondary"
                size="icon"
                onClick={onStop}
                className="h-8 w-8"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!hasContent || disabled || uploading}
                className="h-8 w-8 p-0 bg-tea-primary hover:bg-tea-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Enter 发送 · Shift+Enter 换行 · 支持拖拽上传 · 图片/PDF 最大 10MB
      </p>
    </div>
  )
}
