'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, FileText, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Publication {
  id: string;
  title: string;
  abstract: string | null;
  authors: string[];
  year: number | null;
  doi: string | null;
  url: string | null;
  citationCount: number;
  summary: string | null;
}

interface PublicationsResponse {
  success: boolean;
  data: Publication[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface PublicationsListProps {
  groupId: string;
}

export function PublicationsList({ groupId }: PublicationsListProps) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPublications = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/publications?page=${pageNum}`);
      const data: PublicationsResponse = await res.json();

      if (data.success) {
        setPublications(data.data);
        setTotalPages(data.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch publications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, [groupId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (publications.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <FileText className="mx-auto h-12 w-12 opacity-50" />
        <p className="mt-4">暂无论文</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {publications.map((pub) => (
        <div key={pub.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium">{pub.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {pub.authors.join(', ')} {pub.year && `(${pub.year})`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {pub.citationCount > 0 && (
                <Badge variant="secondary">
                  <Quote className="mr-1 h-3 w-3" />
                  {pub.citationCount}
                </Badge>
              )}
              {pub.url && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={pub.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {pub.abstract && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
              {pub.abstract}
            </p>
          )}

          {pub.summary && (
            <div className="mt-3 rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">AI 摘要</p>
              <p className="mt-1 text-sm">{pub.summary}</p>
            </div>
          )}

          {pub.doi && (
            <p className="mt-2 text-xs text-muted-foreground">
              DOI: {pub.doi}
            </p>
          )}
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
