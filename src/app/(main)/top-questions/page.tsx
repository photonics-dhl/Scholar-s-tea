'use client';

import { useState, useEffect } from 'react';
import { Trophy, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TopQuestion {
  id: string;
  title: string;
  voteCount: number;
  author: {
    name: string | null;
  };
  createdAt: string;
}

interface TopQuestionsResponse {
  success: boolean;
  data: TopQuestion[];
}

export default function TopQuestionsPage() {
  const [questions, setQuestions] = useState<TopQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);

  useEffect(() => {
    fetch(`/api/v1/top-questions?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data: TopQuestionsResponse) => {
        if (data.success) {
          setQuestions(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  const getRankStyle = (index: number) => {
    if (index === 0) return 'from-yellow-500/15 to-amber-500/5 border-yellow-400/30';
    if (index === 1) return 'from-slate-300/20 to-slate-400/5 border-slate-400/30';
    if (index === 2) return 'from-orange-400/15 to-amber-700/5 border-orange-400/30';
    return 'from-journal-primary/[0.03] to-transparent border-journal-border/30';
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white';
    if (index === 1) return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white';
    if (index === 2) return 'bg-gradient-to-r from-orange-400 to-amber-600 text-white';
    return 'bg-journal-primary/10 text-journal-primary';
  };

  return (
    <div>
      {/* Scholarly Page Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-journal-primary/[0.08] via-journal-primary/[0.02] to-transparent border-b border-journal-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-journal-gold/10 via-transparent to-transparent" />
        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-journal-gold" />
              <span className="text-sm font-medium text-journal-primary tracking-wide uppercase">Community Ranking</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground">
              TOP10 问题
            </h1>
            <p className="mt-4 text-lg text-muted-foreground font-source-serif leading-relaxed">
              每月最受欢迎的研究讨论，看看社区最热门的话题
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto py-10">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border border-journal-border/30">
            <Calendar className="h-4 w-4 text-journal-primary" />
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-sm font-medium outline-none"
            >
              <option value={2026}>2026年</option>
              <option value={2025}>2025年</option>
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent text-sm font-medium outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}月</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-muted-foreground">
            {year}年{month}月 TOP10
          </span>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <Card className="p-16 text-center border-journal-border/40">
            <div className="h-16 w-16 rounded-2xl bg-journal-gold/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-journal-gold/50" />
            </div>
            <h3 className="font-serif font-medium text-xl mb-2">暂无排名数据</h3>
            <p className="text-muted-foreground font-source-serif">
              {year}年{month}月还没有帖子获得投票
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <Card
                key={question.id}
                className={`border bg-gradient-to-r ${getRankStyle(index)} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in-up`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${getRankBadge(index)}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate group-hover:text-journal-primary transition-colors">
                      {question.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{question.author.name || '匿名用户'}</span>
                      <span>{new Date(question.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-journal-gold">
                    <TrendingUp className="h-4 w-4" />
                    {question.voteCount}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
