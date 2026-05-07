'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Mail, MessageSquare, FileText, Users, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return (
      <div className='container mx-auto py-8 max-w-4xl'>
        <div className='flex items-center gap-4 mb-8'>
          <Skeleton className='h-20 w-20 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-6 w-32' />
            <Skeleton className='h-4 w-48' />
          </div>
        </div>
        <Skeleton className='h-64 w-full' />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className='container mx-auto py-16 text-center'>
        <h1 className='text-xl font-semibold'>请先登录</h1>
        <Button className='mt-4' onClick={() => router.push('/signin')}>去登录</Button>
      </div>
    )
  }

  const initials = session.user.name?.slice(0, 2) || session.user.email?.slice(0, 2) || 'U'
  const stats = [
    { icon: MessageSquare, label: '帖子', value: 0, color: 'text-journal-gold' },
    { icon: FileText, label: '评论', value: 0, color: 'text-journal-primary' },
    { icon: FileText, label: '论文', value: 0, color: 'text-convo-blue' },
    { icon: Users, label: '课题组', value: 0, color: 'text-tea-primary' },
  ]

  return (
    <div className='container mx-auto py-8 max-w-4xl'>
      <Card className='mb-6'>
        <CardContent className='p-6'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
            <Avatar className='h-20 w-20 border-2 border-tea-primary/20'>
              <AvatarFallback className='text-xl bg-tea-primary/10 text-tea-primary'>{initials}</AvatarFallback>
            </Avatar>
            <div className='flex-1'>
              <h1 className='text-2xl font-bold'>{session.user.name || '未设置昵称'}</h1>
              <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
                <Mail className='h-3.5 w-3.5' />
                <span>{session.user.email}</span>
              </div>
              <Badge variant='outline' className='mt-2'>用户</Badge>
            </div>
            <Button variant='outline' size='sm'><Settings className='h-4 w-4 mr-1.5' />编辑资料</Button>
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'>
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className='p-4 text-center'>
                <Icon className={cn('h-5 w-5 mx-auto mb-2', stat.color)} />
                <p className='text-2xl font-bold'>{stat.value}</p>
                <p className='text-xs text-muted-foreground'>{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue='posts'>
        <TabsList className='w-full justify-start'>
          <TabsTrigger value='posts' className='gap-2'><MessageSquare className='h-4 w-4' />我的帖子</TabsTrigger>
          <TabsTrigger value='comments' className='gap-2'><FileText className='h-4 w-4' />我的评论</TabsTrigger>
          <TabsTrigger value='groups' className='gap-2'><Users className='h-4 w-4' />我的课题组</TabsTrigger>
        </TabsList>
        <TabsContent value='posts' className='mt-4'>
          <Card className='p-8 text-center'>
            <MessageSquare className='h-10 w-10 mx-auto mb-3 text-muted-foreground/40' />
            <p className='text-muted-foreground'>暂无帖子</p>
            <Button variant='link' className='mt-2' onClick={() => router.push('/disciplines')}>去发帖</Button>
          </Card>
        </TabsContent>
        <TabsContent value='comments' className='mt-4'>
          <Card className='p-8 text-center'>
            <FileText className='h-10 w-10 mx-auto mb-3 text-muted-foreground/40' />
            <p className='text-muted-foreground'>暂无评论</p>
          </Card>
        </TabsContent>
        <TabsContent value='groups' className='mt-4'>
          <Card className='p-8 text-center'>
            <Users className='h-10 w-10 mx-auto mb-3 text-muted-foreground/40' />
            <p className='text-muted-foreground'>暂无加入的课题组</p>
            <Button variant='link' className='mt-2' onClick={() => router.push('/groups')}>去发现课题组</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
