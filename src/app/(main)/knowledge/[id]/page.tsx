'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Tag,
  Calendar,
  Database,
  Loader2,
  AlertCircle,
  Clock,
  Flame,
  ChevronRight,
  Globe,
  MessageSquare,
  Newspaper,
  Bookmark,
  ScrollText,
  Search,
  Eye,
  Check,
  Users,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown'
import { getDisciplineLabel, getSourceLabel, getSubDisciplineLabel } from '@/lib/knowledge/categories'
import { isNew, formatDate, estimateReadingTime, getSourceVisual, type SourceVisual } from '@/lib/knowledge/utils'
import { useReadingHistory } from '@/hooks/use-reading-history'
import { TableOfContents } from '@/components/features/knowledge/TableOfContents'

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

interface KnowledgeDoc {
  id: string
  title: string
  content: string
  source: string | null
  sourceId: string | null
  discipline: string | null
  authorId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

interface RelatedDoc {
  id: string
  title: string
  source: string | null
  discipline: string | null
  metadata: Record<string, unknown> | null
  viewCount: number
  createdAt: string
  score: number
}

interface RelatedPost {
  id: string
  title: string
  content: string
  authorName: string | null
  createdAt: string
  viewCount: number
  commentCount: number
  score: number
}

export default function KnowledgeDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [doc, setDoc] = useState<KnowledgeDoc | null>(null)
  const [related, setRelated] = useState<RelatedDoc[]>([])
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([])
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { markVisited, getVisitedAt } = useReadingHistory()

  useEffect(() => {
    if (!id) return

    fetch(`/api/v1/knowledge/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDoc(data.data)
          markVisited(id)
          // Check bookmark status
          fetch(`/api/v1/knowledge/${id}/bookmark`)
            .then((r) => r.json())
            .then((bm) => {
              if (bm.success) setBookmarked(bm.data.bookmarked)
            })
            .catch(() => {})
          // Fetch related documents
          fetch(`/api/v1/knowledge/${id}/related`)
            .then((r) => r.json())
            .then((rel) => {
              if (rel.success) setRelated(rel.data)
            })
            .catch(() => {})
          // Fetch related community posts
          fetch(`/api/v1/knowledge/${id}/posts`)
            .then((r) => r.json())
            .then((posts) => {
              if (posts.success) setRelatedPosts(posts.data)
            })
            .catch(() => {})
        } else {
          setError(data.error?.message || 'Failed to load')
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [id, markVisited])

  const getDocTags = (): string[] => {
    const tags = doc?.metadata?.tags
    return Array.isArray(tags) ? tags : []
  }

  const toggleBookmark = async () => {
    if (!id || bookmarkLoading) return
    setBookmarkLoading(true)
    try {
      const res = await fetch(`/api/v1/knowledge/${id}/bookmark`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setBookmarked(data.data.bookmarked)
      }
    } catch {
      // ignore
    } finally {
      setBookmarkLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-48 mb-8" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="font-serif font-medium text-xl mb-2">Document failed to load</h2>
        <p className="text-muted-foreground mb-6">{error || 'Document does not exist or has been deleted'}</p>
        <Link href="/knowledge">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </Link>
      </div>
    )
  }

  const readingTime = estimateReadingTime(doc.content)
  const docNew = isNew(doc.createdAt)
  const sourceVisual = getSourceVisual(doc.source)
  const SourceIcon = SourceIconMap[sourceVisual.icon] || FileText

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <section className="bg-gradient-to-br from-journal-primary/[0.06] via-journal-primary/[0.02] to-transparent border-b border-journal-border/30">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <Link href="/knowledge" className="hover:text-journal-primary transition-colors">
              Knowledge Base
            </Link>
            <ChevronRight className="h-3 w-3" />
            {doc.discipline ? (
              <>
                <Link
                  href={`/knowledge?discipline=${doc.discipline}`}
                  className="hover:text-journal-primary transition-colors"
                >
                  {getDisciplineLabel(doc.discipline)}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </>
            ) : null}
            {typeof doc.metadata?.subDiscipline === 'string' && (
              <span className="text-journal-primary">
                {getSubDisciplineLabel(doc.metadata.subDiscipline)}
              </span>
            )}
          </nav>

          <Link href="/knowledge">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Knowledge Base
            </Button>
          </Link>

          {/* Source badge */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${sourceVisual.bg} ${sourceVisual.color} border ${sourceVisual.border}`}
            >
              <SourceIcon className="h-3.5 w-3.5" />
              {getSourceLabel(doc.source)}
            </span>
            {docNew && (
              <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">
                <Flame className="h-2.5 w-2.5 mr-0.5" />
                New
              </Badge>
            )}
            {(() => {
              const visitedAt = getVisitedAt(doc.id)
              if (!visitedAt) return null
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-200/50">
                  <Check className="h-2.5 w-2.5" />
                  Read {formatDate(visitedAt.toISOString())}
                </span>
              )
            })()}
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 text-xs gap-1 ${bookmarked ? 'text-journal-primary' : 'text-muted-foreground'}`}
              onClick={toggleBookmark}
              disabled={bookmarkLoading}
            >
              <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-current' : ''}`} />
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">
            {doc.title}
          </h1>

          {/* Abstract / TL;DR */}
          {typeof doc.metadata?.abstract === 'string' && doc.metadata.abstract && (
            <div className="mt-4 p-4 rounded-lg bg-journal-primary/[0.04] border border-journal-primary/10">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-journal-primary" />
                <span className="text-xs font-medium text-journal-primary">TL;DR</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{doc.metadata.abstract as string}</p>
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-muted-foreground">
            {doc.discipline && (
              <Badge variant="outline" className="text-xs border-journal-border/50">
                <Tag className="h-3 w-3 mr-1" />
                {getDisciplineLabel(doc.discipline)}
              </Badge>
            )}
            {typeof doc.metadata?.subDiscipline === 'string' && (
              <Badge variant="outline" className="text-xs border-journal-primary/30 text-journal-primary">
                {getSubDisciplineLabel(doc.metadata.subDiscipline)}
              </Badge>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(doc.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {readingTime} min read
            </span>
            {Array.isArray(doc.metadata?.authors) && (doc.metadata.authors as string[]).length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {(doc.metadata.authors as string[]).slice(0, 3).join(', ')}
                {(doc.metadata.authors as string[]).length > 3 && ' et al.'}
              </span>
            )}
            {doc.metadata && typeof doc.metadata === 'object' && 'url' in doc.metadata && typeof doc.metadata.url === 'string' && (
              <a
                href={doc.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-journal-primary hover:underline"
              >
                <BookOpen className="h-3.5 w-3.5" />
                View Source
              </a>
            )}
          </div>

          {/* Tags */}
          {getDocTags().length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {getDocTags().map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-tea-primary/10 text-tea-primary-dark border border-tea-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0 max-w-4xl">
            <Card className="border-journal-border/40">
              <CardContent className="p-6 md:p-8">
                <div className="prose prose-sm max-w-none font-source-serif leading-relaxed">
                  <SimpleMarkdown content={doc.content} />
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            {doc.metadata && Object.keys(doc.metadata).length > 0 && (
              <Card className="mt-6 border-journal-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {Object.entries(doc.metadata)
                      .filter(([key]) => !['abstract', 'subDiscipline', 'tags', 'authors'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <dt className="text-muted-foreground font-medium min-w-[80px]">{key}:</dt>
                          <dd className="text-foreground break-all">
                            {typeof value === 'string' ? value : JSON.stringify(value)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </CardContent>
              </Card>
            )}

        {/* Community Discussions */}
        {relatedPosts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-tea-primary" />
              <h3 className="text-sm font-semibold text-foreground">Community Discussions</h3>
            </div>
            <div className="space-y-2">
              {relatedPosts.map((post) => (
                <Link key={post.id} href={`/disciplines/all/posts/${post.id}`}>
                  <Card className="border hover:shadow-sm hover:border-tea-primary/20 transition-all duration-150 cursor-pointer">
                    <CardContent className="p-3 flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-tea-primary transition-colors">
                          {post.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                          {post.authorName && (
                            <span>{post.authorName}</span>
                          )}
                          <span>{formatDate(post.createdAt)}</span>
                          <span className="flex items-center gap-0.5">
                            <Eye className="h-3 w-3" />
                            {post.viewCount}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="h-3 w-3" />
                            {post.commentCount}
                          </span>
                          {post.score >= 100 && (
                            <span className="text-[10px] text-tea-primary font-medium">Original Post</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

            {/* Related Documents */}
            {related.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-4 w-4 text-journal-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Related Knowledge</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {related.map((relDoc) => {
                    const relVisual = getSourceVisual(relDoc.source)
                    const RelIcon = SourceIconMap[relVisual.icon] || FileText
                    const relTags = Array.isArray(relDoc.metadata?.tags) ? (relDoc.metadata?.tags as string[]) : []
                    return (
                      <Link key={relDoc.id} href={`/knowledge/${relDoc.id}`}>
                        <Card className="h-full border hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden">
                          <CardContent className="p-4 flex flex-col h-full">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${relVisual.bg} ${relVisual.color} border ${relVisual.border}`}>
                                <RelIcon className="h-2.5 w-2.5" />
                                {getSourceLabel(relDoc.source)}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Eye className="h-2.5 w-2.5" />
                                {relDoc.viewCount || 0}
                              </span>
                            </div>
                            <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-2 flex-1">
                              {relDoc.title}
                            </h4>
                            <div className="flex items-center gap-1.5 flex-wrap mt-auto">
                              {relDoc.discipline && (
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {getDisciplineLabel(relDoc.discipline)}
                                </span>
                              )}
                              {relTags.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-[10px] text-muted-foreground/70 bg-background border border-border/40 px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: Table of Contents */}
          <TableOfContents content={doc.content} />
        </div>
      </div>
    </div>
  )
}
