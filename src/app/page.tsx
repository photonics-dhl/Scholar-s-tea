'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  BookOpen,
  Users,
  MessageSquare,
  FileText,
  Trophy,
  Search,
  ArrowRight,
  TrendingUp,
  Flame,
  Coffee,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { StatCard } from '@/components/features/home/StatCard'
import { ActivityFeed } from '@/components/features/home/ActivityFeed'
import { QuickActionGrid } from '@/components/features/home/QuickActionGrid'
import { ContributorWall } from '@/components/features/home/ContributorWall'

interface Stats {
  groups: number
  publications: number
  posts: number
  users: number
}

interface FeedPost {
  id: string
  title: string
  author: string
  time: string
}

interface FeedPublication {
  id: string
  title: string
  authors: string
  journal?: string
  time: string
  citationCount?: number
  doi?: string | null
}

interface FeedGroup {
  id: string
  name: string
  institution: string
  members: number
  time: string
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentPosts, setRecentPosts] = useState<FeedPost[]>([])
  const [recentPubs, setRecentPubs] = useState<FeedPublication[]>([])
  const [activeGroups, setActiveGroups] = useState<FeedGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/groups?pageSize=4').then((r) => r.json()),
      fetch('/api/v1/disciplines').then((r) => r.json()),
      fetch('/api/v1/posts?pageSize=6').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/v1/publications?pageSize=4').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
    ]).then(([groupsData, disciplinesData, postsData, pubsData]) => {
      if (groupsData.success) {
        setStats({
          groups: groupsData.meta.total,
          publications: pubsData.meta?.total || 0,
          posts: postsData.meta?.total || 0,
          users: 0,
        })

        // Build active groups feed
        setActiveGroups(
          groupsData.data.map((g: { id: string; name: string; institution: { name: string }; _count: { members: number } }) => ({
            id: g.id,
            name: g.name,
            institution: g.institution.name,
            members: g._count.members,
            time: '最近活跃',
          }))
        )
      }

      if (postsData.success) {
        setRecentPosts(
          postsData.data.map((p: { id: string; title: string; author: { name: string | null }; createdAt: string }) => ({
            id: p.id,
            title: p.title,
            author: p.author?.name || '匿名用户',
            time: new Date(p.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          }))
        )
      }

      if (pubsData.success) {
        setRecentPubs(
          pubsData.data.map((p: { id: string; title: string; authors: string[]; year?: number; doi?: string | null; citationCount: number; createdAt: string }) => ({
            id: p.id,
            title: p.title,
            authors: p.authors?.join(', ') || '未知作者',
            journal: p.doi ? `DOI: ${p.doi}` : undefined,
            time: p.year ? `${p.year}年` : new Date(p.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
            citationCount: p.citationCount,
            doi: p.doi,
          }))
        )
      }

      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/groups?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const getPubHref = (pub: FeedPublication) => {
    if (pub.doi) return `https://doi.org/${pub.doi}`
    return `/publications/${pub.id}`
  }

  // Demo contributors
  const demoContributors = [
    { id: '1', name: '张明', initials: 'ZM', color: 'bg-journal-primary/20 text-journal-primary' },
    { id: '2', name: '李华', initials: 'LH', color: 'bg-tea-primary/20 text-tea-primary' },
    { id: '3', name: '王芳', initials: 'WF', color: 'bg-journal-gold/20 text-journal-gold' },
    { id: '4', name: '赵强', initials: 'ZQ', color: 'bg-convo-blue/20 text-convo-blue' },
    { id: '5', name: '刘洋', initials: 'LY', color: 'bg-tea-accent/20 text-tea-accent' },
    { id: '6', name: '陈静', initials: 'CJ', color: 'bg-journal-primary/20 text-journal-primary' },
    { id: '7', name: '杨帆', initials: 'YF', color: 'bg-tea-primary/20 text-tea-primary' },
    { id: '8', name: '黄磊', initials: 'HL', color: 'bg-journal-gold/20 text-journal-gold' },
    { id: '9', name: '吴雪', initials: 'WX', color: 'bg-convo-blue/20 text-convo-blue' },
    { id: '10', name: '徐明', initials: 'XM', color: 'bg-tea-accent/20 text-tea-accent' },
    { id: '11', name: '孙丽', initials: 'SL', color: 'bg-journal-primary/20 text-journal-primary' },
    { id: '12', name: '马超', initials: 'MC', color: 'bg-tea-primary/20 text-tea-primary' },
  ]

  return (
    <div className="min-h-screen">
      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        {/* Animated background dots */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-journal-primary/30 animate-pulse" />
          <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-tea-primary/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-40 left-1/4 w-1.5 h-1.5 rounded-full bg-journal-gold/30 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 right-1/3 w-2 h-2 rounded-full bg-convo-blue/20 animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/3 right-10 w-1 h-1 rounded-full bg-tea-accent/30 animate-pulse" style={{ animationDelay: '0.8s' }} />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm font-normal animate-fade-in-up">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
              高校学术交流社区 · AI 赋能研究
            </Badge>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              学者茶话会
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-3 animate-fade-in-up font-sans" style={{ animationDelay: '200ms' }}>
              Scholar&apos;s Tea
            </p>
            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              连接优秀研究者，分享学术见解，发现前沿研究。
              <span className="text-tea-primary font-medium">AI 助手</span>随时为你提供论文分析、基金申请、文献综述等学术支持。
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="max-w-xl mx-auto mb-8 animate-fade-in-up"
              style={{ animationDelay: '400ms' }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索课题组、学科、论文..."
                  className="pl-12 pr-24 h-12 text-base rounded-full border-primary/20 focus-visible:ring-primary/30 shadow-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-4"
                >
                  搜索
                </Button>
              </div>
            </form>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <Button size="lg" asChild className="px-8">
                <Link href="/workshop">
                  <Sparkles className="mr-2 h-5 w-5" />
                  试试 AI 助手
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="px-8">
                <Link href="/disciplines">
                  <BookOpen className="mr-2 h-5 w-5" />
                  探索学科
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Stats Dashboard ===== */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard
              value={stats?.groups || 0}
              label="课题组"
              color="text-primary"
              borderColor="border-primary/20"
              trend={12}
              delay={0}
            />
            <StatCard
              value={stats?.publications || 0}
              label="发表论文"
              color="text-journal-primary"
              borderColor="border-journal-primary/20"
              delay={100}
            />
            <StatCard
              value={stats?.posts || 0}
              label="讨论帖子"
              color="text-journal-gold"
              borderColor="border-journal-gold/20"
              trend={8}
              delay={200}
            />
            <StatCard
              value={stats?.users || 0}
              label="注册用户"
              color="text-tea-primary"
              borderColor="border-tea-primary/20"
              delay={300}
            />
          </div>
        )}
      </section>

      {/* ===== Activity Feeds ===== */}
      <section className="container mx-auto px-4 py-12 space-y-10">
        {/* Posts feed */}
        <ActivityFeed
          title="最新讨论"
          icon={<MessageSquare className="h-5 w-5 text-journal-gold" />}
          items={recentPosts.map((p) => ({
            id: p.id,
            type: 'post' as const,
            title: p.title,
            author: p.author,
            time: p.time,
            href: `/disciplines/uncategorized/posts/${p.id}`,
          }))}
          color="border-journal-gold/20 hover:border-journal-gold/40"
          delay={100}
        />

        {/* Publications feed */}
        <ActivityFeed
          title="热门论文"
          icon={<FileText className="h-5 w-5 text-journal-primary" />}
          items={recentPubs.map((p) => ({
            id: p.id,
            type: 'publication' as const,
            title: p.title,
            source: p.authors,
            time: p.time,
            stats: { label: '引用', value: p.citationCount || 0 },
            href: getPubHref(p),
          }))}
          color="border-journal-primary/20 hover:border-journal-primary/40"
          delay={200}
        />

        {/* Active groups feed */}
        <ActivityFeed
          title="活跃课题组"
          icon={<Users className="h-5 w-5 text-tea-primary" />}
          items={activeGroups.map((g) => ({
            id: g.id,
            type: 'group' as const,
            title: g.name,
            summary: g.institution,
            time: g.time,
            stats: { label: '成员', value: g.members },
            href: `/groups/${g.id}`,
          }))}
          color="border-tea-primary/20 hover:border-tea-primary/40"
          delay={300}
        />
      </section>

      {/* ===== Quick Actions ===== */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">快捷入口</h2>
        </div>
        <QuickActionGrid />
      </section>

      {/* ===== Contributor Wall ===== */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-5 w-5 text-tea-primary" />
            <h2 className="text-xl font-semibold">活跃学者</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            加入 {stats?.users || 0}+ 研究者的学术交流社区
          </p>
        </div>
        <ContributorWall contributors={demoContributors} />
      </section>

      {/* ===== TOP10 CTA ===== */}
      <section className="container mx-auto px-4 pb-16">
        <div className="rounded-2xl bg-gradient-to-r from-journal-primary/10 via-journal-gold/5 to-transparent border border-journal-gold/20 overflow-hidden p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-semibold text-xl mb-1">TOP10 问题</h3>
              <p className="text-muted-foreground">
                每月最受欢迎的研究讨论，看看社区最热门的话题
              </p>
            </div>
            <Button size="lg" asChild className="flex-shrink-0">
              <Link href="/top-questions">
                查看排行
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-semibold">Scholar&apos;s Tea 学者茶话会</span>
            </div>
            <p className="text-sm text-muted-foreground">
              高校学术交流社区 · 连接学者，创造价值
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/disciplines" className="hover:text-foreground transition-colors">学科</Link>
              <Link href="/groups" className="hover:text-foreground transition-colors">课题组</Link>
              <Link href="/top-questions" className="hover:text-foreground transition-colors">TOP10</Link>
              <Link href="/tea-party" className="hover:text-foreground transition-colors">茶话会</Link>
              <Link href="/workshop" className="hover:text-foreground transition-colors">思想工坊</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
