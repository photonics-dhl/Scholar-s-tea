'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Star, Quote, ThumbsUp, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ScoreHistory {
  id: string;
  score: number;
  recordedAt: string;
}

interface ScoreBreakdown {
  citation: {
    count: number;
    withContext: number;
    points: number;
  };
  community: {
    followers: number;
    votesSum: number;
    points: number;
  };
  activity: {
    recentNews: number;
    publicationsCount: number;
    points: number;
  };
}

interface ScoreResponse {
  success: boolean;
  data: {
    score: number;
    history: ScoreHistory[];
    breakdown?: ScoreBreakdown;
  };
}

interface GroupScoreProps {
  groupId: string;
  initialScore?: number;
  initialRank?: number;
}

export function GroupScore({ groupId, initialScore, initialRank }: GroupScoreProps) {
  const [score, setScore] = useState<number | null>(initialScore ?? null);
  const [rank, setRank] = useState<number | null>(initialRank ?? null);
  const [history, setHistory] = useState<ScoreHistory[]>([]);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(!initialScore);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await fetch(`/api/v1/groups/${groupId}/score`);
        const data: ScoreResponse = await res.json();

        if (data.success) {
          setScore(data.data.score);
          setHistory(data.data.history || []);
          if (data.data.breakdown) {
            setBreakdown(data.data.breakdown);
          }
        }
      } catch (error) {
        console.error('Failed to fetch score:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!initialScore) {
      fetchScore();
    }
  }, [groupId, initialScore]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/score`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setScore(data.data.score);
        setBreakdown(data.data.breakdown);
        const historyRes = await fetch(`/api/v1/groups/${groupId}/score`);
        const historyData = await historyRes.json();
        if (historyData.success) {
          setHistory(historyData.data.history || []);
        }
      }
    } catch (error) {
      console.error('Failed to recalculate score:', error);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">课题组评分</CardTitle>
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            课题组评分
          </CardTitle>
          <div className="flex items-center gap-2">
            {rank && <Badge variant="outline">排名 #{rank}</Badge>}
            {score !== null && (
              <span className="text-2xl font-bold text-primary">{score}</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {breakdown && (
          <div className="space-y-3 mb-4">
            {/* 社区引用 40% */}
            <div className="border-b pb-3">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Quote className="h-3 w-3" />
                社区引用 (40%)
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">引用次数</span>
                  <p className="font-medium">{breakdown.citation.count}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">高质量引用</span>
                  <p className="font-medium">{breakdown.citation.withContext}</p>
                </div>
              </div>
              <p className="text-xs text-primary mt-1">+{breakdown.citation.points} 分</p>
            </div>

            {/* 社区认可 30% */}
            <div className="border-b pb-3">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                社区认可 (30%)
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">关注者</span>
                  <p className="font-medium">{breakdown.community.followers}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">帖子赞踩</span>
                  <p className="font-medium">{breakdown.community.votesSum > 0 ? '+' : ''}{breakdown.community.votesSum}</p>
                </div>
              </div>
              <p className="text-xs text-primary mt-1">+{breakdown.community.points} 分</p>
            </div>

            {/* 活跃度 30% */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                活跃度 (30%)
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">30天动态</span>
                  <p className="font-medium">{breakdown.activity.recentNews}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">论文总数</span>
                  <p className="font-medium">{breakdown.activity.publicationsCount}</p>
                </div>
              </div>
              <p className="text-xs text-primary mt-1">+{breakdown.activity.points} 分</p>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">评分历史</p>
            <div className="flex items-end gap-1 h-12">
              {history.slice(0, 10).reverse().map((h) => (
                <div
                  key={h.id}
                  className="flex-1 bg-primary/20 rounded-t hover:bg-primary/30 transition-colors relative group"
                  style={{ height: `${Math.max(20, (h.score / (history[0]?.score || 1)) * 100)}%` }}
                  title={`${h.score} 分 (${new Date(h.recordedAt).toLocaleDateString()})`}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {h.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="mt-3 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          {recalculating ? '重新计算中...' : '重新计算评分'}
        </button>
      </CardContent>
    </Card>
  );
}
