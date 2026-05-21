'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Loader2, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface PdfUploadButtonProps {
  onExtract: (text: string, filename: string, pages: number, totalLength: number, wasTruncated: boolean) => void
  disabled?: boolean
  className?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/**
 * PDF 上传并提取文本按钮
 * 直接上传 PDF 到 /api/v1/ai/extract-pdf，省去中间 /api/v1/upload 的磁盘 I/O 步骤
 * 通过 onExtract 回调返回提取的文本
 */
export function PdfUploadButton({
  onExtract,
  disabled = false,
  className,
}: PdfUploadButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    size: string
  } | null>(null)
  const [extractStats, setExtractStats] = useState<{
    pages: number
    totalLength: number
    returnedLength: number
    wasTruncated: boolean
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setUploadedFile(null)
    setExtractStats(null)
    setError(null)
    setIsProcessing(false)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('仅支持 PDF 文件')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(`文件大小超过 10MB 限制 (${formatFileSize(file.size)})`)
      return
    }

    setError(null)
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      // 减少提取长度，降低处理时间和网络超时风险
      formData.append('maxLength', '30000')

      const res = await fetch('/api/v1/ai/extract-pdf', {
        method: 'POST',
        body: formData,
      })

      // 处理非 JSON 响应（如 503 HTML 错误页）
      let data: { success?: boolean; error?: { message?: string }; data?: Record<string, unknown> }
      const contentType = res.headers.get('content-type')
      if (!res.ok) {
        if (contentType?.includes('application/json')) {
          data = await res.json()
        } else {
          const text = await res.text()
          // 提取 HTML title 或显示状态码
          const titleMatch = text.match(/<title>([^<]*)<\/title>/i)
          const title = titleMatch?.[1]?.trim()
          if (res.status === 503 || res.status === 502) {
            throw new Error('网络不稳定或服务暂时不可用（503），请稍后重试。如持续出现，请检查网络连接或缩小 PDF 文件大小。')
          }
          throw new Error(title || `服务器错误 (${res.status})，请稍后重试`)
        }
      } else {
        data = await res.json()
      }

      if (!data.success) {
        throw new Error(data.error?.message || 'PDF 解析失败')
      }

      const { text, pages, totalLength, wasTruncated } = data.data as {
        text: string
        pages: number
        totalLength: number
        wasTruncated: boolean
      }
      onExtract(text, file.name, pages, totalLength || text.length, wasTruncated || false)
      setUploadedFile({
        name: file.name,
        size: formatFileSize(file.size),
      })
      setExtractStats({
        pages,
        totalLength: totalLength || text.length,
        returnedLength: text.length,
        wasTruncated: wasTruncated || false,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '处理失败'
      setError(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
      />

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-destructive/70 hover:text-destructive underline"
          >
            清除
          </button>
        </div>
      )}

      {extractStats?.wasTruncated && (
        <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">PDF 内容较长，已智能提取</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              共 {extractStats.totalLength.toLocaleString()} 字符，提取{' '}
              {extractStats.returnedLength.toLocaleString()} 字符（保留开头引言/方法 + 结尾结论/参考文献）
            </p>
          </div>
        </div>
      )}

      {uploadedFile ? (
        <div className="flex items-center gap-2 rounded-lg border border-tea-primary/20 bg-tea-primary/5 px-3 py-2">
          <FileText className="h-4 w-4 text-tea-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{uploadedFile.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {uploadedFile.size}
              {extractStats && (
                <span className="ml-1.5">
                  · {extractStats.pages} 页
                  {extractStats.wasTruncated
                    ? ` · ${extractStats.returnedLength.toLocaleString()}/${extractStats.totalLength.toLocaleString()} 字符`
                    : ` · ${extractStats.totalLength.toLocaleString()} 字符`}
                </span>
              )}
            </p>
          </div>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <button
            onClick={reset}
            className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="移除"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {isProcessing ? '提取中...' : '上传 PDF'}
        </Button>
      )}
    </div>
  )
}
