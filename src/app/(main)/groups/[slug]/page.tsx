'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { GroupHeader } from '@/components/features/groups/GroupHeader'
import { GroupOverview } from '@/components/features/groups/GroupOverview'
import { PublicationsList } from '@/components/features/groups/PublicationsList'
import { NewsList } from '@/components/features/groups/NewsList'
import { PatentsList } from '@/components/features/groups/PatentsList'
import { GroupMemberList } from '@/components/features/groups/GroupMemberList'
import { MemberGrid } from '@/components/features/groups/MemberGrid'
import { GroupDiscussions } from '@/components/features/groups/GroupDiscussions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Newspaper, Award, Users, Settings, LayoutDashboard, MessageSquare } from 'lucide-react'
import type { GroupWithRelations } from '@/types'

export default function GroupDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const router = useRouter()
  const [group, setGroup] = useState<GroupWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await fetch(`/api/v1/groups/${slug}`)
        const data = await res.json()

        if (data.success) {
          setGroup(data.data)
        } else {
          setError(data.error?.message || '课题组不存在')
        }
      } catch (err) {
        setError('加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchGroup()
  }, [slug])

  if (loading) {
    return (
      <div>
        <Skeleton className="h-48 w-full" />
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative -mt-16">
            <Skeleton className="h-32 w-32 rounded-xl" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-64 w-full mt-6" />
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold">课题组不存在</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/groups')} className="mt-4">
          返回列表
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <GroupHeader
        group={group}
        isFollowing={isFollowing}
        onFollowToggle={() => setIsFollowing(!isFollowing)}
      />

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start h-11 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-2 text-sm">
              <LayoutDashboard className="h-4 w-4" />
              概况
            </TabsTrigger>
            <TabsTrigger value="publications" className="gap-2 text-sm">
              <FileText className="h-4 w-4" />
              论文 ({group._count?.publications || 0})
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2 text-sm">
              <Newspaper className="h-4 w-4" />
              动态 ({group._count?.news || 0})
            </TabsTrigger>
            <TabsTrigger value="patents" className="gap-2 text-sm">
              <Award className="h-4 w-4" />
              专利 ({group._count?.patents || 0})
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2 text-sm">
              <Users className="h-4 w-4" />
              成员 ({group._count?.members || 0})
            </TabsTrigger>
            <TabsTrigger value="discussions" className="gap-2 text-sm">
              <MessageSquare className="h-4 w-4" />
              讨论 ({group._count?.posts || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <GroupOverview group={group} />
          </TabsContent>

          <TabsContent value="publications" className="mt-6">
            <PublicationsList groupId={group.id} />
          </TabsContent>

          <TabsContent value="news" className="mt-6">
            <NewsList groupId={group.id} />
          </TabsContent>

          <TabsContent value="patents" className="mt-6">
            <PatentsList groupId={group.id} />
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <MemberGrid members={group.members || []} />
          </TabsContent>

          <TabsContent value="discussions" className="mt-6">
            <GroupDiscussions groupId={group.id} slug={slug} />
          </TabsContent>
        </Tabs>

        {/* Settings Button */}
        <div className="mt-8 border-t pt-6">
          <Button variant="outline" asChild>
            <Link href={`/groups/${slug}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              课题组设置
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
