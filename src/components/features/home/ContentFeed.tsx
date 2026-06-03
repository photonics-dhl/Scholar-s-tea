'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Flame, BookOpen, Users, MessageSquare, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { FeedCard, type FeedItem } from './FeedCard'

interface FeedData {
  posts: Array<{
    id: string
    title: string
    author: { name: string | null }
    createdAt: string
    content?: string
    viewCount?: number
    score?: number
    discipline?: { name: string }
    _count?: { comments: number; votes: number }
  }>
  publications: Array<{
    id: string
    title: string
    authors: string[]
    year?: number
    doi?: string | null
    citationCount: number
    createdAt: string
    journal?: string
  }>
  groups: Array<{
    id: string
    slug: string
    name: string
    institution: { name: string }
    _count: { members: number }
    description?: string
  }>
  topQuestions: Array<{
    rank: number
    voteCount: number
    post: {
      id: string
      title: string
      topTenVotes: number
      createdAt: string
      author?: { name: string | null }
    }
  }>
}

type FeedTab = 'recommend' | 'hot' | 'following' | 'papers'

export function ContentFeed() {
  const { data: session } = useSession()
  const { lang, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<FeedTab>(session?.user ? 'recommend' : 'hot')
  const [feedData, setFeedData] = useState<FeedData | null>(null)
  const [loading, setLoading] = useState(true)

  // Update default tab when session changes
  useEffect(() => {
    setActiveTab(session?.user ? 'recommend' : 'hot')
  }, [session?.user])

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/posts?pageSize=8').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/v1/publications?pageSize=6').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/v1/groups?pageSize=6').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/v1/top-questions?pageSize=5').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
    ]).then(([postsData, pubsData, groupsData, topData]) => {
      setFeedData({
        posts: postsData.success ? postsData.data : [],
        publications: pubsData.success ? pubsData.data : [],
        groups: groupsData.success ? groupsData.data : [],
        topQuestions: topData.success ? (topData.data?.entries || []) : [],
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const stripHtml = (html: string): string => {
    if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, '')
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const formatDate = (dateString: string): string => {
    if (typeof window === 'undefined') return dateString.slice(0, 10)
    return new Date(dateString).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const tabs: { key: FeedTab; label: string; icon: typeof Flame }[] = [
    { key: 'recommend', label: t.home.feed.recommend, icon: BookOpen },
    { key: 'hot', label: t.home.feed.hot, icon: Flame },
    { key: 'following', label: t.home.feed.following, icon: Users },
    { key: 'papers', label: t.home.feed.papers, icon: MessageSquare },
  ]

  const getFeedItems = (): FeedItem[] => {
    if (!feedData) return []

    switch (activeTab) {
      case 'recommend': {
        // Mix posts, publications, and groups
        const items: FeedItem[] = []
        feedData.posts.slice(0, 4).forEach((p) => {
          items.push({
            id: `post-${p.id}`,
            type: 'post',
            title: p.title,
            summary: stripHtml(p.content || '').slice(0, 120) + (p.content && stripHtml(p.content).length > 120 ? '...' : ''),
            author: p.author?.name || 'Anonymous',
            time: formatDate(p.createdAt),
            href: `/disciplines/uncategorized/posts/${p.id}`,
            discipline: p.discipline?.name,
            stats: { likes: p.score || 0, comments: p._count?.comments || 0 },
          })
        })
        feedData.publications.slice(0, 3).forEach((p) => {
          items.push({
            id: `pub-${p.id}`,
            type: 'publication',
            title: p.title,
            summary: p.authors?.join(', ') || 'Unknown',
            author: p.authors?.[0] || 'Unknown',
            time: p.year ? `${p.year}` : formatDate(p.createdAt),
            href: p.doi ? `https://doi.org/${p.doi}` : `/publications/${p.id}`,
            stats: { citations: p.citationCount },
            meta: p.journal || undefined,
          })
        })
        feedData.groups.slice(0, 2).forEach((g) => {
          items.push({
            id: `group-${g.id}`,
            type: 'group',
            title: g.name,
            summary: g.description?.slice(0, 100) || g.institution.name,
            author: g.institution.name,
            time: '',
            href: `/groups/${g.slug || g.id}`,
            stats: { members: g._count.members },
          })
        })
        // Shuffle-ish: alternate types
        return items.sort(() => Math.random() - 0.5).slice(0, 8)
      }

      case 'hot': {
        // Top questions + high-engagement posts
        const items: FeedItem[] = []
        feedData.topQuestions.forEach((entry) => {
          const post = entry.post
          items.push({
            id: `top-${post.id}`,
            type: 'post',
            title: post.title,
            author: post.author?.name || 'Community',
            time: formatDate(post.createdAt),
            href: `/disciplines/uncategorized/posts/${post.id}`,
            stats: { likes: entry.voteCount },
          })
        })
        feedData.posts.slice(0, 5).forEach((p) => {
          items.push({
            id: `post-${p.id}`,
            type: 'post',
            title: p.title,
            summary: stripHtml(p.content || '').slice(0, 120) + (p.content && stripHtml(p.content).length > 120 ? '...' : ''),
            author: p.author?.name || 'Anonymous',
            time: formatDate(p.createdAt),
            href: `/disciplines/uncategorized/posts/${p.id}`,
            stats: { likes: p.score || 0, comments: p._count?.comments || 0 },
          })
        })
        return items
      }

      case 'following': {
        // For now, same as recommend but with a note. In phase 4, fetch followed groups
        if (!session?.user) {
          return [{
            id: 'login-prompt',
            type: 'activity',
            title: lang === 'zh' ? '登录后查看关注内容' : 'Sign in to see followed content',
            summary: lang === 'zh' ? '关注你感兴趣的课题组和学科，获取个性化推荐' : 'Follow groups and disciplines for personalized recommendations',
            author: 'System',
            time: '',
            href: '/signin',
          }]
        }
        const items: FeedItem[] = []
        feedData.posts.slice(0, 6).forEach((p) => {
          items.push({
            id: `post-${p.id}`,
            type: 'post',
            title: p.title,
            summary: stripHtml(p.content || '').slice(0, 120) + (p.content && stripHtml(p.content).length > 120 ? '...' : ''),
            author: p.author?.name || 'Anonymous',
            time: formatDate(p.createdAt),
            href: `/disciplines/uncategorized/posts/${p.id}`,
            discipline: p.discipline?.name,
            stats: { likes: p.score || 0, comments: p._count?.comments || 0 },
          })
        })
        return items
      }

      case 'papers': {
        return feedData.publications.map((p) => ({
          id: `pub-${p.id}`,
          type: 'publication',
          title: p.title,
          summary: p.authors?.join(', ') || 'Unknown',
          author: p.authors?.[0] || 'Unknown',
          time: p.year ? `${p.year}` : formatDate(p.createdAt),
          href: p.doi ? `https://doi.org/${p.doi}` : `/publications/${p.id}`,
          stats: { citations: p.citationCount },
          meta: p.journal || undefined,
        }))
      }
    }
  }

  const items = getFeedItems()

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative',
                activeTab === tab.key
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Feed items */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <FeedCard key={item.id} item={item} lang={lang} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>{t.home.feed.empty}</p>
        </div>
      )}
    </div>
  )
}
