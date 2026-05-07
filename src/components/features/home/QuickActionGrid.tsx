'use client'

import Link from 'next/link'
import {
  GraduationCap,
  Users,
  MessageCircle,
  Sparkles,
  Trophy,
  FileText,
  Landmark,
  BookOpen,
  FlaskConical,
  Database,
  Bell,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface ActionItem {
  href: string
  icon: LucideIcon
  title: string
  desc: string
  color: string
  bgGradient: string
  zone: 'scholarly' | 'social' | 'tool'
}

const actions: ActionItem[] = [
  // Row 1: Core modules
  {
    href: '/disciplines',
    icon: GraduationCap,
    title: '学科社区',
    desc: '探索学科领域',
    color: 'text-journal-primary',
    bgGradient: 'from-journal-primary/10 to-journal-primary/5',
    zone: 'scholarly',
  },
  {
    href: '/groups',
    icon: Users,
    title: '课题组',
    desc: '发现研究团队',
    color: 'text-tea-primary',
    bgGradient: 'from-tea-primary/10 to-tea-primary/5',
    zone: 'scholarly',
  },
  {
    href: '/tea-party',
    icon: MessageCircle,
    title: '茶话会',
    desc: '实时交流讨论',
    color: 'text-tea-accent',
    bgGradient: 'from-tea-accent/10 to-tea-accent/5',
    zone: 'social',
  },
  {
    href: '/workshop',
    icon: Sparkles,
    title: '思想工坊',
    desc: 'AI 学术助手',
    color: 'text-convo-blue',
    bgGradient: 'from-convo-blue/10 to-convo-blue/5',
    zone: 'social',
  },
  // Row 2: AI tools
  {
    href: '/workshop?mode=paper',
    icon: FileText,
    title: '论文助手',
    desc: 'AI 辅助论文分析',
    color: 'text-journal-primary',
    bgGradient: 'from-journal-primary/10 to-journal-primary/5',
    zone: 'tool',
  },
  {
    href: '/workshop?mode=grant',
    icon: Landmark,
    title: '基金申请',
    desc: '项目书撰写辅助',
    color: 'text-journal-gold',
    bgGradient: 'from-journal-gold/10 to-journal-gold/5',
    zone: 'tool',
  },
  {
    href: '/workshop?mode=survey',
    icon: BookOpen,
    title: '文献综述',
    desc: '梳理研究脉络',
    color: 'text-convo-blue',
    bgGradient: 'from-convo-blue/10 to-convo-blue/5',
    zone: 'tool',
  },
  {
    href: '/top-questions',
    icon: Trophy,
    title: 'TOP10',
    desc: '月度热门排行',
    color: 'text-journal-gold',
    bgGradient: 'from-journal-gold/10 to-journal-gold/5',
    zone: 'scholarly',
  },
  // Row 3: Personal
  {
    href: '/profile',
    icon: FlaskConical,
    title: '我的研究',
    desc: '论文与动态',
    color: 'text-tea-primary',
    bgGradient: 'from-tea-primary/10 to-tea-primary/5',
    zone: 'tool',
  },
  {
    href: '/workshop?mode=research',
    icon: Sparkles,
    title: '方向探索',
    desc: '发现研究灵感',
    color: 'text-tea-accent',
    bgGradient: 'from-tea-accent/10 to-tea-accent/5',
    zone: 'tool',
  },
  {
    href: '/disciplines',
    icon: Database,
    title: '知识库',
    desc: '学术资源汇聚',
    color: 'text-journal-primary',
    bgGradient: 'from-journal-primary/10 to-journal-primary/5',
    zone: 'scholarly',
  },
  {
    href: '/profile',
    icon: Bell,
    title: '通知中心',
    desc: '消息与提醒',
    color: 'text-convo-blue',
    bgGradient: 'from-convo-blue/10 to-convo-blue/5',
    zone: 'social',
  },
]

/**
 * 快捷入口网格
 * 12 个功能入口，分 3 行展示
 */
export function QuickActionGrid() {
  const rows = [
    { label: '核心模块', items: actions.filter((a) => a.zone === 'scholarly' || a.zone === 'social') },
    { label: 'AI 工具', items: actions.filter((a) => a.zone === 'tool').slice(0, 4) },
    { label: '个人中心', items: actions.filter((a) => a.zone === 'tool').slice(4) },
  ]

  return (
    <section className="space-y-6">
      {rows.map((row, rowIndex) => (
        <div key={row.label}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            {row.label}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {row.items.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href + item.title} href={item.href} className="group">
                  <Card
                    className={cn(
                      'h-full transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 bg-gradient-to-br',
                      item.bgGradient
                    )}
                  >
                    <CardContent className="p-4">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-xl bg-background/80 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform',
                          item.color
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                      <div className="mt-3 flex items-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className={item.color}>进入</span>
                        <ArrowRight className={cn('ml-1 h-3 w-3', item.color)} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}
