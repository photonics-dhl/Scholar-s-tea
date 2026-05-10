'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, Search, BookOpen, ExternalLink, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface KnowledgeDoc {
  id: string;
  title: string;
  source: string | null;
  discipline: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface KnowledgeResponse {
  success: boolean;
  data: KnowledgeDoc[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchDocuments = async (searchTerm = '', pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '20',
      });
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/v1/knowledge?${params}`);
      const data: KnowledgeResponse = await res.json();

      if (data.success) {
        setDocuments(data.data);
        setTotalPages(data.meta.totalPages);
        setTotal(data.meta.total);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments(search, 1);
  };

  const getSourceLabel = (source: string | null) => {
    const labels: Record<string, string> = {
      paper: '论文',
      post: '帖子',
      news: '新闻',
      publication: '论文',
      wiki: '百科',
      manual: '手册',
    };
    return labels[source || ''] || source || '文档';
  };

  const getDisciplineLabel = (discipline: string | null) => {
    if (!discipline) return null;
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
    };
    return labels[discipline] || discipline;
  };

  return (
    <div>
      {/* Page Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-journal-primary/[0.08] via-journal-primary/[0.02] to-transparent border-b border-journal-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-journal-gold/10 via-transparent to-transparent" />
        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-5 w-5 text-journal-primary" />
              <span className="text-sm font-medium text-journal-primary tracking-wide uppercase">Knowledge Base</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground">
              知识库
            </h1>
            <p className="mt-4 text-lg text-muted-foreground font-source-serif leading-relaxed">
              浏览和搜索学术知识文档，发现各学科领域的研究精华
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto py-10">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索知识文档..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 focus-visible:ring-journal-primary/30 focus-visible:border-journal-primary/50"
            />
          </div>
          <Button type="submit" variant="journal-outline">
            搜索
          </Button>
        </form>

        {/* AI Search CTA */}
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-convo-blue/5 to-tea-primary/5 border border-convo-blue/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-convo-blue/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-convo-blue" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">AI 驱动的知识检索</p>
              <p className="text-xs text-muted-foreground">
                在思想工坊中使用 AI 助手，可以基于知识库进行智能问答和文献分析
              </p>
            </div>
            <Link href="/workshop?mode=research">
              <Button size="sm" variant="outline" className="gap-1.5">
                前往探索
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <FileText className="h-4 w-4 text-journal-primary" />
          <span>
            共 <span className="font-medium text-foreground">{total}</span> 篇知识文档
          </span>
        </div>

        {/* Document List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <Card className="p-16 text-center border-journal-border/40">
            <div className="h-16 w-16 rounded-2xl bg-journal-primary/10 flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-journal-primary/50" />
            </div>
            <h3 className="font-serif font-medium text-xl mb-2">
              {search ? '未找到相关文档' : '知识库为空'}
            </h3>
            <p className="text-muted-foreground font-source-serif">
              {search
                ? '尝试使用其他关键词搜索'
                : '知识库正在建设中，敬请期待'}
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {documents.map((doc, i) => (
                <Card
                  key={doc.id}
                  className="border-journal-border/40 hover:border-journal-gold/50 transition-all duration-200 hover:shadow-md animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-journal-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-journal-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {doc.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px] bg-journal-primary/10 text-journal-primary border-0">
                            {getSourceLabel(doc.source)}
                          </Badge>
                          {doc.discipline && (
                            <Badge variant="outline" className="text-[10px] border-journal-border/50">
                              {getDisciplineLabel(doc.discipline)}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        {doc.metadata?.url ? (
                          <a
                            href={String(doc.metadata.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs text-journal-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            查看原文
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => {
                    const newPage = page - 1;
                    setPage(newPage);
                    fetchDocuments(search, newPage);
                  }}
                  className="border-journal-border/50"
                >
                  上一页
                </Button>
                <span className="px-4 py-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{page}</span> / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => {
                    const newPage = page + 1;
                    setPage(newPage);
                    fetchDocuments(search, newPage);
                  }}
                  className="border-journal-border/50"
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
