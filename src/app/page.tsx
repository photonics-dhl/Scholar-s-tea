'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Search, Sparkles, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { ContentFeed } from '@/components/features/home/ContentFeed'
import { Sidebar } from '@/components/features/home/Sidebar'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Stats {
  groups: number
  publications: number
  posts: number
  users: number
}

interface ActiveGroup {
  id: string
  slug: string
  name: string
  institution: string
  members: number
}

export default function HomePage() {
  const { data: session } = useSession()
  const { lang, t } = useLanguage()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeGroups, setActiveGroups] = useState<ActiveGroup[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/groups?pageSize=6').then((r) => r.json()),
      fetch('/api/v1/posts?pageSize=1').then((r) => r.json()).catch(() => ({ success: false, data: [], meta: { total: 0 } })),
      fetch('/api/v1/publications?pageSize=1').then((r) => r.json()).catch(() => ({ success: false, data: [], meta: { total: 0 } })),
      fetch('/api/v1/public-stats').then((r) => r.json()).catch(() => ({ success: false, data: { users: 0 } })),
    ]).then(([groupsData, postsData, pubsData, statsData]) => {
      if (groupsData.success) {
        setStats({
          groups: groupsData.meta.total,
          publications: pubsData.meta?.total || 0,
          posts: postsData.meta?.total || 0,
          users: statsData.data?.users || 0,
        })
        setActiveGroups(
          groupsData.data.map((g: { id: string; slug: string; name: string; institution: { name: string }; _count: { members: number } }) => ({
            id: g.id,
            slug: g.slug,
            name: g.name,
            institution: g.institution.name,
            members: g._count.members,
          }))
        )
      }
    }).catch(() => {})
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/groups?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ===== Hero Section (精简) ===== */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="max-w-2xl mx-auto text-center">
            {/* Brand */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-serif font-semibold">{t.home.title}</h1>
            </div>

            {/* Tagline */}
            <p className="text-sm text-muted-foreground mb-6">
              {t.home.description}
              <span className="text-primary font-medium">{t.home.aiAssistantHighlight}</span>
              {t.home.descriptionSuffix}
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.home.searchPlaceholder}
                  className="pl-10 pr-20 h-10 text-sm rounded-lg border-muted-foreground/20 focus-visible:ring-primary/30"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-3 h-7 text-xs"
                >
                  {t.home.searchButton}
                </Button>
              </div>
            </form>

            {/* CTA buttons */}
            <div className="flex items-center justify-center gap-3">
              <Button size="sm" asChild>
                <Link href="/workshop">
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  {t.home.tryAI}
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/disciplines">{t.home.exploreDisciplines}</Link>
              </Button>
              {!session?.user && (
                <Button size="sm" variant="secondary" asChild>
                  <Link href="/signin">{t.home.loginCTA}</Link>
                </Button>
              )}
            </div>

            {/* Welcome back */}
            {session?.user && (
              <p className="mt-3 text-xs text-muted-foreground">
                {t.home.welcomeBack}，{session.user.name || session.user.email}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ===== Main Content (双栏) ===== */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex gap-6 items-start">
          {/* Left: Content Feed */}
          <div className="flex-1 min-w-0">
            <ContentFeed />
          </div>

          {/* Right: Sidebar */}
          <aside className="w-72 hidden lg:block flex-shrink-0 sticky top-20">
            <Sidebar stats={stats} activeGroups={activeGroups} />
          </aside>
        </div>
      </section>

      {/* ===== Footer (精简) ===== */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              <span className="font-medium">{t.home.footer.brand}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/disciplines" className="hover:text-foreground transition-colors">{t.nav.disciplines}</Link>
              <Link href="/groups" className="hover:text-foreground transition-colors">{t.nav.groups}</Link>
              <Link href="/top-questions" className="hover:text-foreground transition-colors">{t.nav.top10}</Link>
              <Link href="/workshop" className="hover:text-foreground transition-colors">{t.nav.workshop}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
