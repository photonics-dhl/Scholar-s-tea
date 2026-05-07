'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, GraduationCap, Users, MessageSquare, FileText, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils/cn'

type SearchResult = {
  id: string
  type: 'group' | 'discipline' | 'post' | 'publication'
  title: string
  subtitle?: string
  href: string
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 全局搜索弹窗
 * 支持快捷键 / 触发，搜索课题组/学科/帖子/论文
 */
export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const typeIcons = {
    group: Users,
    discipline: GraduationCap,
    post: MessageSquare,
    publication: FileText,
  }

  const typeLabels = {
    group: '课题组',
    discipline: '学科',
    post: '帖子',
    publication: '论文',
  }

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      // Search across multiple endpoints
      const [groupsRes, disciplinesRes, postsRes] = await Promise.all([
        fetch(`/api/v1/groups?search=${encodeURIComponent(searchQuery)}&pageSize=3`),
        fetch(`/api/v1/disciplines`),
        fetch(`/api/v1/posts?search=${encodeURIComponent(searchQuery)}&pageSize=3`).catch(() => null),
      ])

      const searchResults: SearchResult[] = []

      const groupsData = await groupsRes.json()
      if (groupsData.success) {
        searchResults.push(
          ...groupsData.data.map((g: { id: string; name: string; slug: string; institution?: { name: string } }) => ({
            id: g.id,
            type: 'group' as const,
            title: g.name,
            subtitle: g.institution?.name,
            href: `/groups/${g.slug}`,
          }))
        )
      }

      const disciplinesData = await disciplinesRes.json()
      if (disciplinesData.success) {
        const matched = disciplinesData.data.filter((d: { name: string }) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        searchResults.push(
          ...matched.slice(0, 3).map((d: { id: string; name: string; slug: string }) => ({
            id: d.id,
            type: 'discipline' as const,
            title: d.name,
            href: `/disciplines/${d.slug}`,
          }))
        )
      }

      if (postsRes) {
        const postsData = await postsRes.json()
        if (postsData.success) {
          searchResults.push(
            ...postsData.data.map((p: { id: string; title: string; discipline?: { slug: string } }) => ({
              id: p.id,
              type: 'post' as const,
              title: p.title,
              href: p.discipline?.slug
                ? `/disciplines/${p.discipline.slug}/posts/${p.id}`
                : '#',
            }))
          )
        }
      }

      setResults(searchResults.slice(0, 10))
      setSelectedIndex(0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, performSearch])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(results.length, 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        router.push(results[selectedIndex].href)
        onOpenChange(false)
      } else if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, results, selectedIndex, router, onOpenChange])

  // Reset when opening
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">全局搜索</DialogTitle>
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索课题组、学科、帖子..."
              className="border-0 shadow-none focus-visible:ring-0 text-base px-0"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">未找到相关结果</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-0.5 px-2">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type]
                const isSelected = index === selectedIndex

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      router.push(result.href)
                      onOpenChange(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      isSelected
                        ? 'bg-tea-primary/10 text-tea-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isSelected ? 'text-tea-primary' : 'text-muted-foreground'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full flex-shrink-0',
                        isSelected
                          ? 'bg-tea-primary/20 text-tea-primary'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {typeLabels[result.type]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">↑↓</kbd>
              选择
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">Enter</kbd>
              打开
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">Esc</kbd>
            关闭
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
