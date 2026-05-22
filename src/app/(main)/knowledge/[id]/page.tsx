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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown'

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

export default function KnowledgeDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [doc, setDoc] = useState<KnowledgeDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    fetch(`/api/v1/knowledge/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDoc(data.data)
        } else {
          setError(data.error?.message || '加载失败')
        }
      })
      .catch(() => setError('网络错误'))
      .finally(() => setLoading(false))
  }, [id])

  const getSourceLabel = (source: string | null) => {
    const labels: Record<string, string> = {
      paper: '论文',
      post: '帖子',
      news: '新闻',
      publication: '论文',
      wiki: '百科',
      manual: '手册',
    }
    return labels[source || ''] || source || '文档'
  }

  const getDisciplineLabel = (discipline: string | null) => {
    if (!discipline) return null
    const labels: Record<string, string> = {
      physics: '物理学',
      chemistry: '化学',
      biology: '生物学',
      cs: '计算机科学',
      'computer-science': '计算机科学',
      math: '数学',
      engineering: '工程学',
      medicine: '医学',
      economics: '经济学',
      social: '社会科学',
    }
    return labels[discipline] || discipline
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
        <h2 className="font-serif font-medium text-xl mb-2">文档加载失败</h2>
        <p className="text-muted-foreground mb-6">{error || '文档不存在或已被删除'}</p>
        <Link href="/knowledge">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回知识库
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <section className="bg-gradient-to-br from-journal-primary/[0.06] via-journal-primary/[0.02] to-transparent border-b border-journal-border/30">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Link href="/knowledge">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回知识库
            </Button>
          </Link>

          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-journal-primary" />
            <span className="text-xs font-medium text-journal-primary tracking-wide uppercase">
              {getSourceLabel(doc.source)}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">
            {doc.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-muted-foreground">
            {doc.discipline && (
              <Badge variant="outline" className="text-xs border-journal-border/50">
                <Tag className="h-3 w-3 mr-1" />
                {getDisciplineLabel(doc.discipline)}
              </Badge>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(doc.createdAt).toLocaleDateString('zh-CN')}
            </span>
            {doc.metadata && typeof doc.metadata === 'object' && 'url' in doc.metadata && typeof doc.metadata.url === 'string' && (
              <a
                href={doc.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-journal-primary hover:underline"
              >
                <BookOpen className="h-3.5 w-3.5" />
                查看原文
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
                元数据
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {Object.entries(doc.metadata).map(([key, value]) => (
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
      </div>
    </div>
  )
}
