'use client'

import { useState, useEffect, useCallback } from 'react'
import { Brain, Plus, X, Trash2, ChevronDown, ChevronUp, Loader2, Lightbulb, BookOpen, MessageSquare, HelpCircle, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'
import type { ResearchMemory, MemoryType } from '@/lib/research-memory/types'
import { getAllMemories, saveMemory, deleteMemory } from '@/lib/research-memory/storage'
import { embedMemory } from '@/lib/research-memory/search'

const typeConfig: Record<MemoryType, { label: string; icon: typeof Lightbulb; color: string }> = {
  IDEA: { label: '想法', icon: Lightbulb, color: 'bg-amber-100 text-amber-800' },
  PAPER_SUMMARY: { label: '论文', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  DISCUSSION: { label: '讨论', icon: MessageSquare, color: 'bg-green-100 text-green-800' },
  QUESTION: { label: '问题', icon: HelpCircle, color: 'bg-purple-100 text-purple-800' },
  NOTES: { label: '笔记', icon: StickyNote, color: 'bg-gray-100 text-gray-800' },
}

export function ResearchMemoryPanel() {
  const [memories, setMemories] = useState<ResearchMemory[]>([])
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    type: 'IDEA' as MemoryType,
    title: '',
    content: '',
  })

  const loadMemories = useCallback(async () => {
    try {
      const all = await getAllMemories()
      setMemories(all.sort((a, b) => b.updatedAt - a.updatedAt))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      const memory: ResearchMemory = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: form.type,
        title: form.title.trim(),
        content: form.content.trim(),
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await embedMemory(memory)
      await loadMemories()
      setForm({ type: 'IDEA', title: '', content: '' })
      setAdding(false)
    } catch (err) {
      console.error('[ResearchMemory] Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMemory(id)
      await loadMemories()
    } catch {
      // ignore
    }
  }

  return (
    <div className="border-t border-border/40 bg-muted/30">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5" />
          <span>研究笔记</span>
          {memories.length > 0 && (
            <span className="bg-convo-blue/10 text-convo-blue px-1.5 py-0.5 rounded text-[10px]">
              {memories.length}
            </span>
          )}
        </div>
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2 max-h-64 overflow-y-auto">
          {/* Add form */}
          {adding ? (
            <div className="space-y-2 p-2 rounded-lg bg-background border border-border/50">
              <div className="flex items-center gap-2">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as MemoryType })}
                  className="text-xs h-7 rounded border border-border bg-background px-2"
                >
                  <option value="IDEA">想法</option>
                  <option value="PAPER_SUMMARY">论文</option>
                  <option value="DISCUSSION">讨论</option>
                  <option value="QUESTION">问题</option>
                  <option value="NOTES">笔记</option>
                </select>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="标题"
                  className="h-7 text-xs flex-1"
                />
                <button onClick={() => setAdding(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="记录你的研究想法、笔记..."
                className="text-xs min-h-[60px] resize-none"
              />
              <div className="flex justify-end gap-1.5">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}>
                  取消
                </Button>
                <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  保存
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-3 w-3" />
              添加笔记
            </Button>
          )}

          {/* Memory list */}
          {memories.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              暂无研究笔记。添加笔记后，AI 会在对话中自动引用相关内容。
            </p>
          ) : (
            <div className="space-y-1.5">
              {memories.map((mem) => {
                const cfg = typeConfig[mem.type]
                const Icon = cfg.icon
                return (
                  <div
                    key={mem.id}
                    className="group flex items-start gap-2 p-2 rounded-md bg-background border border-border/40 hover:border-border/80 transition-colors"
                  >
                    <div className={cn('shrink-0 mt-0.5 size-5 rounded flex items-center justify-center', cfg.color)}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{mem.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{mem.content}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(mem.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                      title="删除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
