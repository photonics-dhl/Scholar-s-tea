import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/v1/admin/moderation - Moderation queue (ADMIN only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'FORBIDDEN', message: '需要管理员权限' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)

    // Parallel moderation queries
    const [
      pendingCitations,
      pendingGroups,
      recentPosts,
      recentComments,
    ] = await Promise.all([
      // Pending community citations
      prisma.communityCitation.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          context: true,
          status: true,
          createdAt: true,
          citingUser: { select: { id: true, name: true } },
          publication: { select: { id: true, title: true, doi: true } },
          group: { select: { id: true, name: true } },
        },
      }),

      // Pending group verifications
      prisma.researchGroup.findMany({
        where: { verificationStatus: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
          institution: { select: { name: true } },
          _count: { select: { members: true, publications: true } },
        },
      }),

      // Recent posts with low engagement (potential spam / low quality)
      prisma.post.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          viewCount: { lt: 5 },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          viewCount: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
          _count: { select: { comments: true, votes: true } },
        },
      }),

      // Recent comments on their own posts (potential self-promotion)
      prisma.comment.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
          post: { select: { id: true, title: true, authorId: true } },
        },
      }),
    ])

    // Flag comments where author == post author
    const flaggedComments = recentComments
      .filter((c) => c.author.id === c.post.authorId)
      .map((c) => ({
        id: c.id,
        content: c.content.slice(0, 200),
        author: c.author.name,
        postTitle: c.post.title,
        createdAt: c.createdAt,
        flag: 'self_comment',
      }))

    return NextResponse.json({
      success: true,
      data: {
        pendingCitations: pendingCitations.map((c) => ({
          id: c.id,
          type: 'citation',
          context: c.context?.slice(0, 200) ?? '',
          status: c.status,
          user: c.citingUser.name,
          publication: c.publication.title,
          group: c.group.name,
          createdAt: c.createdAt,
        })),
        pendingGroups: pendingGroups.map((g) => ({
          id: g.id,
          type: 'group_verification',
          name: g.name,
          slug: g.slug,
          description: g.description?.slice(0, 200) ?? '',
          institution: g.institution.name,
          memberCount: g._count.members,
          publicationCount: g._count.publications,
          createdAt: g.createdAt,
        })),
        lowEngagementPosts: recentPosts.map((p) => ({
          id: p.id,
          type: 'low_engagement_post',
          title: p.title,
          content: p.content.slice(0, 200),
          author: p.author.name,
          views: p.viewCount,
          comments: p._count.comments,
          votes: p._count.votes,
          createdAt: p.createdAt,
        })),
        flaggedComments,
        summary: {
          pendingCitations: pendingCitations.length,
          pendingGroups: pendingGroups.length,
          lowEngagementPosts: recentPosts.length,
          flaggedComments: flaggedComments.length,
        },
      },
    })
  } catch (error) {
    console.error('GET /api/v1/admin/moderation error:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    )
  }
}
