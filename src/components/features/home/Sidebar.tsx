'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Sparkles,
  Gavel,
  PenTool,
  FileText,
  Landmark,
  ImageIcon,
  Users,
  GraduationCap,
  ArrowRight,
  LogIn,
  UserPlus,
  Settings,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'
import { useLanguage } from '@/components/providers/LanguageProvider'

const toolLabels = ['peerReview', 'paperGen', 'paperHelper', 'grantApp', 'imageGen'] as const

interface SidebarProps {
  stats: {
    groups: number
    publications: number
    posts: number
    users: number
  } | null
  activeGroups: {
    id: string
    slug: string
    name: string
    institution: string
    members: number
  }[]
}

const aiTools = [
  { href: '/workshop?mode=peer_review', icon: Gavel, labelKey: 'peerReview', color: 'text-red-500 bg-red-500/10' },
  { href: '/workshop?mode=paper_generation', icon: PenTool, labelKey: 'paperGen', color: 'text-emerald-500 bg-emerald-500/10' },
  { href: '/workshop?mode=paper', icon: FileText, labelKey: 'paperHelper', color: 'text-journal-primary bg-journal-primary/10' },
  { href: '/workshop?mode=grant', icon: Landmark, labelKey: 'grantApp', color: 'text-journal-gold bg-journal-gold/10' },
  { href: '/workshop?mode=image_gen', icon: ImageIcon, labelKey: 'imageGen', color: 'text-purple-500 bg-purple-500/10' },
]

const hotDisciplines = [
  { name: '光学', nameEn: 'Optics', slug: 'optics' },
  { name: '材料科学', nameEn: 'Materials Science', slug: 'materials-science' },
  { name: '人工智能', nameEn: 'AI', slug: 'artificial-intelligence' },
  { name: '量子物理', nameEn: 'Quantum Physics', slug: 'quantum-physics' },
  { name: '生物医学', nameEn: 'Biomedicine', slug: 'biomedicine' },
  { name: '能源工程', nameEn: 'Energy Engineering', slug: 'energy-engineering' },
]

export function Sidebar({ stats, activeGroups }: SidebarProps) {
  const { data: session } = useSession()
  const { lang, t } = useLanguage()

  const user = session?.user

  return (
    <div className="space-y-5">
      {/* User Card / Login Prompt */}
      <div className="rounded-xl border bg-card p-4">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {(user.name || user.email || '?').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground">{t.home.welcomeBack}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
                <Link href="/groups">
                  <BookOpen className="h-3.5 w-3.5 mr-1" />
                  {t.home.sidebar.myGroups}
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
                <Link href="/profile">
                  <Settings className="h-3.5 w-3.5 mr-1" />
                  {t.home.sidebar.myProfile}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{t.home.sidebar.joinCommunity}</p>
                <p className="text-xs text-muted-foreground">{t.home.sidebar.loginPrompt}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-xs h-8" asChild>
                <Link href="/signin">
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  {t.home.sidebar.loginBtn}
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
                <Link href="/signup">
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  {t.home.sidebar.signupBtn}
                </Link>
              </Button>
            </div>
            {stats && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="text-center">
                  <p className="text-sm font-semibold">{stats.groups}</p>
                  <p className="text-[10px] text-muted-foreground">{t.home.stats.groups}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">{stats.publications}</p>
                  <p className="text-[10px] text-muted-foreground">{t.home.stats.publications}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">{stats.users}</p>
                  <p className="text-[10px] text-muted-foreground">{t.home.stats.users}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Toolbox */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-convo-blue" />
          <h3 className="font-medium text-sm">{t.home.sidebar.aiToolbox}</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {aiTools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted group"
              >
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', tool.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm flex-1">
                  {tool.labelKey === 'peerReview' ? t.home.sidebar.peerReview :
                   tool.labelKey === 'paperGen' ? t.home.sidebar.paperGen :
                   tool.labelKey === 'paperHelper' ? t.home.sidebar.paperHelper :
                   tool.labelKey === 'grantApp' ? t.home.sidebar.grantApp :
                   t.home.sidebar.imageGen}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Active Groups */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-tea-primary" />
            <h3 className="font-medium text-sm">{t.home.sidebar.activeGroups}</h3>
          </div>
          <Link href="/groups" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            {t.home.sidebar.viewAll}
          </Link>
        </div>
        <div className="space-y-2">
          {activeGroups.slice(0, 5).map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.slug || group.id}`}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
            >
              <div className="h-8 w-8 rounded-lg bg-tea-primary/10 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-4 w-4 text-tea-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{group.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{group.institution}</p>
              </div>
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
                <Users className="h-3 w-3" />
                {group.members}
              </span>
            </Link>
          ))}
          {activeGroups.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">{t.home.feed.empty}</p>
          )}
        </div>
      </div>

      {/* Hot Disciplines */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="h-4 w-4 text-journal-primary" />
          <h3 className="font-medium text-sm">{t.home.sidebar.hotDisciplines}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {hotDisciplines.map((d) => (
            <Link
              key={d.slug}
              href={`/disciplines/${d.slug}`}
              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {lang === 'zh' ? d.name : d.nameEn}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
