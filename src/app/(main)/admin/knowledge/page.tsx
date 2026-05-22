'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  Database,
  Loader2,
  AlertCircle,
  FileText,
  Tag,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface KnowledgeDoc {
  id: string
  title: string
  source: string | null
  discipline: string | null
  createdAt: string
}

interface DocForm {
  title: string
  content: string
  source: string
  discipline: string
}

export default function AdminKnowledgePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DocForm>({ title: '', content: '', source: '', discipline: '' })
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [reindexingId, setReindexingId] = useState<string | null>(null)

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/knowledge')
    }
  }, [session, status, router])

  const fetchDocs = useCallback(async (searchTerm = '', pageNum = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '20',
      })
      if (searchTerm) params.set('search', searchTerm)

      const res = await fetch(`/api/v1/knowledge?${params}`)
      const data = await res.json()

      if (data.success) {
        setDocs(data.data)
        setTotalPages(data.meta.totalPages)
        setTotal(data.meta.total)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchDocs()
    }
  }, [session, fetchDocs])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchDocs(search, 1)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ title: '', content: '', source: '', discipline: '' })
    setDialogOpen(true)
  }

  const openEdit = (doc: KnowledgeDoc) => {
    setEditingId(doc.id)
    setForm({
      title: doc.title,
      content: '', // Will fetch full content
      source: doc.source || '',
      discipline: doc.discipline || '',
    })
    // Fetch full document for editing
    fetch(`/api/v1/knowledge/${doc.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setForm({
            title: data.data.title,
            content: data.data.content,
            source: data.data.source || '',
            discipline: data.data.discipline || '',
          })
        }
      })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return

    setSubmitting(true)
    try {
      const url = editingId
        ? `/api/v1/admin/knowledge/${editingId}`
        : '/api/v1/admin/knowledge'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          source: form.source || null,
          discipline: form.discipline || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setDialogOpen(false)
        fetchDocs(search, page)
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该知识文档？此操作不可恢复。')) return

    try {
      const res = await fetch(`/api/v1/admin/knowledge/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchDocs(search, page)
      }
    } catch {
      // ignore
    }
  }

  const handleReindex = async (id: string) => {
    setReindexingId(id)
    try {
      const res = await fetch(`/api/v1/admin/knowledge/${id}/reindex`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert(`Embedding 重新生成成功，维度: ${data.data.embeddingLength}`)
      } else {
        alert(data.error?.message || 'Embedding 生成失败')
      }
    } catch {
      alert('网络错误')
    } finally {
      setReindexingId(null)
    }
  }

  const getSourceLabel = (source: string | null) => {
    const labels: Record<string, string> = {
      paper: '论文', post: '帖子', news: '新闻',
      publication: '论文', wiki: '百科', manual: '手册',
    }
    return labels[source || ''] || source || '文档'
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-journal-primary" />
            知识库管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {total} 篇知识文档
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新建文档
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索文档标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="outline">搜索</Button>
      </form>

      {/* Table */}
      <Card className="border-journal-border/40">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : docs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>暂无知识文档</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">标题</th>
                    <th className="text-left px-4 py-3 font-medium w-24">来源</th>
                    <th className="text-left px-4 py-3 font-medium w-28">学科</th>
                    <th className="text-left px-4 py-3 font-medium w-32">创建时间</th>
                    <th className="text-right px-4 py-3 font-medium w-36">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium truncate max-w-[300px] block" title={doc.title}>
                          {doc.title}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {getSourceLabel(doc.source)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {doc.discipline ? (
                          <Badge variant="outline" className="text-[10px]">
                            <Tag className="h-3 w-3 mr-1" />
                            {doc.discipline}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(doc.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleReindex(doc.id)}
                            disabled={reindexingId === doc.id}
                            title="重新生成 Embedding"
                          >
                            {reindexingId === doc.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(doc)}
                            title="编辑"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(doc.id)}
                            title="删除"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-3 p-4 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => {
                  const newPage = page - 1
                  setPage(newPage)
                  fetchDocs(search, newPage)
                }}
              >
                上一页
              </Button>
              <span className="px-4 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{page}</span> / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => {
                  const newPage = page + 1
                  setPage(newPage)
                  fetchDocs(search, newPage)
                }}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑文档' : '新建文档'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="输入文档标题"
                className="mt-1.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source">来源</Label>
                <Select
                  value={form.source}
                  onValueChange={(v) => setForm({ ...form, source: v })}
                >
                  <SelectTrigger id="source" className="mt-1.5">
                    <SelectValue placeholder="选择来源" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paper">论文</SelectItem>
                    <SelectItem value="post">帖子</SelectItem>
                    <SelectItem value="news">新闻</SelectItem>
                    <SelectItem value="wiki">百科</SelectItem>
                    <SelectItem value="manual">手册</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discipline">学科</Label>
                <Input
                  id="discipline"
                  value={form.discipline}
                  onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                  placeholder="如: physics, cs"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="content">内容 *</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="输入文档内容（支持 Markdown）"
                className="mt-1.5 min-h-[200px]"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
