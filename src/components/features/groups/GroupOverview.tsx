'use client'

import Link from 'next/link'
import { BookOpen, Building2, Users, FileText, Award, Newspaper } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ActivityTimeline } from './ActivityTimeline'
import { GroupAiAnalysis } from './GroupAiAnalysis'
import type { GroupWithRelations } from '@/types'

interface GroupOverviewProps {
  group: GroupWithRelations
}

/**
 * 课题组 Overview Tab 内容
 * GitHub README 风格的信息展示
 */
export function GroupOverview({ group }: GroupOverviewProps) {
  // Build demo timeline from available data
  const groupAny = group as unknown as Record<string, unknown>
  const timelineEvents = [
    ...((groupAny.publications as Array<{ id: string; title: string; year?: number; createdAt: string }> | undefined)?.map((p) => ({
      id: `pub-${p.id}`,
      type: 'publication' as const,
      title: p.title,
      date: p.year?.toString() || new Date(p.createdAt).toLocaleDateString('zh-CN'),
    })) || []),
    ...((groupAny.patents as Array<{ id: string; title: string; createdAt: string }> | undefined)?.map((p) => ({
      id: `pat-${p.id}`,
      type: 'patent' as const,
      title: p.title,
      date: new Date(p.createdAt).toLocaleDateString('zh-CN'),
    })) || []),
    ...((groupAny.news as Array<{ id: string; title: string; createdAt: string }> | undefined)?.map((n) => ({
      id: `news-${n.id}`,
      type: 'news' as const,
      title: n.title,
      date: new Date(n.createdAt).toLocaleDateString('zh-CN'),
    })) || []),
    ...(group.members?.map((m) => ({
      id: `mem-${m.id}`,
      type: 'member' as const,
      title: `${m.user.name || '新成员'} 加入课题组`,
      date: new Date(m.joinedAt).toLocaleDateString('zh-CN'),
    })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

  const disciplineNames = group.disciplines?.map((d: { discipline: { name: string } }) => d.discipline.name) || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Description */}
        <div className="prose dark:prose-invert max-w-none">
          {group.description ? (
            <div className="bg-muted/30 rounded-xl p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                课题组简介
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {group.description}
              </p>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-xl p-5 text-center">
              <p className="text-sm text-muted-foreground">暂无简介</p>
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="text-sm font-medium mb-4">最近活动</h3>
          <ActivityTimeline events={timelineEvents} />
        </div>
      </div>

      {/* Right: Sidebar info */}
      <div className="space-y-4">
        {/* Disciplines */}
        {disciplineNames.length > 0 && (
          <div className="bg-card rounded-xl border p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              研究领域
            </h3>
            <div className="flex flex-wrap gap-2">
              {disciplineNames.map((name: string) => (
                <Badge
                  key={name}
                  variant="secondary"
                  className="bg-journal-primary/10 text-journal-primary hover:bg-journal-primary/20 cursor-pointer"
                >
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Institution */}
        <div className="bg-card rounded-xl border p-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            所属机构
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{group.institution?.name}</span>
            </div>
            {group.college && (
              <div className="flex items-center gap-2 text-sm pl-6">
                <span className="text-muted-foreground">{group.college.name}</span>
              </div>
            )}
            {group.department && (
              <div className="flex items-center gap-2 text-sm pl-6">
                <span className="text-muted-foreground">{group.department.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-card rounded-xl border p-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            数据统计
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded-lg bg-journal-primary/5">
              <Users className="h-4 w-4 mx-auto mb-1 text-journal-primary" />
              <p className="text-lg font-semibold">{group._count?.members || 0}</p>
              <p className="text-[10px] text-muted-foreground">成员</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-journal-gold/5">
              <FileText className="h-4 w-4 mx-auto mb-1 text-journal-gold" />
              <p className="text-lg font-semibold">{group._count?.publications || 0}</p>
              <p className="text-[10px] text-muted-foreground">论文</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-convo-blue/5">
              <Newspaper className="h-4 w-4 mx-auto mb-1 text-convo-blue" />
              <p className="text-lg font-semibold">{group._count?.news || 0}</p>
              <p className="text-[10px] text-muted-foreground">动态</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-tea-accent/5">
              <Award className="h-4 w-4 mx-auto mb-1 text-tea-accent" />
              <p className="text-lg font-semibold">{group._count?.patents || 0}</p>
              <p className="text-[10px] text-muted-foreground">专利</p>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <GroupAiAnalysis
          groupId={group.id}
          groupName={group.name}
          disciplines={disciplineNames}
        />
      </div>
    </div>
  )
}
