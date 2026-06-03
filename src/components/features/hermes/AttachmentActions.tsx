'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Download, FolderOpen, Check, AlertCircle, FolderCheck, X, Package, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface Attachment {
  filename: string
  url: string
  downloadUrl: string
}

function parseAttachments(content: string): Attachment[] {
  const attachments: Attachment[] = []
  const regex = /\[ATTACHMENT:([^\]]+)\]/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const filename = match[1].trim()
    attachments.push({
      filename,
      url: `/api/v1/hermes/download?file=${encodeURIComponent(filename)}`,
      downloadUrl: `/api/v1/hermes/download?file=${encodeURIComponent(filename)}&download=1`,
    })
  }
  return attachments
}

interface BatchDownloadPanelProps {
  attachments: Attachment[]
}

function BatchDownloadPanel({ attachments }: BatchDownloadPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [packing, setPacking] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  const toggleFile = (filename: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(filename)) {
        next.delete(filename)
      } else {
        next.add(filename)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === attachments.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(attachments.map((a) => a.filename)))
    }
  }

  const handleBatchDownload = useCallback(async () => {
    if (selected.size === 0) return
    setPacking(true)
    try {
      const response = await fetch('/api/v1/hermes/download/batch-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: Array.from(selected) }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error?.message || `打包失败: ${response.status}`)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `papers_${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err instanceof Error ? err.message : '打包下载失败')
    } finally {
      setPacking(false)
    }
  }, [selected])

  if (attachments.length <= 1) return null

  return (
    <div className="border border-journal-primary/20 rounded-lg bg-journal-primary/[0.03] p-2.5">
      {!panelOpen ? (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 border-journal-primary/30 text-journal-primary hover:bg-journal-primary/10"
          onClick={() => {
            setPanelOpen(true)
            setSelected(new Set(attachments.map((a) => a.filename)))
          }}
        >
          <Package className="w-3.5 h-3.5" />
          打包下载 ({attachments.length})
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={selected.size === attachments.length}
                onChange={toggleAll}
              />
              <span className="text-muted-foreground">
                已选 {selected.size}/{attachments.length}
              </span>
            </label>
            <button
              onClick={() => setPanelOpen(false)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              收起
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {attachments.map((att) => (
              <label
                key={att.filename}
                className="flex items-center gap-1.5 text-xs cursor-pointer px-1 py-0.5 rounded hover:bg-black/5"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={selected.has(att.filename)}
                  onChange={() => toggleFile(att.filename)}
                />
                <span className="truncate flex-1" title={att.filename}>
                  {att.filename}
                </span>
              </label>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 w-full border-journal-primary/30 text-journal-primary hover:bg-journal-primary/10"
            onClick={handleBatchDownload}
            disabled={packing || selected.size === 0}
          >
            {packing ? (
              <>
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                打包中...
              </>
            ) : (
              <>
                <Package className="w-3.5 h-3.5" />
                下载选中 ({selected.size}) 个文件
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

interface AttachmentActionsProps {
  content: string
  className?: string
  /** 自动保存的目标目录句柄（File System Access API） */
  directoryHandle?: FileSystemDirectoryHandle | null
  /** 是否自动保存到目录（首次检测到附件时触发） */
  autoSave?: boolean
  /** 保存成功回调 */
  onSaveSuccess?: (filename: string) => void
  /** 保存失败回调 */
  onSaveError?: (filename: string, error: string) => void
}

export function AttachmentActions({
  content,
  className,
  directoryHandle,
  autoSave = false,
  onSaveSuccess,
  onSaveError,
}: AttachmentActionsProps) {
  const attachments = parseAttachments(content)
  if (attachments.length === 0) return null

  return (
    <div className={cn('space-y-2 mt-2', className)}>
      {attachments.length > 1 && (
        <div className="flex items-center gap-2">
          <BatchDownloadPanel attachments={attachments} />
        </div>
      )}
      {attachments.map((att) => (
        <AttachmentCard
          key={att.filename}
          attachment={att}
          directoryHandle={directoryHandle}
          autoSave={autoSave}
          onSaveSuccess={onSaveSuccess}
          onSaveError={onSaveError}
        />
      ))}
    </div>
  )
}

function AttachmentCard({
  attachment,
  directoryHandle,
  autoSave,
  onSaveSuccess,
  onSaveError,
}: {
  attachment: Attachment
  directoryHandle?: FileSystemDirectoryHandle | null
  autoSave?: boolean
  onSaveSuccess?: (filename: string) => void
  onSaveError?: (filename: string, error: string) => void
}) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoSaveAttempted = useRef(false)

  const isDirectorySupported =
    typeof window !== 'undefined' && 'showDirectoryPicker' in window

  /** 自动保存到已选目录 */
  useEffect(() => {
    if (
      autoSave &&
      directoryHandle &&
      !autoSaveAttempted.current &&
      !saved &&
      !saving
    ) {
      autoSaveAttempted.current = true
      handleAutoSave()
    }
  }, [autoSave, directoryHandle, saved, saving])

  const handleAutoSave = useCallback(async () => {
    if (!directoryHandle) return
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(attachment.url)
      if (!response.ok) throw new Error(`下载失败: ${response.status}`)
      const blob = await response.blob()

      const fileHandle = await (directoryHandle as any).getFileHandle(attachment.filename, {
        create: true,
      })
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()

      setSaved(true)
      setSaving(false)
      onSaveSuccess?.(attachment.filename)
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : '自动保存失败'
      setError(msg)
      setSaving(false)
      onSaveError?.(attachment.filename, msg)
    }
  }, [directoryHandle, attachment, onSaveSuccess, onSaveError])

  /** 手动保存到目录（用户点击按钮） */
  const handleSaveToFolder = useCallback(async () => {
    if (!directoryHandle) return
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(attachment.url)
      if (!response.ok) throw new Error(`下载失败: ${response.status}`)
      const blob = await response.blob()

      const fileHandle = await (directoryHandle as any).getFileHandle(attachment.filename, {
        create: true,
      })
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()

      setSaved(true)
      setSaving(false)
    } catch (err: any) {
      setError(err instanceof Error ? err.message : '保存失败')
      setSaving(false)
    }
  }, [directoryHandle, attachment])

  /** 浏览器下载：优先使用服务器响应头触发下载 */
  const handleBrowserDownload = useCallback(async () => {
    try {
      // 方法1: 直接打开下载链接，让服务器 Content-Disposition 触发下载
      // 这比 blob 方式更可靠，且在某些浏览器中会弹出保存对话框
      const a = document.createElement('a')
      a.href = attachment.downloadUrl
      a.download = attachment.filename
      // 对于跨域或特殊响应头，强制在新标签页打开也会触发下载
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      // fallback: blob 方式
      try {
        const response = await fetch(attachment.downloadUrl)
        if (!response.ok) throw new Error(`下载失败: ${response.status}`)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = attachment.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } catch (err2) {
        window.open(attachment.downloadUrl, '_blank')
      }
    }
  }, [attachment])

  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 p-2.5 border rounded-lg transition-colors',
        saved
          ? 'bg-green-50/80 border-green-200/80'
          : 'bg-gray-50/80 border-gray-200/80'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">📄</span>
        <span className="text-sm font-medium text-gray-800 truncate flex-1" title={attachment.filename}>
          {attachment.filename}
        </span>
        {saved && <FolderCheck className="w-4 h-4 text-green-600 flex-shrink-0" />}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {/* 已保存到本地目录 */}
        {saved && directoryHandle && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 bg-green-50 text-green-700 border-green-200 cursor-default"
            disabled
          >
            <Check className="w-3 h-3" />
            已保存到本地文件夹
          </Button>
        )}

        {/* 保存到已选目录（未保存时显示） */}
        {!saved && directoryHandle && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={handleSaveToFolder}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <FolderOpen className="w-3 h-3" />
                📂 保存到本地文件夹
              </>
            )}
          </Button>
        )}

        {/* 浏览器下载 */}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={handleBrowserDownload}
        >
          <Download className="w-3 h-3" />
          {directoryHandle ? '从服务器下载' : '下载'}
        </Button>

        {/* 预览 */}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() => window.open(attachment.url, '_blank')}
        >
          <span className="text-xs">👁️</span> 预览
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {!isDirectorySupported && !directoryHandle && (
        <div className="text-[10px] text-muted-foreground">
          提示：使用 Chrome/Edge 浏览器可支持「保存到指定文件夹」功能
        </div>
      )}
    </div>
  )
}

/**
 * 文献下载模式的保存设置引导栏
 * 显示在 Workshop paper_download 模式的消息区域上方
 */
export function DownloadDirectoryBanner({
  isSupported,
  directoryName,
  isSelecting,
  savedCount,
  onSelectDirectory,
  onClearDirectory,
}: {
  isSupported: boolean
  directoryName: string | null
  isSelecting: boolean
  savedCount: number
  onSelectDirectory: () => void
  onClearDirectory: () => void
}) {
  if (!isSupported) {
    const isSecure = typeof window !== 'undefined' && window.isSecureContext
    return (
      <div className="shrink-0 mx-4 mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs relative z-10">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {isSecure
              ? '当前浏览器不支持本地文件夹保存功能。下载的论文将暂存在服务器（3天后自动清理），你可以通过附件卡片的「下载」按钮保存到本地。'
              : '当前为 HTTP 连接，本地文件夹保存功能需要 HTTPS 安全连接才能启用。下载的论文将暂存在服务器，你也可以通过附件卡片的「下载」按钮手动保存到本地。'}
          </span>
        </div>
      </div>
    )
  }

  if (directoryName) {
    return (
      <div className="mx-4 mt-3 p-3 rounded-lg bg-green-50 border border-green-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FolderCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-xs text-green-800 truncate">
              保存目录：<span className="font-medium">{directoryName}</span>
              {savedCount > 0 && (
                <span className="ml-1 text-green-600">（已自动保存 {savedCount} 个文件）</span>
              )}
            </span>
          </div>
          <button
            onClick={onClearDirectory}
            className="flex items-center gap-1 text-[11px] text-green-700 hover:text-green-900 px-2 py-1 rounded hover:bg-green-100 transition-colors flex-shrink-0"
          >
            <X className="w-3 h-3" />
            更换目录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-4 mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-xs text-blue-800">
            请先选择本地保存文件夹，下载的论文将自动保存到该目录
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-100 flex-shrink-0"
          onClick={onSelectDirectory}
          disabled={isSelecting}
        >
          {isSelecting ? (
            <>
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              选择中...
            </>
          ) : (
            <>
              <FolderOpen className="w-3 h-3" />
              选择文件夹
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
