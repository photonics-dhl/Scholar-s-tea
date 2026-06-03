'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Upload,
  Trash2,
  FileText,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Database,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import { usePersonalKB } from '@/hooks/usePersonalKB'
import type { PersonalDocumentMeta, LocalDocument } from '@/lib/personal-kb'
import { estimateTokens } from '@/lib/personal-kb/chunker'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function PersonalKBPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const {
    docs,
    loading,
    uploading,
    uploadStage,
    uploadStageMessage,
    error,
    storageUsage,
    uploadDocument,
    deleteDocument,
    updateMeta,
    getLocalDoc,
  } = usePersonalKB()

  const [selectedDoc, setSelectedDoc] = useState<PersonalDocumentMeta | null>(null)
  const [localDoc, setLocalDoc] = useState<LocalDocument | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [uploadProgress, setUploadProgress] = useState<string>('')

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]

      // 前端文件大小预检
      const MAX_FILE_SIZE = 10 * 1024 * 1024
      if (file.size > MAX_FILE_SIZE) {
        alert(`文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，请上传不超过 10MB 的文件`)
        return
      }

      const result = await uploadDocument(file)
      if (result.success && result.meta) {
        setSelectedDoc(result.meta)
        if (result.localDoc) {
          setLocalDoc(result.localDoc)
        }
      }
    },
    [uploadDocument]
  )

  // 同步 uploadStage 到本地显示
  useEffect(() => {
    if (uploadStageMessage) {
      setUploadProgress(uploadStageMessage)
    } else if (uploading) {
      setUploadProgress('处理中...')
    } else {
      setUploadProgress('')
    }
  }, [uploadStage, uploadStageMessage, uploading])

  const handleSelectDoc = useCallback(
    async (doc: PersonalDocumentMeta) => {
      setSelectedDoc(doc)
      const local = await getLocalDoc(doc.id)
      setLocalDoc(local)
    },
    [getLocalDoc]
  )

  const handleDelete = useCallback(
    async (docId: string) => {
      await deleteDocument(docId)
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null)
        setLocalDoc(null)
      }
      setDeleteConfirm(null)
    },
    [deleteDocument, selectedDoc]
  )

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user) {
    router.push('/signin')
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              私人知识库
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              文献全文仅存储在当前浏览器中，不会同步到其他设备
            </p>
          </div>
          <div className="flex items-center gap-4">
            {storageUsage && (
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Database className="h-4 w-4" />
                {storageUsage.docCount} 篇 / {formatBytes(storageUsage.estimatedBytes)}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
              <Settings className="h-4 w-4 mr-1.5" />
              配置
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <Card
        className={cn(
          'mb-6 border-dashed transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFileUpload(e.dataTransfer.files)
        }}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">拖拽 PDF 或 TXT 文件到此处</p>
            <p className="text-xs text-muted-foreground mb-1">或点击选择文件</p>
            <p className="text-xs text-muted-foreground/70 mb-3">支持 PDF、TXT、Markdown，单个文件不超过 10MB</p>
            <input
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              id="file-upload"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  {uploadProgress || '处理中...'}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-1.5" />
                  选择文件
                </>
              )}
            </Button>
            {uploading && uploadStage === 'enhancing' && (
              <p className="text-xs text-amber-600 mt-2 max-w-xs">
                检测到复杂公式/乱码，正在使用本地 AI 模型增强提取。首次运行可能需要 10+ 分钟（模型加载），请耐心等待...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">文献列表</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : docs.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  暂无文献，请上传 PDF 或 TXT 文件
                </div>
              ) : (
                <div className="divide-y">
                  {docs.map((doc) => (
                    <button
                      key={doc.id}
                      className={cn(
                        'w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-center justify-between',
                        selectedDoc?.id === doc.id && 'bg-muted'
                      )}
                      onClick={() => handleSelectDoc(doc)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.chunkCount} 个段落
                          {doc.pageCount ? ` · ${doc.pageCount} 页` : ''}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Document Detail */}
        <div className="lg:col-span-2">
          {selectedDoc ? (
            <DocumentDetail
              doc={selectedDoc}
              localDoc={localDoc}
              onUpdate={(updates) => updateMeta(selectedDoc.id, updates)}
              onDelete={() => setDeleteConfirm(selectedDoc.id)}
            />
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[300px]">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">选择左侧文献查看详情</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">确认删除</h3>
              <p className="text-sm text-muted-foreground mb-4">
                此操作将永久删除该文献的本地全文和服务器元数据，无法恢复。
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                  取消
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(deleteConfirm)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ===== Document Detail Component =====

interface DocumentDetailProps {
  doc: PersonalDocumentMeta
  localDoc: LocalDocument | null
  onUpdate: (updates: Partial<PersonalDocumentMeta>) => void
  onDelete: () => void
}

function DocumentDetail({ doc, localDoc, onUpdate, onDelete }: DocumentDetailProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: doc.title,
    authors: doc.authors?.join(', ') || '',
    year: doc.year?.toString() || '',
    journal: doc.journal || '',
    doi: doc.doi || '',
  })
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set())

  const handleSave = () => {
    onUpdate({
      title: form.title,
      authors: form.authors.split(',').map((a) => a.trim()).filter(Boolean),
      year: form.year ? parseInt(form.year) : undefined,
      journal: form.journal || undefined,
      doi: form.doi || undefined,
    })
    setEditing(false)
  }

  return (
    <div className="space-y-4">
      {/* Meta Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">文献信息</CardTitle>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    取消
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    保存
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  编辑
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {editing ? (
            <>
              <div>
                <label className="text-xs text-muted-foreground">标题</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-input bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">作者（逗号分隔）</label>
                  <input
                    value={form.authors}
                    onChange={(e) => setForm((f) => ({ ...f, authors: e.target.value }))}
                    className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">年份</label>
                  <input
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                    className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-input bg-background"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">期刊</label>
                  <input
                    value={form.journal}
                    onChange={(e) => setForm((f) => ({ ...f, journal: e.target.value }))}
                    className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">DOI</label>
                  <input
                    value={form.doi}
                    onChange={(e) => setForm((f) => ({ ...f, doi: e.target.value }))}
                    className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-input bg-background"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-medium">{doc.title}</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                {doc.authors && doc.authors.length > 0 && (
                  <p>作者：{doc.authors.join(', ')}</p>
                )}
                <div className="flex flex-wrap gap-x-4">
                  {doc.year && <span>年份：{doc.year}</span>}
                  {doc.journal && <span>期刊：{doc.journal}</span>}
                  {doc.doi && <span>DOI：{doc.doi}</span>}
                </div>
                <p>
                  {doc.chunkCount} 个段落
                  {doc.pageCount ? ` · ${doc.pageCount} 页` : ''}
                  {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ''}
                </p>
              </div>
              {/* 文本质量警告 */}
              {localDoc?.quality?.hasFormulaWarning && (
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium">检测到公式或特殊字符，自动提取可能不准确</p>
                      <p>
                        数学字符占比 {(localDoc.quality.mathCharRatio * 100).toFixed(1)}%，
                        乱码/替换字符占比 {(localDoc.quality.corruptedCharRatio * 100).toFixed(1)}%。
                        建议手动检查提取内容，或粘贴文本版（Markdown/LaTeX）替代 PDF。
                      </p>
                      {localDoc.quality.mathFonts.length > 0 && (
                        <p className="text-amber-700/70">
                          检测到的数学字体：{localDoc.quality.mathFonts.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Chunks Card */}
      {localDoc && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">段落分块（{localDoc.chunks.length} 个）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {localDoc.chunks.map((chunk, i) => (
              <div
                key={chunk.id}
                className="border rounded-lg overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => {
                    setExpandedChunks((prev) => {
                      const next = new Set(prev)
                      if (next.has(chunk.id)) next.delete(chunk.id)
                      else next.add(chunk.id)
                      return next
                    })
                  }}
                >
                  <span className="text-sm font-medium">段落 {i + 1}</span>
                  <span className="text-xs text-muted-foreground">
                    {estimateTokens(chunk.text)} tokens
                  </span>
                </button>
                {expandedChunks.has(chunk.id) && (
                  <div className="px-3 pb-3">
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {chunk.text}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1.5" />
          删除文献
        </Button>
      </div>
    </div>
  )
}
