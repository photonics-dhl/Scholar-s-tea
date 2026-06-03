'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GroupCard } from '@/components/features/groups/GroupCard';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface Group {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  institution: {
    name: string;
    logo: string | null;
  };
  _count: {
    members: number;
    publications: number;
    news: number;
    patents: number;
  };
}

interface GroupsResponse {
  success: boolean;
  data: Group[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function GroupsPage() {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchGroups = async (searchTerm = '', pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '12',
      });
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/v1/groups?${params}`);
      const data: GroupsResponse = await res.json();

      if (data.success) {
        setGroups(data.data);
        setTotalPages(data.meta.totalPages);
        setTotal(data.meta.total);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGroups(search, 1);
  };

  return (
    <div>
      {/* Scholarly Page Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-journal-primary/[0.08] via-journal-primary/[0.02] to-transparent border-b border-journal-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-journal-gold/10 via-transparent to-transparent" />
        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="flex items-end justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-1 rounded-full bg-journal-gold" />
                <span className="text-sm font-medium text-journal-primary tracking-wide uppercase">Research Groups</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground">
                {t.groups.title}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground font-source-serif leading-relaxed">
                {t.groups.description}
                <span className="mx-2 text-journal-gold">·</span>
                {t.groups.of} <span className="font-semibold text-foreground">{total}</span> {t.groups.title}
              </p>
            </div>
            <Link href="/groups/new" className="hidden sm:block">
              <Button variant="journal" size="lg">
                <Plus className="mr-2 h-4 w-4" />
                {t.groups.createGroup}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto py-10">
        {/* Search & Filters */}
        <div className="mb-8 flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.groups.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 focus-visible:ring-journal-primary/30 focus-visible:border-journal-primary/50"
              />
            </div>
            <Button type="submit" variant="journal-outline">
              {t.common.search}
            </Button>
          </form>
          <Button variant="outline" size="icon" className="border-journal-border/50 hover:border-journal-gold/50">
            <Filter className="h-4 w-4" />
          </Button>
          <Link href="/groups/new" className="sm:hidden">
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border bg-card p-4">
                <div className="h-24 bg-muted rounded-lg" />
                <div className="mt-4 h-4 w-2/3 bg-muted rounded" />
                <div className="mt-2 h-3 w-1/2 bg-muted rounded" />
                <div className="mt-4 h-3 w-full bg-muted rounded" />
                <div className="mt-2 h-3 w-3/4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-journal-primary/10 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-journal-primary/50" />
            </div>
            <p className="text-muted-foreground font-source-serif text-lg">{t.groups.empty}</p>
            <Link href="/groups/new" className="mt-4">
              <Button variant="journal">{t.groups.createGroup}</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    const newPage = page - 1;
                    setPage(newPage);
                    fetchGroups(search, newPage);
                  }}
                  disabled={page === 1}
                  className="border-journal-border/50"
                >
                  {t.common.back}
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  <span className="font-medium text-foreground">{page}</span> / {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newPage = page + 1;
                    setPage(newPage);
                    fetchGroups(search, newPage);
                  }}
                  disabled={page === totalPages}
                  className="border-journal-border/50"
                >
                  {t.common.next}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
