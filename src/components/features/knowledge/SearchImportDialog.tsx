'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Search, BookOpen, AlertCircle, Check, Tag, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  KNOWLEDGE_DISCIPLINES,
  KNOWLEDGE_TAG_CATEGORIES,
  getDisciplineLabel,
} from '@/lib/knowledge/categories'

interface SearchPaper {
  id: string
  title: string
  authors: string[]
  year?: number
  abstract: string
  url: string
  venue?: string
  source: string
  citationCount?: number
  suggestedContent: string
}

interface SearchImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const SOURCE_OPTIONS = [
  { value: 'semantic_scholar', label: 'Semantic Scholar' },
  { value: 'arxiv', label: 'arXiv' },
  { value: 'tavily', label: 'Tavily' },
]

export default function SearchImportDialog({ open, onOpenChange, onSuccess }: SearchImportDialogProps) {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(5)
  const [selectedSources, setSelectedSources] = useState<string[]>(['semantic_scholar', 'arxiv'])
  const [searching, setSearching] = useState(false)
  const [papers, setPapers] = useState<SearchPaper[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [importedCount, setImportedCount] = useState(0)

  // Batch classification
  const [batchDiscipline, setBatchDiscipline] = useState('')
  const [batchTags, setBatchTags] = useState<string[]>([])

  const toggleSource = (source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    )
  }

  const toggleTag = (tag: string) => {
    setBatchTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setError('')
    setSearching(true)
    setPapers([])
    setSelectedIds(new Set())
    try {
      const res = await fetch('/api/v1/admin/knowledge/import-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          limit,
          sources: selectedSources.length > 0 ? selectedSources : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPapers(data.data.papers || [])
        if ((data.data.papers || []).length === 0) {
          setError('未找到相关文献，请尝试其他关键词')
        }
      } else {
        setError(data.error?.message || '搜索失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setSearching(false)
    }
  }

  const togglePaper = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleImport = async () => {
    if (selectedIds.size === 0) return
    setImporting(true)
    setImportedCount(0)
    setImportProgress({ current: 0, total: selectedIds.size })

    const toImport = papers.filter((p) => selectedIds.has(p.id))
    let successCount = 0

    // 串行导入，避免 embedding API 限流
    for (let i = 0; i < toImport.length; i++) {
      const paper = toImport[i]
      setImportProgress({ current: i + 1, total: toImport.length })
      try {
        const metadata: Record<string, unknown> = {
          url: paper.url,
          authors: paper.authors,
          year: paper.year,
          venue: paper.venue,
          citationCount: paper.citationCount,
          importedFrom: 'search',
        }
        if (batchTags.length > 0) {
          metadata.tags = batchTags
        }

        const res = await fetch('/api/v1/admin/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: paper.title,
            content: paper.suggestedContent,
            source: paper.source,
            discipline: batchDiscipline || null,
            metadata: JSON.stringify(metadata),
          }),
        })
        const data = await res.json()
        if (data.success) {
          successCount++
          setImportedCount(successCount)
        }
      } catch {
        // 单条失败继续
      }
    }

    setImporting(false)
    if (successCount > 0) {
      onSuccess()
    }
  }

  const handleClose = (val: boolean) => {
    if (!val) {
      setQuery('')
      setPapers([])
      setSelectedIds(new Set())
      setError('')
      setImportedCount(0)
      setImportProgress({ current: 0, total: 0 })
      setBatchDiscipline('')
      setBatchTags([])
    }
    onOpenChange(val)
  }

  const getSourceBadge = (source: string) => {
    const map: Record<string, string> = {
      semantic_scholar: 'S2',
      arxiv: 'arXiv',
      tavily: 'Tavily',
    }
    return map[source] || source
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-journal-primary" />
            搜索并导入学术文献
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Search controls */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="输入研究主题或关键词..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={!query.trim() || searching}>
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Source filters */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">来源：</span>
            {SOURCE_OPTIONS.map((s) => (
              <label key={s.value} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={selectedSources.includes(s.value)}
                  onCheckedChange={() => toggleSource(s.value)}
                />
                <span>{s.label}</span>
              </label>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-muted-foreground">数量：</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm bg-background"
              >
                {[3, 5, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Batch classification (only show when results exist) */}
          {papers.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                批量分类设置（应用于所有选中项）
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">学科</Label>
                  <Select
                    value={batchDiscipline || ' '}
                    onValueChange={(v) => setBatchDiscipline(v === ' ' ? '' : v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="选择学科" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">未选择</SelectItem>
                      {KNOWLEDGE_DISCIPLINES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    标签（点击切换）
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {KNOWLEDGE_TAG_CATEGORIES.slice(0, 3).flatMap((c) => c.tags).slice(0, 12).map((tag) => {
                      const selected = batchTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-1.5 py-0.5 rounded text-[10px] border transition-all ${
                            selected
                              ? 'bg-journal-primary/10 text-journal-primary border-journal-primary/30'
                              : 'bg-background text-muted-foreground border-journal-border/40'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              {batchTags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">已选：</span>
                  {batchTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] cursor-pointer gap-0.5"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                      <X className="h-2.5 w-2.5" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {papers.length > 0 && (
            <>
              <div className="text-sm text-muted-foreground flex items-center justify-between">
                <span>找到 {papers.length} 条结果</span>
                <span>已选 {selectedIds.size} 条</span>
              </div>

              <ScrollArea className="h-[360px] border rounded-lg">
                <div className="p-3 space-y-3">
                  {papers.map((paper) => (
                    <div
                      key={paper.id}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedIds.has(paper.id)
                          ? 'border-journal-primary bg-journal-primary/5'
                          : 'border-border hover:border-journal-primary/30'
                      }`}
                      onClick={() => togglePaper(paper.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.has(paper.id)}
                          onCheckedChange={() => togglePaper(paper.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{paper.title}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {getSourceBadge(paper.source)}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {paper.authors.length > 0 &&
                              `${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ' et al.' : ''}`}
                            {paper.year && ` · ${paper.year}`}
                            {paper.venue && ` · ${paper.venue}`}
                            {paper.citationCount !== undefined && ` · 被引 ${paper.citationCount} 次`}
                          </div>
                          {paper.abstract && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                              {paper.abstract}
                            </p>
                          )}
                          {/* Show batch classification preview */}
                          {(batchDiscipline || batchTags.length > 0) && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {batchDiscipline && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-journal-border/40"
                                >
                                  {getDisciplineLabel(batchDiscipline)}
                                </Badge>
                              )}
                              {batchTags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-tea-primary/10 text-tea-primary-dark border border-tea-primary/20"
                                >
                                  {tag}
                                </span>
                              ))}
                              {batchTags.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{batchTags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Import progress */}
          {importing && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-journal-primary" />
                <span>
                  正在导入... ({importProgress.current} / {importProgress.total})
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-journal-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      importProgress.total > 0
                        ? (importProgress.current / importProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                串行生成 embedding 并入库，避免 API 限流
              </p>
            </div>
          )}

          {importedCount > 0 && !importing && (
            <Alert className="bg-journal-primary/5 border-journal-primary/20 text-sm">
              <Check className="h-4 w-4 text-journal-primary" />
              <AlertDescription>成功导入 {importedCount} 篇文献到知识库</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>
            关闭
          </Button>
          {papers.length > 0 && selectedIds.size > 0 && !importing && importedCount === 0 && (
            <Button onClick={handleImport} disabled={selectedIds.size === 0}>
              导入选中 ({selectedIds.size})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
