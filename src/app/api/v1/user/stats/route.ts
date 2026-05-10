import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/v1/user/stats - Get current user's stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const [postCount, commentCount, groupCount] = await Promise.all([
      prisma.post.count({ where: { authorId: userId } }),
      prisma.comment.count({ where: { authorId: userId } }),
      prisma.groupMember.count({ where: { userId } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        posts: postCount,
        comments: commentCount,
        groups: groupCount,
      },
    })
  } catch (error) {
    console.error('GET /api/v1/user/stats error:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    )
  }
}
