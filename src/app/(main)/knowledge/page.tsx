'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Database,
  Search,
  BookOpen,
  ExternalLink,
  FileText,
  ArrowRight,
  Settings,
  ChevronRight,
  Layers,
  Globe,
  MessageSquare,
  Newspaper,
  Bookmark,
  Clock,
  Sparkles,
  TrendingUp,
  Flame,
  ScrollText,
  Eye,
  Check,
  ChevronDown,
  Grid3X3,
  List,
  ArrowUpDown,
  ChevronUp,
  Loader2,
  Tag,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  KNOWLEDGE_DISCIPLINES,
  getDisciplineLabel,
  getSourceLabel,
  getSubDisciplineLabel,
  DISCIPLINE_ZONE_BORDERS,
  DISCIPLINE_HEADER_TEXTS,
  DISCIPLINE_ICON_BGS,
  DISCIPLINE_BADGE_STYLES,
} from '@/lib/knowledge/categories'
import {
  isNew,
  formatDate,
  estimateReadingTime,
  getSourceVisual,
  type SourceVisual,
} from '@/lib/knowledge/utils'
import { useReadingHistory } from '@/hooks/use-reading-history'
import { QuickLinksPanel } from '@/components/features/knowledge/QuickLinksPanel'
import { TrendingPanel } from '@/components/features/knowledge/TrendingPanel'
import { TagCloud } from '@/components/features/knowledge/TagCloud'
import { RecommendedReading } from '@/components/features/knowledge/RecommendedReading'

// ============================================
// Types
// ============================================
interface KnowledgeDoc {
  id: string
  title: string
  source: string | null
  discipline: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  viewCount: number
  contentPreview: string
}

interface KnowledgeResponse {
  success: boolean
  data: KnowledgeDoc[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
  stats?: { disciplineDistribution: Record<string, number> }
}

type SortField = 'createdAt' | 'viewCount' | 'title'
type SortDir = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

// ============================================
// Helpers
// ============================================

const SourceIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Globe,
  BookOpen,
  Search,
  MessageSquare,
  Newspaper,
  Bookmark,
  ScrollText,
}

function SourceBadge({ source }: { source: string | null }) {
  const visual = getSourceVisual(source)
  const Icon = SourceIconMap[visual.icon] || FileText
  const label = getSourceLabel(source)
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${visual.bg} ${visual.color} border ${visual.border}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

function groupByDiscipline(docs: KnowledgeDoc[]) {
  const grouped: Record<string, KnowledgeDoc[]> = {}
  const keys: string[] = []
  for (const d of KNOWLEDGE_DISCIPLINES) keys.push(d.value)
  keys.push('__uncategorized')
  for (const doc of docs) {
    const key = doc.discipline || '__uncategorized'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(doc)
  }
  const filtered = keys.filter((k) => grouped[k] && grouped[k].length > 0)
  return { grouped, orderedKeys: filtered }
}

// ============================================
// Main Page
// ============================================
export default function KnowledgePage() {
  const { data: session } = useSession()
  const router = useRouter()

  // Data states
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [disciplineStats, setDisciplineStats] = useState<Record<string, number>>({})
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())

  // Filter / search states
  const [search, setSearch] = useState('')
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [suggestions, setSuggestions] = useState<KnowledgeDoc[]>([])
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Pagination states
  const [page, setPage] = useState(1)
  const pageSize = 48
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // View states
  const [sortBy, setSortBy] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortDir>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [expandedDocCounts, setExpandedDocCounts] = useState<Record<string, boolean>>({})

  const { history, isVisited } = useReadingHistory()

  // ============================================
  // Fetch documents
  // ============================================
  const fetchDocuments = useCallback(
    async (
      opts: {
        searchTerm?: string
        discipline?: string | null
        tag?: string | null
        bookmarksOnly?: boolean
        pageNum?: number
        append?: boolean
        sortField?: SortField
        sortDir?: SortDir
      } = {}
    ) => {
      const {
        searchTerm = '',
        discipline = activeDiscipline,
        tag = activeTag,
        bookmarksOnly = showBookmarksOnly,
        pageNum = 1,
        append = false,
        sortField = sortBy,
        sortDir = sortOrder,
      } = opts

      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      try {
        if (bookmarksOnly && session?.user) {
          const res = await fetch('/api/v1/knowledge/bookmarks')
          const data = await res.json()
          if (data.success) {
            setDocuments(data.data)
            setBookmarkedIds(new Set(data.data.map((d: KnowledgeDoc) => d.id)))
            setTotalPages(1)
            setHasMore(false)
          }
        } else {
          // When a discipline or tag is selected, load all (usually small set)
          // Otherwise paginate
          const usePagination = !discipline && !tag && !searchTerm
          const params = new URLSearchParams({
            page: String(pageNum),
            pageSize: usePagination ? String(pageSize) : '0',
            stats: pageNum === 1 && !append ? 'true' : 'false',
            sortBy: sortField,
            sortOrder: sortDir,
          })
          if (searchTerm) params.set('search', searchTerm)
          if (discipline) params.set('discipline', discipline)
          if (tag) params.set('tags', tag)

          const res = await fetch('/api/v1/knowledge?' + params)
          const data: KnowledgeResponse = await res.json()
          if (data.success) {
            if (append) {
              setDocuments((prev) => [...prev, ...data.data])
            } else {
              setDocuments(data.data)
            }
            setTotalPages(data.meta.totalPages)
            setHasMore(pageNum < data.meta.totalPages)
            if (pageNum === 1 && data.stats?.disciplineDistribution) {
              setDisciplineStats(data.stats.disciplineDistribution)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch knowledge documents:', error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [session, activeDiscipline, activeTag, showBookmarksOnly, sortBy, sortOrder]
  )

  // Initial load
  useEffect(() => {
    fetchDocuments({ pageNum: 1 })
  }, [fetchDocuments])

  // Fetch bookmarks
  useEffect(() => {
    if (!session?.user) {
      setBookmarkedIds(new Set())
      return
    }
    fetch('/api/v1/knowledge/bookmarks')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBookmarkedIds(new Set(data.data.map((d: KnowledgeDoc) => d.id)))
        }
      })
      .catch(() => {})
  }, [session])

  // ============================================
  // Handlers
  // ============================================
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    setActiveSuggestion(-1)
    setPage(1)
    fetchDocuments({ searchTerm: search, pageNum: 1 })
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchDocuments({ searchTerm: search, pageNum: nextPage, append: true })
  }

  const handleSortChange = (field: SortField, dir: SortDir) => {
    setSortBy(field)
    setSortOrder(dir)
    setPage(1)
    fetchDocuments({ searchTerm: search, discipline: activeDiscipline, pageNum: 1, sortField: field, sortDir: dir })
  }

  // Compute suggestions from loaded documents
  useEffect(() => {
    if (search.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const term = search.toLowerCase().trim()
    const scored = documents
      .map((doc) => {
        let score = 0
        const title = doc.title.toLowerCase()
        const tags = getDocTags(doc).join(' ').toLowerCase()
        const discipline = (doc.discipline || '').toLowerCase()
        const sub = (getDocSubDiscipline(doc) || '').toLowerCase()

        if (title.startsWith(term)) score += 10
        else if (title.includes(term)) score += 5
        if (tags.includes(term)) score += 3
        if (discipline.includes(term)) score += 2
        if (sub.includes(term)) score += 2

        return { doc, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.doc)

    setSuggestions(scored)
    setShowSuggestions(scored.length > 0)
    setActiveSuggestion(-1)
  }, [search, documents])

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestion((prev) => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestion((prev) => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault()
      const doc = suggestions[activeSuggestion]
      if (doc) {
        setShowSuggestions(false)
        router.push(`/knowledge/${doc.id}`)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveSuggestion(-1)
    }
  }

  const handleDisciplineClick = (discipline: string | null) => {
    setActiveDiscipline(discipline)
    setActiveTag(null)
    setShowBookmarksOnly(false)
    setPage(1)
    fetchDocuments({ discipline, tag: null, pageNum: 1 })
  }

  const handleTagClick = (tag: string | null) => {
    setActiveTag(tag)
    setActiveDiscipline(null)
    setShowBookmarksOnly(false)
    setPage(1)
    fetchDocuments({ tag, discipline: null, pageNum: 1 })
  }

  const handleBookmarksToggle = () => {
    const next = !showBookmarksOnly
    setShowBookmarksOnly(next)
    setActiveDiscipline(null)
    setActiveTag(null)
    setPage(1)
    fetchDocuments({ discipline: null, tag: null, pageNum: 1, bookmarksOnly: next })
  }

  const toggleDocBookmark = async (docId: string) => {
    if (!session?.user) return
    try {
      const res = await fetch(`/api/v1/knowledge/${docId}/bookmark`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setBookmarkedIds((prev) => {
          const next = new Set(prev)
          if (data.data.bookmarked) {
            next.add(docId)
          } else {
            next.delete(docId)
          }
          return next
        })
        if (showBookmarksOnly && !data.data.bookmarked) {
          setDocuments((prev) => prev.filter((d) => d.id !== docId))
        }
      }
    } catch {
      // ignore
    }
  }

  const toggleSectionCollapse = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleDocExpand = (key: string) => {
    setExpandedDocCounts((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getDocTags = (doc: KnowledgeDoc): string[] => {
    const t = doc.metadata?.tags
    return Array.isArray(t) ? (t as string[]) : []
  }

  const getDocSubDiscipline = (doc: KnowledgeDoc): string | null => {
    return (doc.metadata?.subDiscipline as string) || null
  }

  const getDisciplineCount = (value: string): number => disciplineStats[value] || 0

  const { grouped, orderedKeys } = useMemo(() => groupByDiscipline(documents), [documents])

  // Recently added: top 4 most recent docs
  const recentlyAdded = useMemo(() => {
    return [...documents].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 4)
  }, [documents])

  const hasNewDocs = useMemo(() => {
    return documents.some((d) => isNew(d.createdAt))
  }, [documents])

  // Determine if pagination is active
  const isPaginated = !activeDiscipline && !activeTag && !showBookmarksOnly

  // ============================================
  // Render
  // ============================================
  return (
    <div>
      {/* ========== HERO SECTION ========== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-journal-primary/[0.08] via-journal-primary/[0.02] to-transparent border-b border-journal-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-journal-gold/10 via-transparent to-transparent" />
        <div className="relative container mx-auto px-4 pt-10 pb-8 md:pt-14 md:pb-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-journal-primary/10 text-journal-primary text-xs font-medium mb-4">
              <Database className="h-3.5 w-3.5" />
              Knowledge Base
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-foreground">
              Curated Academic Knowledge
            </h1>
            <p className="mt-3 text-base text-muted-foreground font-source-serif leading-relaxed max-w-lg mx-auto">
              Structured insights across 15 disciplines. Search, browse, and discover research essentials.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-xl mx-auto relative">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  ref={searchRef}
                  placeholder="Search papers, concepts, methods..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true)
                  }}
                  className="pl-10 h-11 rounded-xl border-journal-border/50 bg-background/80 backdrop-blur-sm"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-journal-border/50 rounded-xl shadow-lg overflow-hidden z-50">
                    {suggestions.map((doc, idx) => {
                      const visual = getSourceVisual(doc.source)
                      const SIcon = SourceIconMap[visual.icon] || FileText
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setShowSuggestions(false)
                            router.push(`/knowledge/${doc.id}`)
                          }}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-2 transition-colors ${
                            idx === activeSuggestion
                              ? 'bg-journal-primary/10'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <SIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm text-foreground truncate flex-1">
                            {doc.title}
                          </span>
                          {doc.discipline && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                              {getDisciplineLabel(doc.discipline)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <Button type="submit" className="h-11 px-5 rounded-xl">
                Search
              </Button>
            </form>

            {/* Quick stats */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {documents.length} documents
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {KNOWLEDGE_DISCIPLINES.length} disciplines
              </span>
              {hasNewDocs && (
                <span className="flex items-center gap-1 text-journal-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  New this week
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========== MAIN LAYOUT ========== */}
      <div className="container mx-auto py-8">
        <div className="flex gap-8">
          {/* LEFT SIDEBAR */}
          <aside className="w-64 flex-shrink-0 hidden lg:block space-y-5">
            <QuickLinksPanel />
            <div className="border-t border-journal-border/30" />
            <TrendingPanel />
            <div className="border-t border-journal-border/30" />
            <TagCloud
              documents={documents}
              activeTag={activeTag}
              onTagClick={handleTagClick}
            />
            <div className="border-t border-journal-border/30" />
            <RecommendedReading
              documents={documents}
              visitedIds={new Set(Object.keys(history))}
            />
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 min-w-0">
            {/* AI Workshop CTA */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-convo-blue/5 to-tea-primary/5 border border-convo-blue/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-convo-blue/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-convo-blue" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">AI-Powered Knowledge Retrieval</p>
                  <p className="text-xs text-muted-foreground">
                    Use the AI Workshop assistant for intelligent Q&amp;A and literature analysis
                  </p>
                </div>
                <Link href="/workshop?mode=research">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    Explore
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* ========== RECENTLY ADDED ========== */}
            {!loading && recentlyAdded.length > 0 && !activeDiscipline && !search && (
              <section className="mb-8 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-journal-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Recently Added</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Last {recentlyAdded.length} documents
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recentlyAdded.map((doc) => (
                    <FeaturedCard
                      key={doc.id}
                      doc={doc}
                      getDocTags={getDocTags}
                      getDocSubDiscipline={getDocSubDiscipline}
                      isBookmarked={bookmarkedIds.has(doc.id)}
                      onToggleBookmark={toggleDocBookmark}
                      showBookmark={!!session?.user}
                      isVisited={isVisited(doc.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ========== DISCIPLINE FILTERS ========== */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Browse by Discipline
                  </span>
                </div>
                {session?.user?.role === 'ADMIN' && (
                  <Link href="/admin/knowledge">
                    <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs">
                      <Settings className="h-3 w-3" />
                      Manage
                    </Button>
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleDisciplineClick(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    activeDiscipline === null && !showBookmarksOnly
                      ? 'bg-journal-primary text-white border-journal-primary shadow-sm'
                      : 'bg-background text-muted-foreground border-journal-border/50 hover:border-journal-primary/40 hover:text-foreground'
                  }`}
                >
                  All
                </button>
                {session?.user && (
                  <button
                    onClick={handleBookmarksToggle}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                      showBookmarksOnly
                        ? 'bg-journal-primary text-white border-journal-primary shadow-sm'
                        : 'bg-background text-muted-foreground border-journal-border/50 hover:border-journal-primary/40 hover:text-foreground'
                    }`}
                  >
                    <Bookmark className="inline h-3 w-3 mr-1" />
                    My Bookmarks
                  </button>
                )}
                {KNOWLEDGE_DISCIPLINES.map((d) => {
                  const count = getDisciplineCount(d.value)
                  if (count === 0 && activeDiscipline !== d.value) return null
                  return (
                    <button
                      key={d.value}
                      onClick={() => handleDisciplineClick(d.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                        activeDiscipline === d.value
                          ? 'bg-journal-primary text-white border-journal-primary shadow-sm'
                          : 'bg-background text-muted-foreground border-journal-border/50 hover:border-journal-primary/40 hover:text-foreground'
                      }`}
                    >
                      {d.label} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ========== CONTROLS BAR ========== */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {/* Sort dropdown */}
                <Select
                  value={`${sortBy}:${sortOrder}`}
                  onValueChange={(val) => {
                    const [field, dir] = val.split(':') as [SortField, SortDir]
                    handleSortChange(field, dir)
                  }}
                >
                  <SelectTrigger className="h-8 w-[160px] text-xs gap-1">
                    <ArrowUpDown className="h-3 w-3" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt:desc">Newest</SelectItem>
                    <SelectItem value="createdAt:asc">Oldest</SelectItem>
                    <SelectItem value="viewCount:desc">Most Viewed</SelectItem>
                    <SelectItem value="title:asc">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>

                {/* Result count */}
                <span className="text-xs text-muted-foreground">
                  {documents.length} docs
                  {isPaginated && hasMore ? ' · more available' : ''}
                </span>

                {/* Active tag filter badge */}
                {activeTag && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                    <Tag className="h-2.5 w-2.5" />
                    {activeTag}
                    <button
                      onClick={() => handleTagClick(null)}
                      className="hover:text-teal-900 ml-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
              </div>

              {/* View toggle */}
              <div className="flex items-center border border-journal-border/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-journal-primary/10 text-journal-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-journal-primary/10 text-journal-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ========== DOCUMENT SECTIONS ========== */}
            {loading ? (
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <Skeleton className="h-7 w-40 mb-4" />
                    <div
                      className={`grid gap-4 ${
                        viewMode === 'grid'
                          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                          : 'grid-cols-1'
                      }`}
                    >
                      {[1, 2, 3].map((j) => (
                        <Skeleton
                          key={j}
                          className={`w-full rounded-xl ${viewMode === 'grid' ? 'h-44' : 'h-16'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <Card className="p-16 text-center border-journal-border/40">
                <div className="h-16 w-16 rounded-2xl bg-journal-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Database className="h-8 w-8 text-journal-primary/50" />
                </div>
                <h3 className="font-serif font-medium text-xl mb-2">
                  {search || activeDiscipline ? 'No matching documents' : 'Knowledge base is empty'}
                </h3>
                <p className="text-muted-foreground font-source-serif">
                  {search || activeDiscipline
                    ? 'Try adjusting filters or using different keywords'
                    : 'Knowledge base is under construction'}
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {orderedKeys.map((disciplineKey) => {
                  const docs = grouped[disciplineKey] || []
                  if (docs.length === 0) return null
                  const isUncategorized = disciplineKey === '__uncategorized'
                  const disciplineInfo = isUncategorized
                    ? null
                    : KNOWLEDGE_DISCIPLINES.find((d) => d.value === disciplineKey)
                  const label = isUncategorized
                    ? 'Uncategorized'
                    : disciplineInfo?.label || disciplineKey
                  const zoneBorder =
                    DISCIPLINE_ZONE_BORDERS[disciplineKey] || 'border-l-slate-400'
                  const headerText =
                    DISCIPLINE_HEADER_TEXTS[disciplineKey] || 'text-slate-700'
                  const iconBg =
                    DISCIPLINE_ICON_BGS[disciplineKey] || 'bg-slate-500 text-white'
                  const badgeStyle =
                    DISCIPLINE_BADGE_STYLES[disciplineKey] ||
                    'bg-slate-50 text-slate-700 border-slate-200'

                  const isCollapsed = collapsedSections.has(disciplineKey)

                  return (
                    <section
                      key={disciplineKey}
                      className={`animate-fade-in-up border-l-4 ${zoneBorder} pl-4 pb-2`}
                    >
                      {/* Section header with collapse toggle */}
                      <button
                        onClick={() => toggleSectionCollapse(disciplineKey)}
                        className="w-full flex items-center justify-between mb-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-9 items-center justify-center rounded-lg ${iconBg} shadow-sm`}
                          >
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <h2
                              className={`text-lg font-serif font-semibold ${headerText} group-hover:opacity-80 transition-opacity`}
                            >
                              {label}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                              {docs.length} knowledge cards
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {!isCollapsed && (
                        <DocGroup
                          docs={docs}
                          badgeStyle={badgeStyle}
                          viewMode={viewMode}
                          getDocTags={getDocTags}
                          getDocSubDiscipline={getDocSubDiscipline}
                          bookmarkedIds={bookmarkedIds}
                          toggleDocBookmark={toggleDocBookmark}
                          showBookmark={!!session?.user}
                          isVisited={isVisited}
                          expandedDocCounts={expandedDocCounts}
                          toggleDocExpand={toggleDocExpand}
                          groupKey={disciplineKey}
                        />
                      )}
                    </section>
                  )
                })}

                {/* Load more */}
                {isPaginated && hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load more documents
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Footer count */}
            {!loading && documents.length > 0 && (
              <div className="mt-12 pt-6 border-t border-journal-border/30 text-center text-sm text-muted-foreground">
                <p>
                  Total{' '}
                  <span className="font-medium text-foreground">{documents.length}</span> knowledge
                  documents
                  {activeDiscipline ? (
                    <span>
                      {' '}
                      in discipline{' '}
                      <span className="font-medium text-journal-primary">
                        {getDisciplineLabel(activeDiscipline)}
                      </span>
                    </span>
                  ) : null}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

// ============================================
// DocGroup: renders a group of docs with "show more"
// ============================================
const DOC_PREVIEW_LIMIT = 6

function DocGroup({
  docs,
  badgeStyle,
  viewMode,
  getDocTags,
  getDocSubDiscipline,
  bookmarkedIds,
  toggleDocBookmark,
  showBookmark,
  isVisited,
  expandedDocCounts,
  toggleDocExpand,
  groupKey,
}: {
  docs: KnowledgeDoc[]
  badgeStyle: string
  viewMode: ViewMode
  getDocTags: (doc: KnowledgeDoc) => string[]
  getDocSubDiscipline: (doc: KnowledgeDoc) => string | null
  bookmarkedIds: Set<string>
  toggleDocBookmark: (id: string) => void
  showBookmark?: boolean
  isVisited: (id: string) => boolean
  expandedDocCounts: Record<string, boolean>
  toggleDocExpand: (key: string) => void
  groupKey: string
}) {
  const isExpanded = expandedDocCounts[groupKey]
  const showLimit = isExpanded ? docs.length : Math.min(docs.length, DOC_PREVIEW_LIMIT)
  const visibleDocs = docs.slice(0, showLimit)
  const hasMore = docs.length > DOC_PREVIEW_LIMIT

  return (
    <div>
      {viewMode === 'grid' ? (
        <div className={`grid gap-4 ${
          docs.length === 1
            ? 'grid-cols-1'
            : docs.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {visibleDocs.map((doc) => (
            <KnowledgeCard
              key={doc.id}
              doc={doc}
              badgeStyle={badgeStyle}
              getDocTags={getDocTags}
              getDocSubDiscipline={getDocSubDiscipline}
              isBookmarked={bookmarkedIds.has(doc.id)}
              onToggleBookmark={toggleDocBookmark}
              showBookmark={showBookmark}
              isVisited={isVisited(doc.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleDocs.map((doc) => (
            <CompactListItem
              key={doc.id}
              doc={doc}
              badgeStyle={badgeStyle}
              getDocTags={getDocTags}
              getDocSubDiscipline={getDocSubDiscipline}
              isBookmarked={bookmarkedIds.has(doc.id)}
              onToggleBookmark={toggleDocBookmark}
              showBookmark={showBookmark}
              isVisited={isVisited(doc.id)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={() => toggleDocExpand(groupKey)}
          className="mt-3 w-full py-2 text-xs text-muted-foreground hover:text-journal-primary border border-dashed border-journal-border/50 rounded-lg hover:border-journal-primary/30 hover:bg-journal-primary/[0.02] transition-colors flex items-center justify-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show {docs.length - DOC_PREVIEW_LIMIT} more
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ============================================
// Featured Card
// ============================================
function FeaturedCard({
  doc,
  getDocTags,
  getDocSubDiscipline,
  isBookmarked,
  onToggleBookmark,
  showBookmark,
  isVisited,
}: {
  doc: KnowledgeDoc
  getDocTags: (doc: KnowledgeDoc) => string[]
  getDocSubDiscipline: (doc: KnowledgeDoc) => string | null
  isBookmarked: boolean
  onToggleBookmark: (id: string) => void
  showBookmark?: boolean
  isVisited?: boolean
}) {
  const docTags = getDocTags(doc)
  const subDiscipline = getDocSubDiscipline(doc)
  const readingTime = estimateReadingTime(doc.contentPreview)

  return (
    <Link href={`/knowledge/${doc.id}`}>
      <Card className="group h-full border bg-gradient-to-br from-background to-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <SourceBadge source={doc.source} />
              {isVisited && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-200/50">
                  <Check className="h-2.5 w-2.5" />
                  Read
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isNew(doc.createdAt) && (
                <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">
                  <Flame className="h-2.5 w-2.5 mr-0.5" />
                  New
                </Badge>
              )}
              <span className="text-[11px] text-muted-foreground">{formatDate(doc.createdAt)}</span>
              {showBookmark && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onToggleBookmark(doc.id)
                  }}
                  className={`p-1 rounded-md transition-colors ${isBookmarked ? 'text-journal-primary' : 'text-muted-foreground hover:text-journal-primary'}`}
                  title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
          </div>

          <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-journal-primary transition-colors mb-2">
            {doc.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
            {doc.contentPreview}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2 flex-wrap">
              {subDiscipline && (
                <span className="text-[10px] text-journal-primary/80 bg-journal-primary/10 px-1.5 py-0.5 rounded">
                  {getSubDisciplineLabel(subDiscipline)}
                </span>
              )}
              {docTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-muted-foreground bg-background border border-border/50 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Eye className="h-3 w-3" />
                {doc.viewCount || 0}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {readingTime} min
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ============================================
// Standard Knowledge Card (Grid view)
// ============================================
function KnowledgeCard({
  doc,
  badgeStyle,
  getDocTags,
  getDocSubDiscipline,
  isBookmarked,
  onToggleBookmark,
  showBookmark,
  isVisited,
}: {
  doc: KnowledgeDoc
  badgeStyle: string
  getDocTags: (doc: KnowledgeDoc) => string[]
  getDocSubDiscipline: (doc: KnowledgeDoc) => string | null
  isBookmarked: boolean
  onToggleBookmark: (id: string) => void
  showBookmark?: boolean
  isVisited?: boolean
}) {
  const docTags = getDocTags(doc)
  const subDiscipline = getDocSubDiscipline(doc)
  const readingTime = estimateReadingTime(doc.contentPreview)

  return (
    <Card className="group h-full border bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <SourceBadge source={doc.source} />
            {isVisited && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-200/50">
                <Check className="h-2.5 w-2.5" />
                Read
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isNew(doc.createdAt) && (
              <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">
                <Flame className="h-2.5 w-2.5 mr-0.5" />
                New
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground">{formatDate(doc.createdAt)}</span>
            {showBookmark && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleBookmark(doc.id)
                }}
                className={`p-1 rounded-md transition-colors ${isBookmarked ? 'text-journal-primary' : 'text-muted-foreground hover:text-journal-primary'}`}
                title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <Link href={`/knowledge/${doc.id}`} className="block">
          <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-journal-primary transition-colors min-h-[2.5rem]">
            {doc.title}
          </h3>
        </Link>

        {/* Abstract preview */}
        <p className="text-xs text-muted-foreground line-clamp-3 mt-2 mb-2.5">
          {doc.contentPreview}
        </p>

        {/* Bottom row */}
        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              {subDiscipline && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badgeStyle}`}>
                  {getSubDisciplineLabel(subDiscipline)}
                </span>
              )}
              {docTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-muted-foreground bg-background/70 border border-border/50 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
              {docTags.length > 2 && (
                <span className="text-[10px] text-muted-foreground/60">+{docTags.length - 2}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Eye className="h-3 w-3" />
                {doc.viewCount || 0}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {readingTime}m
              </span>
            </div>
          </div>

          {doc.metadata?.url ? (
            <a
              href={String(doc.metadata.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-[11px] text-journal-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Source
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Compact List Item
// ============================================
function CompactListItem({
  doc,
  badgeStyle,
  getDocTags,
  getDocSubDiscipline,
  isBookmarked,
  onToggleBookmark,
  showBookmark,
  isVisited,
}: {
  doc: KnowledgeDoc
  badgeStyle: string
  getDocTags: (doc: KnowledgeDoc) => string[]
  getDocSubDiscipline: (doc: KnowledgeDoc) => string | null
  isBookmarked: boolean
  onToggleBookmark: (id: string) => void
  showBookmark?: boolean
  isVisited?: boolean
}) {
  const docTags = getDocTags(doc)
  const subDiscipline = getDocSubDiscipline(doc)
  const readingTime = estimateReadingTime(doc.contentPreview)

  return (
    <Link href={`/knowledge/${doc.id}`}>
      <Card className="group border bg-white hover:shadow-sm hover:border-journal-border/60 transition-all duration-150 cursor-pointer">
        <CardContent className="p-3 flex items-center gap-3">
          {/* Source icon */}
          <div className="flex-shrink-0">
            <SourceBadge source={doc.source} />
          </div>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-journal-primary transition-colors">
                {doc.title}
              </h3>
              {isVisited && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-200/50 shrink-0">
                  <Check className="h-2.5 w-2.5" />
                  Read
                </span>
              )}
              {isNew(doc.createdAt) && (
                <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50 shrink-0">
                  <Flame className="h-2.5 w-2.5 mr-0.5" />
                  New
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {subDiscipline && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badgeStyle}`}>
                  {getSubDisciplineLabel(subDiscipline)}
                </span>
              )}
              {docTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-muted-foreground bg-muted border border-border/40 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
              {docTags.length > 3 && (
                <span className="text-[10px] text-muted-foreground/60">+{docTags.length - 3}</span>
              )}
            </div>
          </div>

          {/* Right meta */}
          <div className="flex-shrink-0 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {doc.viewCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readingTime}m
            </span>
            <span className="hidden sm:inline">{formatDate(doc.createdAt)}</span>
            {showBookmark && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleBookmark(doc.id)
                }}
                className={`p-1 rounded-md transition-colors ${isBookmarked ? 'text-journal-primary' : 'text-muted-foreground hover:text-journal-primary'}`}
              >
                <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
