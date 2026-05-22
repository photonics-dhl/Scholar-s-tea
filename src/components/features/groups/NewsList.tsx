'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsItem {
  id: string;
  title: string;
  content: string | null;
  coverImage: string | null;
  createdAt: string;
}

interface NewsResponse {
  success: boolean;
  data: NewsItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface NewsListProps {
  groupId: string;
}

export function NewsList({ groupId }: NewsListProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNews = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/news?page=${pageNum}`);
      const data: NewsResponse = await res.json();

      if (data.success) {
        setNews(data.data);
        setTotalPages(data.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [groupId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Calendar className="mx-auto h-12 w-12 opacity-50" />
        <p className="mt-4">暂无动态</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {news.map((item) => (
        <div key={item.id} className="rounded-lg border bg-card p-4">
          {item.coverImage && (
            <div className="relative mb-3 h-40 w-full rounded-md overflow-hidden">
              <Image
                src={item.coverImage}
                alt={item.title}
                fill
                className="object-cover rounded-md"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          )}
          <h3 className="font-medium">{item.title}</h3>
          {item.content && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
              {item.content}
            </p>
          )}
          <p className="mt-2 flex items-center text-xs text-muted-foreground">
            <Calendar className="mr-1 h-3 w-3" />
            {new Date(item.createdAt).toLocaleDateString('zh-CN')}
          </p>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
