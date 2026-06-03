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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Link2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Tag,
  X,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  KNOWLEDGE_DISCIPLINES,
  KNOWLEDGE_TAG_CATEGORIES,
  getDisciplineLabel,
} from '@/lib/knowledge/categories'

interface ParsedResult {
  title: string
  content: string
  metadata: {
    url: string
    authors?: string
    year?: string
    discipline?: string
    tags?: string[]
  }
  source: string
  discipline?: string | null
}

interface UrlImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function UrlImportDialog({ open, onOpenChange, onSuccess }: UrlImportDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [url, setUrl] = useState('')
  const [discipline, setDiscipline] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedResult | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Editable preview state
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const handleParse = async () => {
    if (!url.trim()) return
    setError('')
    setParsing(true)
    try {
      const res = await fetch('/api/v1/admin/knowledge/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), discipline: discipline || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        setParsed(data.data)
        setEditTitle(data.data.title)
        setEditContent(data.data.content)
        // 使用 AI 推断的分类或用户预设的
        setDiscipline(data.data.metadata?.discipline || discipline)
        setTags(data.data.metadata?.tags || [])
        setStep(2)
      } else {
        setError(data.error?.message || '解析失败')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = async () => {
    if (!editTitle.trim() || !editContent.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/admin/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
          source: parsed?.source || 'webpage',
          discipline: discipline || null,
          metadata: JSON.stringify({
            ...(parsed?.metadata || { url: url.trim() }),
            discipline: discipline || undefined,
            tags: tags.length > 0 ? tags : undefined,
          }),
        }),
      })
      const data = await res.json()
      if (data.success) {
        onOpenChange(false)
        resetState()
        onSuccess()
      } else {
        setError(data.error?.message || '入库失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setSubmitting(false)
    }
  }

  const resetState = () => {
    setStep(1)
    setUrl('')
    setDiscipline('')
    setTags([])
    setParsed(null)
    setError('')
    setEditTitle('')
    setEditContent('')
  }

  const handleClose = (val: boolean) => {
    if (!val) resetState()
    onOpenChange(val)
  }

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-journal-primary" />
            {step === 1 ? '从 URL 导入知识卡片' : '预览并确认'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>网页/文献链接</Label>
              <Input
                placeholder="https://arxiv.org/abs/... 或 https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                支持任意网页链接。系统将自动抓取内容并生成结构化摘要。
              </p>
            </div>

            <div className="space-y-2">
              <Label>学科领域（可选，AI 将自动推断）</Label>
              <Select value={discipline} onValueChange={setDiscipline}>
                <SelectTrigger>
                  <SelectValue placeholder="选择学科" />
                </SelectTrigger>
                <SelectContent>
                  {KNOWLEDGE_DISCIPLINES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>

            {parsed?.metadata?.authors && (
              <div className="text-xs text-muted-foreground">
                作者：{parsed.metadata.authors}
                {parsed.metadata.year && ` · ${parsed.metadata.year}`}
              </div>
            )}

            {/* AI 推断的学科（可编辑） */}
            <div className="space-y-2">
              <Label>学科</Label>
              <Select value={discipline || ' '} onValueChange={(v) => setDiscipline(v === ' ' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择学科">
                    {discipline ? getDisciplineLabel(discipline) : '未选择'}
                  </SelectValue>
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
              {parsed?.metadata?.discipline && parsed.metadata.discipline !== discipline && (
                <p className="text-xs text-muted-foreground">
                  AI 推断：{getDisciplineLabel(parsed.metadata.discipline)}
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                标签（点击切换）
              </Label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {KNOWLEDGE_TAG_CATEGORIES.map((cat) => (
                  <div key={cat.category}>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {cat.category}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cat.tags.map((tag) => {
                        const selected = tags.includes(tag)
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-2 py-0.5 rounded-full text-[11px] border transition-all duration-150 ${
                              selected
                                ? 'bg-journal-primary/10 text-journal-primary border-journal-primary/30'
                                : 'bg-background text-muted-foreground border-journal-border/40 hover:border-journal-primary/30'
                            }`}
                          >
                            {tag}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">已选：</span>
                  {tags.map((tag) => (
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

            <div className="space-y-2">
              <Label>结构化摘要（可编辑）</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                以上为 AI 自动生成的结构化摘要。请检查并编辑后确认入库。
                原文链接：{parsed?.metadata?.url}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} disabled={submitting}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          )}
          {step === 1 ? (
            <Button onClick={handleParse} disabled={!url.trim() || parsing}>
              {parsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  解析中...
                </>
              ) : (
                <>
                  解析并生成摘要
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !editTitle.trim() || !editContent.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  入库中...
                </>
              ) : (
                '确认入库'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
