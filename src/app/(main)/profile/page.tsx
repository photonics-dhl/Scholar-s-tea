'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  User,
  Mail,
  BookOpen,
  MessageSquare,
  Users,
  Settings,
  ArrowRight,
  GraduationCap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  href?: string
}

function StatCard({ icon, label, value, href }: StatCardProps) {
  const content = (
    <Card className="border-journal-border/30 hover:border-journal-border/60 transition-colors">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-journal-primary/10 flex items-center justify-center text-journal-primary">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

interface UserStats {
  posts: number
  comments: number
  groups: number
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats>({ posts: 0, comments: 0, groups: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/v1/user/stats')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setStats(data.data)
          }
        })
        .catch((err) => console.error('Failed to fetch stats:', err))
        .finally(() => setStatsLoading(false))
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-muted rounded-xl" />
              <div className="h-20 bg-muted rounded-xl" />
              <div className="h-20 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const user = session.user
  const initials = user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'

  // Academic profile from session (enriched by NextAuth callback)
  const academicProfile = (user as any).academicProfile as
    | {
        institution?: string
        position?: string
        educationLevel?: string
        researchField?: string[]
        interests?: string[]
        skills?: string[]
        bioDetail?: string
      }
    | undefined

  const hasAcademicProfile = academicProfile && (
    academicProfile.institution ||
    academicProfile.position ||
    academicProfile.educationLevel ||
    (academicProfile.researchField && academicProfile.researchField.length > 0) ||
    (academicProfile.interests && academicProfile.interests.length > 0) ||
    (academicProfile.skills && academicProfile.skills.length > 0) ||
    academicProfile.bioDetail
  )

  const statItems = [
    { icon: <BookOpen className="h-5 w-5" />, label: '我的帖子', value: statsLoading ? '...' : stats.posts, href: '/disciplines' },
    { icon: <MessageSquare className="h-5 w-5" />, label: '我的评论', value: statsLoading ? '...' : stats.comments, href: '/disciplines' },
    { icon: <Users className="h-5 w-5" />, label: '加入的课题组', value: statsLoading ? '...' : stats.groups, href: '/groups' },
  ]

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <Card className="border-journal-border/30 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-journal-primary/10 via-journal-primary/5 to-transparent" />
          <CardContent className="px-6 pb-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={user.image || undefined} alt={user.name || '用户'} />
                <AvatarFallback className="text-2xl bg-journal-primary/15 text-journal-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground">
                  {user.name || '未设置昵称'}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.bio && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>
                )}
              </div>
              <Button variant="outline" className="border-journal-border/30" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  设置
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statItems.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Academic Profile */}
        {hasAcademicProfile && (
          <Card className="border-journal-border/30">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-journal-primary" />
                学术画像
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {academicProfile?.institution && (
                  <div>
                    <p className="text-xs text-muted-foreground">所在机构</p>
                    <p className="text-sm font-medium">{academicProfile.institution}</p>
                  </div>
                )}
                {academicProfile?.position && (
                  <div>
                    <p className="text-xs text-muted-foreground">职位/身份</p>
                    <p className="text-sm font-medium">{academicProfile.position}</p>
                  </div>
                )}
                {academicProfile?.educationLevel && (
                  <div>
                    <p className="text-xs text-muted-foreground">最高学历</p>
                    <p className="text-sm font-medium">{academicProfile.educationLevel}</p>
                  </div>
                )}
              </div>

              {academicProfile?.researchField && academicProfile.researchField.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">研究领域</p>
                  <div className="flex flex-wrap gap-1.5">
                    {academicProfile.researchField.map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-journal-primary/10 text-journal-primary"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {academicProfile?.interests && academicProfile.interests.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">感兴趣的方向</p>
                  <div className="flex flex-wrap gap-1.5">
                    {academicProfile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-tea-primary/10 text-tea-primary"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {academicProfile?.skills && academicProfile.skills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">专业技能</p>
                  <div className="flex flex-wrap gap-1.5">
                    {academicProfile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-convo-blue/10 text-convo-blue"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {academicProfile?.bioDetail && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">详细学术简介</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{academicProfile.bioDetail}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="border-journal-border/30">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-journal-primary" />
              快捷入口
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: '浏览学科社区', href: '/disciplines', desc: '探索不同学科领域的讨论' },
              { label: '发现课题组', href: '/groups', desc: '找到适合你的研究团队' },
              { label: 'AI Workshop', href: '/workshop', desc: '与 AI 助手讨论学术问题' },
              { label: '茶话会', href: '/tea-party', desc: '加入实时学术交流' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  'hover:bg-muted/50 transition-colors group'
                )}
              >
                <div>
                  <p className="font-medium text-foreground group-hover:text-journal-primary transition-colors">
                    {item.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-journal-primary transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
