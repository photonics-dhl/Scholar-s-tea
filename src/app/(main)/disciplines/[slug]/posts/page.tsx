'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { MessageSquare, Eye, ChevronRight, Pin, Lock, Flame, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Author {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface Discipline {
  id: string;
  name: string;
  slug: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: Author;
  discipline: Discipline | null;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  score: number;
  _count: {
    comments: number;
  };
}

interface PostsResponse {
  success: boolean;
  data: Post[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface DisciplineInfo {
  discipline: {
    id: string;
    name: string;
    slug: string;
  };
}

interface DisciplineResponse {
  success: boolean;
  data: DisciplineInfo;
}

export default function DisciplinePostsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [disciplineName, setDisciplineName] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<'latest' | 'hot' | 'pinned'>('latest');
  const total = 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch discipline info
        const discRes = await fetch(`/api/v1/disciplines/${slug}`);
        const discData: DisciplineResponse = await discRes.json();
        if (discData.success) {
          setDisciplineName(discData.data.discipline.name);
        }

        // Fetch posts
        const postsRes = await fetch(
          `/api/v1/posts?disciplineId=${discData.data?.discipline.id || ''}&page=${page}&sort=${sort}`
        );
        const postsData: PostsResponse = await postsRes.json();
        if (postsData.success) {
          setPosts(postsData.data);
          setTotalPages(postsData.meta.totalPages);
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, page, sort]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').slice(0, 150);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/disciplines" className="hover:text-foreground">
          学科社区
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/disciplines/${slug}`} className="hover:text-foreground">
          {disciplineName}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">帖子</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{disciplineName} - 帖子</h1>
        <div className="flex items-center gap-4">
          <Select
            value={sort}
            onValueChange={(value: 'latest' | 'hot' | 'pinned') => setSort(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> 最新
                </span>
              </SelectItem>
              <SelectItem value="hot">
                <span className="flex items-center gap-2">
                  <Flame className="h-4 w-4" /> 最热
                </span>
              </SelectItem>
              <SelectItem value="pinned">
                <span className="flex items-center gap-2">
                  <Pin className="h-4 w-4" /> 精华
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href={`/disciplines/${slug}/posts/new`}>发布帖子</Link>
          </Button>
        </div>
      </div>

      {/* Posts List */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/disciplines/${slug}/posts/${post.id}`}
              className="block"
            >
              <article className="rounded-lg border p-4 hover:bg-accent transition-colors">
                <div className="flex gap-4">
                  {/* Vote Score */}
                  <div className="flex flex-col items-center justify-center min-w-[60px]">
                    <span className="text-lg font-semibold">{post.score}</span>
                    <span className="text-xs text-muted-foreground">得分</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {post.isPinned && (
                        <Badge variant="default" className="text-xs">
                          <Pin className="h-3 w-3 mr-1" /> 置顶
                        </Badge>
                      )}
                      {post.isLocked && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" /> 锁定
                        </Badge>
                      )}
                    </div>

                    <h2 className="text-lg font-semibold mb-1 line-clamp-1">
                      {post.title}
                    </h2>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {stripHtml(post.content)}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{post.author.name || '匿名用户'}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {post._count.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.viewCount}
                      </span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无帖子</p>
          <Button variant="link" asChild className="mt-2">
            <Link href={`/disciplines/${slug}/posts/new`}>成为第一个发帖的人</Link>
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一页
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
