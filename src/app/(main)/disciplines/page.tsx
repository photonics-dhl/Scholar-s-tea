'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, BookOpen, Users, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface Discipline {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  level: number;
  _count: {
    posts: number;
    groups: number;
  };
  children?: Discipline[];
}

function DisciplineCard({ discipline, animationDelay = 0 }: { discipline: Discipline; animationDelay?: number }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in-up border-journal-border/60 hover:border-journal-gold/50" style={{ animationDelay: `${animationDelay}ms` }}>
      <CardContent className="p-0">
        {/* Header with gold accent top border */}
        <div className="p-6 border-b border-journal-border/40 bg-gradient-to-r from-journal-primary/[0.03] to-transparent relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-journal-gold via-journal-gold/60 to-transparent" />
          <div className="flex items-start justify-between gap-4">
            <Link
              href={`/disciplines/${discipline.slug}`}
              className="flex-1 min-w-0 group/title"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-journal-primary/10 group-hover/title:bg-journal-primary/20 transition-colors">
                  <BookOpen className="h-5 w-5 text-journal-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-serif font-semibold truncate group-hover/title:text-journal-primary transition-colors">
                    {discipline.name}
                  </h2>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              {discipline.description && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2 pl-[52px] font-source-serif leading-relaxed">
                  {discipline.description}
                </p>
              )}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-3.5 flex items-center gap-6 text-sm text-muted-foreground bg-muted/20">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-journal-primary/70" />
            <span className="font-medium text-foreground">{discipline._count.groups}</span>
            <span>课题组</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-journal-gold/70" />
            <span className="font-medium text-foreground">{discipline._count.posts}</span>
            <span>帖子</span>
          </div>
        </div>

        {/* Children */}
        {discipline.children && discipline.children.length > 0 && (
          <div className="px-6 py-4 border-t border-journal-border/30">
            <div className="flex flex-wrap gap-2">
              {discipline.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/disciplines/${child.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-background px-3.5 py-1.5 text-sm border border-journal-border/50 hover:border-journal-gold hover:text-journal-primary hover:bg-journal-gold/5 transition-all duration-200"
                >
                  <span className="truncate max-w-[120px]">{child.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-journal-primary/10 text-journal-primary border-0">
                    {child._count.groups}组
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DisciplinePageSkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function DisciplinesPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/disciplines')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDisciplines(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <DisciplinePageSkeleton />;
  }

  return (
    <div>
      {/* Scholarly Page Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-journal-primary/[0.08] via-journal-primary/[0.02] to-transparent border-b border-journal-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-journal-gold/10 via-transparent to-transparent" />
        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-1 rounded-full bg-journal-gold" />
              <span className="text-sm font-medium text-journal-primary tracking-wide uppercase">Academic Community</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground">
              学科社区
            </h1>
            <p className="mt-4 text-lg text-muted-foreground font-source-serif leading-relaxed max-w-2xl">
              探索不同学科领域，与学者们交流思想
              <span className="mx-2 text-journal-gold">·</span>
              共{' '}
              <span className="font-semibold text-foreground">{disciplines.length}</span>{' '}
              个一级学科
            </p>
          </div>
        </div>
      </section>

      {/* Disciplines Grid */}
      <div className="container mx-auto py-10">
        {disciplines.length > 0 ? (
          <div className="grid gap-5">
            {disciplines.map((discipline, index) => (
              <DisciplineCard key={discipline.id} discipline={discipline} animationDelay={index * 100} />
            ))}
          </div>
        ) : (
          <Card className="p-16 text-center border-journal-border/40">
            <BookOpen className="h-14 w-14 mx-auto text-journal-primary/30 mb-4" />
            <h3 className="mt-4 font-serif font-medium text-xl">暂无学科</h3>
            <p className="mt-2 text-sm text-muted-foreground font-source-serif">
              敬请期待，即将上线
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
