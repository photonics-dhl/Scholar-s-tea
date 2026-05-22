import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db/prisma'

const getCachedStats = unstable_cache(
  async () => {
    const [totalUsers, totalGroups, totalPosts, totalPublications] = await Promise.all([
      prisma.user.count(),
      prisma.researchGroup.count(),
      prisma.post.count(),
      prisma.publication.count(),
    ])
    return { totalUsers, totalGroups, totalPosts, totalPublications }
  },
  ['public-stats'],
  { revalidate: 300, tags: ['public-stats'] }
)

// GET /api/v1/public-stats - Public community stats (no auth required)
// Cached for 5 minutes to reduce DB load on high-traffic pages
export async function GET() {
  try {
    const stats = await getCachedStats()

    return NextResponse.json({
      success: true,
      data: {
        users: stats.totalUsers,
        groups: stats.totalGroups,
        posts: stats.totalPosts,
        publications: stats.totalPublications,
      },
      meta: null,
    })
  } catch (error) {
    console.error('GET /api/v1/public-stats error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: 'INTERNAL_ERROR', message: '获取统计数据失败' },
      },
      { status: 500 }
    )
  }
}
