import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

// GET /api/v1/admin/stats - Community overview stats (ADMIN only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'FORBIDDEN', message: '需要管理员权限' } },
        { status: 403 }
      )
    }

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Parallel stat queries
    const [
      totalUsers,
      newUsersWeek,
      totalPosts,
      newPostsWeek,
      totalComments,
      newCommentsWeek,
      totalGroups,
      verifiedGroups,
      pendingGroups,
      totalPublications,
      newPublicationsWeek,
      pendingCitations,
      topPosts,
      activeDisciplines,
      totalVotes,
      teaPartyRooms,
      topTenThisMonth,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),

      // Posts
      prisma.post.count(),
      prisma.post.count({ where: { createdAt: { gte: weekAgo } } }),

      // Comments
      prisma.comment.count(),
      prisma.comment.count({ where: { createdAt: { gte: weekAgo } } }),

      // Groups
      prisma.researchGroup.count(),
      prisma.researchGroup.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.researchGroup.count({ where: { verificationStatus: 'PENDING' } }),

      // Publications
      prisma.publication.count(),
      prisma.publication.count({ where: { createdAt: { gte: weekAgo } } }),

      // Pending citations
      prisma.communityCitation.count({ where: { status: 'PENDING' } }),

      // Top posts by votes (last 30 days)
      prisma.post.findMany({
        where: { createdAt: { gte: monthAgo } },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          viewCount: true,
          createdAt: true,
          author: { select: { name: true } },
          _count: { select: { comments: true, votes: true } },
        },
      }),

      // Active disciplines (by post count)
      prisma.discipline.findMany({
        orderBy: { posts: { _count: 'desc' } },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { posts: true, groups: true } },
        },
      }),

      // Total votes
      prisma.vote.count(),

      // Tea party rooms
      prisma.teaPartyRoom.count(),

      // Top 10 votes this month
      prisma.topTenVote.count({
        where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          users: { total: totalUsers, newThisWeek: newUsersWeek },
          posts: { total: totalPosts, newThisWeek: newPostsWeek },
          comments: { total: totalComments, newThisWeek: newCommentsWeek },
          groups: { total: totalGroups, verified: verifiedGroups, pending: pendingGroups },
          publications: { total: totalPublications, newThisWeek: newPublicationsWeek },
          votes: { total: totalVotes },
          teaPartyRooms,
          pendingCitations,
          topTenVotesThisMonth: topTenThisMonth,
        },
        topPosts: topPosts.map((p) => ({
          id: p.id,
          title: p.title,
          author: p.author.name,
          views: p.viewCount,
          comments: p._count.comments,
          votes: p._count.votes,
          createdAt: p.createdAt,
        })),
        activeDisciplines: activeDisciplines.map((d) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          postCount: d._count.posts,
          groupCount: d._count.groups,
        })),
      },
    })
  } catch (error) {
    console.error('GET /api/v1/admin/stats error:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    )
  }
}
