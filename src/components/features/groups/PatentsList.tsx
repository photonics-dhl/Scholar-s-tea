'use client';

import { useState, useEffect } from 'react';
import { Award, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Patent {
  id: string;
  title: string;
  number: string | null;
  status: string | null;
  filingDate: string | null;
  createdAt: string;
}

interface PatentsResponse {
  success: boolean;
  data: Patent[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface PatentsListProps {
  groupId: string;
}

export function PatentsList({ groupId }: PatentsListProps) {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPatents = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/patents?page=${pageNum}`);
      const data: PatentsResponse = await res.json();

      if (data.success) {
        setPatents(data.data);
        setTotalPages(data.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch patents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatents();
  }, [groupId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (patents.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Award className="mx-auto h-12 w-12 opacity-50" />
        <p className="mt-4">暂无专利</p>
      </div>
    );
  }

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'granted':
      case '已授权':
        return <Badge>已授权</Badge>;
      case 'pending':
      case '申请中':
        return <Badge variant="secondary">申请中</Badge>;
      case 'published':
      case '已公开':
        return <Badge variant="outline">已公开</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {patents.map((patent) => (
        <div key={patent.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium">{patent.title}</h3>
              {patent.number && (
                <p className="mt-1 text-sm text-muted-foreground">
                  专利号：{patent.number}
                </p>
              )}
              {patent.filingDate && (
                <p className="mt-1 flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  申请日期：{new Date(patent.filingDate).toLocaleDateString('zh-CN')}
                </p>
              )}
            </div>
            {patent.status && getStatusBadge(patent.status)}
          </div>
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
