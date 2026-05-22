'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Brain,
  Loader2,
  FileText,
  Tag,
  X,
  Lightbulb,
  BookOpen,
  MessageSquare,
  HelpCircle,
  StickyNote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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

interface ResearchMemory {
  id: string
  type: string
  title: string
  content: string
  summary: string | null
  discipline: string | null
  relatedPaper: string | null
  tags: string[]
  createdAt: string
}

interface MemoryForm {
  type: string
  title: string
  content: string
  summary: string
  discipline: string
  relatedPaper: string
  tags: string
}

const typeConfig: Record<string, { label: string; icon: typeof Lightbulb; color: string }> = {
  IDEA: { label: '研究想法', icon: Lightbulb, color: 'bg-amber-100 text-amber-800' },
  PAPER_SUMMARY: { label: '论文摘要', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  DISCUSSION: { label: '讨论记录', icon: MessageSquare, color: 'bg-green-100 text-green-800' },
  QUESTION: { label: '问题记录', icon: HelpCircle, color: 'bg-purple-100 text-purple-800' },
  NOTES: { label: '笔记', icon: StickyNote, color: 'bg-gray-100 text-gray-800' },
}

export default function AdminResearchMemoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [memories, setMemories] = useState<ResearchMemory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [typeFilter, setTypeFilter] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MemoryForm>({
    type: 'IDEA',
    title: '',
    content: '',
    summary: '',
    discipline: '',
    relatedPaper: '',
    tags: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/')
    }
  }, [session, status, router])

  const fetchMemories = useCallback(async (pageNum = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '20',
      })
      if (typeFilter) params.set('type', typeFilter)

      const res = await fetch(`/api/v1/admin/research-memory?${params}`)
      const data = await res.json()

      if (data.success) {
        setMemories(data.data.memories)
        setTotalPages(data.data.meta.totalPages)
        setTotal(data.data.meta.total)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchMemories()
    }
  }, [session, fetchMemories])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      type: 'IDEA',
      title: '',
      content: '',
      summary: '',
      discipline: '',
      relatedPaper: '',
      tags: '',
    })
    setDialogOpen(true)
  }

  const openEdit = (memory: ResearchMemory) => {
    setEditingId(memory.id)
    setForm({
      type: memory.type,
      title: memory.title,
      content: memory.content,
      summary: memory.summary || '',
      discipline: memory.discipline || '',
      relatedPaper: memory.relatedPaper || '',
      tags: memory.tags.join(', '),
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return

    setSubmitting(true)
    try {
      const url = editingId
        ? `/api/v1/admin/research-memory/${editingId}`
        : '/api/v1/admin/research-memory'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          content: form.content,
          summary: form.summary || null,
          discipline: form.discipline || null,
          relatedPaper: form.relatedPaper || null,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()
      if (data.success) {
        setDialogOpen(false)
        fetchMemories(page)
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该研究记忆？此操作不可恢复。')) return

    try {
      const res = await fetch(`/api/v1/admin/research-memory/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchMemories(page)
      }
    } catch {
      // ignore
    }
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
            <Brain className="h-6 w-6 text-convo-blue" />
            研究记忆管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {total} 条研究记忆
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新建记忆
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); fetchMemories(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部类型</SelectItem>
            <SelectItem value="IDEA">研究想法</SelectItem>
            <SelectItem value="PAPER_SUMMARY">论文摘要</SelectItem>
            <SelectItem value="DISCUSSION">讨论记录</SelectItem>
            <SelectItem value="QUESTION">问题记录</SelectItem>
            <SelectItem value="NOTES">笔记</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground border-dashed">
          <Brain className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>暂无研究记忆</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memories.map((memory) => {
              const config = typeConfig[memory.type] || typeConfig.NOTES
              const Icon = config.icon

              return (
                <Card key={memory.id} className="border-border/50 hover:border-convo-blue/30 transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate" title={memory.title}>
                            {memory.title}
                          </h3>
                          <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {memory.summary || memory.content.slice(0, 100)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {memory.discipline && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {memory.discipline}
                            </span>
                          )}
                          {memory.tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              {memory.tags.slice(0, 3).map((t) => (
                                <span key={t} className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                  {t}
                                </span>
                              ))}
                            </span>
                          )}
                          <span className="ml-auto">
                            {new Date(memory.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => openEdit(memory)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDelete(memory.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => {
                  const newPage = page - 1
                  setPage(newPage)
                  fetchMemories(newPage)
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
                  fetchMemories(newPage)
                }}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑研究记忆' : '新建研究记忆'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">类型 *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger id="type" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDEA">研究想法</SelectItem>
                    <SelectItem value="PAPER_SUMMARY">论文摘要</SelectItem>
                    <SelectItem value="DISCUSSION">讨论记录</SelectItem>
                    <SelectItem value="QUESTION">问题记录</SelectItem>
                    <SelectItem value="NOTES">笔记</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discipline">学科</Label>
                <Input
                  id="discipline"
                  value={form.discipline}
                  onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                  placeholder="如: physics"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="输入标题"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="summary">摘要</Label>
              <Input
                id="summary"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="简短摘要（可选）"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="content">内容 *</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="输入详细内容"
                className="mt-1.5 min-h-[150px]"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="relatedPaper">关联论文</Label>
                <Input
                  id="relatedPaper"
                  value={form.relatedPaper}
                  onChange={(e) => setForm({ ...form, relatedPaper: e.target.value })}
                  placeholder="论文 ID 或 DOI"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="tags">标签</Label>
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="用逗号分隔"
                  className="mt-1.5"
                />
              </div>
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
