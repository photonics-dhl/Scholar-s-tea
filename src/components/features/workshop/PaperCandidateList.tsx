'use client'

import { useState, useCallback } from 'react'
import {
  Download,
  FolderOpen,
  Check,
  BookOpen,
  Quote,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

/** 检测浏览器是否支持 File System Access API 且处于安全上下文 */
function isFileSystemAccessSupported(): {
  supported: boolean
  reason: 'secure_context' | 'api_unavailable' | 'ok'
} {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'api_unavailable' }
  }
  // 必须在安全上下文（HTTPS / localhost / 127.0.0.1）
  if (!window.isSecureContext) {
    return { supported: false, reason: 'secure_context' }
  }
  if (!('showDirectoryPicker' in window)) {
    return { supported: false, reason: 'api_unavailable' }
  }
  return { supported: true, reason: 'ok' }
}

export interface PaperCandidate {
  id: string
  title: string
  authors: string[]
  year?: number
  venue?: string
  citations?: number
  doi?: string
  abstract?: string
}

interface PaperCandidateListProps {
  candidates: PaperCandidate[]
  /** 是否已选择本地保存目录 */
  directoryHandle?: FileSystemDirectoryHandle | null
  /** 目录选择回调（未选择时触发） */
  onRequestDirectory?: () => void
  /** 下载选中项回调 */
  onDownload: (selected: PaperCandidate[]) => void
  className?: string
}

/**
 * 批量文献候选列表组件
 *
 * 展示 AI 搜索到的候选文献，允许用户多选后批量下载。
 * 集成 File System Access API 目录保存支持。
 */
export function PaperCandidateList({
  candidates,
  directoryHandle,
  onRequestDirectory,
  onDownload,
  className,
}: PaperCandidateListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isDownloading, setIsDownloading] = useState(false)
  const [dirError, setDirError] = useState<string | null>(null)
  const dirCheck = isFileSystemAccessSupported()
  const dirSupported = dirCheck.supported

  const allSelected = selectedIds.size === candidates.length && candidates.length > 0
  const someSelected = selectedIds.size > 0 && !allSelected

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(candidates.map((c) => c.id)))
    }
  }, [allSelected, candidates])

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleDownload = useCallback(() => {
    if (selectedIds.size === 0) return

    // 未选择文件夹但浏览器支持：尝试弹出选择器
    if (!directoryHandle && dirSupported && onRequestDirectory) {
      setDirError(null)
      onRequestDirectory()
      return
    }

    // 发送下载请求（无论是否有 folder handle，无论 HTTP/HTTPS）
    const selected = candidates.filter((c) => selectedIds.has(c.id))
    setIsDownloading(true)
    setDirError(null)
    try {
      onDownload(selected)
    } catch (err) {
      console.error('[PaperCandidateList] Download failed:', err)
      setDirError('下载请求发送失败，请重试')
    }
    // Reset after a short delay to allow the download to start
    setTimeout(() => setIsDownloading(false), 500)
  }, [selectedIds, candidates, directoryHandle, onRequestDirectory, onDownload, dirSupported])

  if (!candidates || candidates.length === 0) return null

  return (
    <div className={cn('rounded-xl border border-journal-primary/15 bg-journal-primary/[0.03] overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-journal-primary/10 bg-journal-primary/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-journal-primary flex-shrink-0" />
            <span className="text-sm font-medium text-foreground">
              候选文献列表
            </span>
            <span className="text-xs text-muted-foreground">
              共 {candidates.length} 篇
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
              onClick={toggleAll}
            >
              {allSelected ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  取消全选
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  全选
                </>
              )}
            </Button>
          </div>
        </div>
        {selectedIds.size > 0 && (
          <div className="mt-1.5 text-xs text-journal-primary">
            已选择 {selectedIds.size} 篇文献
          </div>
        )}
      </div>

      {/* Candidate List */}
      <div className="max-h-[400px] overflow-y-auto">
        {candidates.map((paper) => (
          <CandidateCard
            key={paper.id}
            paper={paper}
            selected={selectedIds.has(paper.id)}
            expanded={expandedIds.has(paper.id)}
            onToggle={() => toggleOne(paper.id)}
            onToggleExpand={() => toggleExpand(paper.id)}
          />
        ))}
      </div>

      {/* Footer - Download Action */}
      <div className="px-4 py-3 border-t border-journal-primary/10 bg-journal-primary/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs">
            {selectedIds.size === 0 ? (
              <span className="text-muted-foreground">请选择要下载的文献</span>
            ) : !dirSupported && dirCheck.reason === 'secure_context' ? (
              <span className="flex items-center gap-1 text-amber-700">
                <AlertCircle className="w-3 h-3" />
                当前为 HTTP，下载后请手动点击附件「下载」按钮保存
              </span>
            ) : !dirSupported ? (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-3 h-3" />
                你的浏览器不支持文件夹选择，请使用 Chrome/Edge 最新版
              </span>
            ) : directoryHandle ? (
              <span className="flex items-center gap-1 text-green-700">
                <Check className="w-3 h-3" />
                将保存到本地文件夹
              </span>
            ) : (
              <button
                onClick={() => {
                  setDirError(null)
                  onRequestDirectory?.()
                }}
                className="flex items-center gap-1 text-amber-700 hover:text-amber-900 hover:underline transition-colors"
              >
                <FolderOpen className="w-3 h-3" />
                请先选择保存文件夹
              </button>
            )}
          </div>
          <Button
            size="sm"
            className={cn(
              'h-8 text-xs gap-1.5 transition-colors',
              selectedIds.size > 0
                ? 'bg-journal-primary hover:bg-journal-primary/90 text-white'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
            disabled={selectedIds.size === 0 || isDownloading}
            onClick={handleDownload}
          >
            {isDownloading ? (
              <>
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                发送中...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                下载选中 ({selectedIds.size})
              </>
            )}
          </Button>
        </div>
        {/* Error message */}
        {dirError && (
          <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {dirError}
          </div>
        )}
      </div>
    </div>
  )
}

/** 单条候选文献卡片 */
function CandidateCard({
  paper,
  selected,
  expanded,
  onToggle,
  onToggleExpand,
}: {
  paper: PaperCandidate
  selected: boolean
  expanded: boolean
  onToggle: () => void
  onToggleExpand: () => void
}) {
  return (
    <div
      className={cn(
        'px-4 py-3 border-b border-border/30 last:border-b-0 transition-colors',
        selected ? 'bg-journal-primary/[0.06]' : 'hover:bg-muted/30'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={cn(
            'mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            selected
              ? 'bg-journal-primary border-journal-primary text-white'
              : 'border-border bg-background hover:border-journal-primary/50'
          )}
        >
          {selected && <Check className="w-3 h-3" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start gap-2">
            <h4 className="text-sm font-medium text-foreground leading-snug flex-1">
              {paper.title}
            </h4>
            {paper.abstract && (
              <button
                onClick={onToggleExpand}
                className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
                title={expanded ? '收起摘要' : '展开摘要'}
              >
                {expanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
            {paper.authors && paper.authors.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className="truncate max-w-[200px]">
                  {paper.authors.slice(0, 3).join(', ')}
                  {paper.authors.length > 3 && ' et al.'}
                </span>
              </span>
            )}
            {paper.year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {paper.year}
              </span>
            )}
            {paper.venue && (
              <span className="italic">{paper.venue}</span>
            )}
            {typeof paper.citations === 'number' && (
              <span className="flex items-center gap-1 text-amber-700">
                <Quote className="w-3 h-3" />
                被引 {paper.citations.toLocaleString()} 次
              </span>
            )}
          </div>

          {/* DOI */}
          {paper.doi && (
            <div className="mt-1 text-[11px] text-muted-foreground/70">
              DOI: {paper.doi}
            </div>
          )}

          {/* Abstract (expandable) */}
          {expanded && paper.abstract && (
            <div className="mt-2 text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-lg px-3 py-2">
              {paper.abstract}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 从 AI 消息内容中提取候选文献 JSON
 * 格式: [PAPER_CANDIDATES] [{...}, {...}] [/PAPER_CANDIDATES]
 */
export function extractPaperCandidates(content: string): {
  candidates: PaperCandidate[]
  cleanContent: string
} {
  const regex = /\[PAPER_CANDIDATES\]\s*([\s\S]*?)\s*\[\/PAPER_CANDIDATES\]/
  const match = content.match(regex)
  if (!match) return { candidates: [], cleanContent: content }

  try {
    const jsonStr = match[1].trim()
    const candidates = JSON.parse(jsonStr) as PaperCandidate[]
    // Validate array
    if (!Array.isArray(candidates)) {
      return { candidates: [], cleanContent: content }
    }
    const cleanContent = content.replace(regex, '').trim()
    return { candidates, cleanContent }
  } catch {
    // JSON parse failed — return original content
    return { candidates: [], cleanContent: content }
  }
}
