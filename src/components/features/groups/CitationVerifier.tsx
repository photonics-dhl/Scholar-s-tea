'use client';

import { useState, useEffect } from 'react';
import { Check, X, ExternalLink, Quote, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

interface PendingCitation {
  id: string;
  context: string | null;
  createdAt: string;
  citingUser: { id: string; name: string | null; avatar: string | null };
  publication: { id: string; title: string };
  group: { id: string; name: string };
  citingPost: { id: string; title: string } | null;
  citingComment: { id: string; content: string } | null;
}

interface PendingResponse {
  success: boolean;
  data: PendingCitation[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function CitationVerifier() {
  const [citations, setCitations] = useState<PendingCitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingCitation | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/citations/pending');
      const data: PendingResponse = await res.json();
      if (data.success) {
        setCitations(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pending citations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    if (action === 'REJECTED' && !rejectNote.trim()) {
      return;
    }

    setProcessing(true);
    try {
      const verifierId = 'admin-user'; // TODO: get from session

      const res = await fetch(`/api/v1/citations/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          verifierId,
          rejectionNote: rejectNote,
        }),
      });

      if (res.ok) {
        setCitations(prev => prev.filter(c => c.id !== id));
        setSelected(null);
        setRejectNote('');
        setRejecting(false);
      }
    } catch (error) {
      console.error('Failed to verify citation:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">引用审核</h2>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (citations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5" />
            引用审核
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">暂无待审核引用</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">引用审核 ({citations.length})</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 列表 */}
        <div className="space-y-3">
          {citations.map(citation => (
            <Card
              key={citation.id}
              className={`cursor-pointer transition-colors ${
                selected?.id === citation.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => {
                setSelected(citation);
                setRejecting(false);
                setRejectNote('');
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{citation.publication.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      课题组：{citation.group.name}
                    </p>
                    {citation.context && (
                      <p className="text-sm mt-2 line-clamp-2">
                        &ldquo;{citation.context}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      by {citation.citingUser.name || '匿名'}
                    </p>
                  </div>
                  <Badge variant="secondary">待审核</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 详情 */}
        {selected && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">审核详情</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">被引用论文</p>
                <p className="text-sm mt-1">{selected.publication.title}</p>
              </div>

              <div>
                <p className="text-sm font-medium">所属课题组</p>
                <p className="text-sm mt-1">{selected.group.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium">引用者</p>
                <p className="text-sm mt-1">{selected.citingUser.name || '匿名用户'}</p>
              </div>

              {selected.citingPost && (
                <div>
                  <p className="text-sm font-medium">来源帖子</p>
                  <a
                    href={`/disciplines/posts/${selected.citingPost.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    {selected.citingPost.title}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {selected.citingComment && (
                <div>
                  <p className="text-sm font-medium">引用说明</p>
                  <p className="text-sm mt-1 bg-muted p-2 rounded">
                    {selected.citingComment.content}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">操作</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleVerify(selected.id, 'APPROVED')}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-1 h-4 w-4" />
                    通过
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRejecting(true)}
                    disabled={processing}
                  >
                    <X className="mr-1 h-4 w-4" />
                    拒绝
                  </Button>
                </div>

                {rejecting && (
                  <div className="mt-4 space-y-2">
                    <Textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="请输入拒绝原因..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleVerify(selected.id, 'REJECTED')}
                        disabled={processing || !rejectNote.trim()}
                      >
                        确认拒绝
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejecting(false);
                          setRejectNote('');
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
