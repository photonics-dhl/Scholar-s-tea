'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
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
      <a href={href} className="block">
        {content}
      </a>
    )
  }

  return content
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

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

  const stats = [
    { icon: <BookOpen className="h-5 w-5" />, label: '我的帖子', value: '查看', href: '/disciplines' },
    { icon: <MessageSquare className="h-5 w-5" />, label: '我的评论', value: '查看', href: '/disciplines' },
    { icon: <Users className="h-5 w-5" />, label: '加入的课题组', value: '查看', href: '/groups' },
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
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

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
              { label: '思想工坊', href: '/workshop', desc: '与 AI 助手讨论学术问题' },
              { label: '茶话会', href: '/tea-party', desc: '加入实时学术交流' },
            ].map((item) => (
              <a
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
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
