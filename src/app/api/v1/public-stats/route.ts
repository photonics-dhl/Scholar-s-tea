import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/v1/public-stats - Public community stats (no auth required)
export async function GET() {
  try {
    const [totalUsers, totalGroups, totalPosts, totalPublications] = await Promise.all([
      prisma.user.count(),
      prisma.researchGroup.count(),
      prisma.post.count(),
      prisma.publication.count(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        users: totalUsers,
        groups: totalGroups,
        posts: totalPosts,
        publications: totalPublications,
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
