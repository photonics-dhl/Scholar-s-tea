import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/v1/knowledge/[id]/posts
// Find community posts that reference this knowledge document
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // First, get the knowledge document to check if it's sourced from a post
    const doc = await prisma.knowledgeDocument.findUnique({
      where: { id },
      select: { title: true, source: true, sourceId: true },
    })

    if (!doc) {
      return NextResponse.json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Document not found' } }, { status: 404 })
    }

    const results: Array<{
      id: string
      title: string
      content: string
      authorName: string | null
      createdAt: Date
      viewCount: number
      commentCount: number
      score: number
    }> = []

    // 1. If this doc was synced from a post, include the original post
    if (doc.source === 'post' && doc.sourceId) {
      const originalPost = await prisma.post.findUnique({
        where: { id: doc.sourceId },
        select: {
          id: true,
          title: true,
          content: true,
          author: { select: { name: true } },
          createdAt: true,
          viewCount: true,
          _count: { select: { comments: true } },
        },
      })
      if (originalPost) {
        results.push({
          id: originalPost.id,
          title: originalPost.title,
          content: originalPost.content.slice(0, 200),
          authorName: originalPost.author?.name || null,
          createdAt: originalPost.createdAt,
          viewCount: originalPost.viewCount,
          commentCount: originalPost._count.comments,
          score: 100, // highest priority
        })
      }
    }

    // 2. Search for posts that mention this document's title
    const searchTerm = doc.title.slice(0, 40)
    const relatedPosts = await prisma.post.findMany({
      where: {
        id: { not: doc.sourceId || undefined },
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        author: { select: { name: true } },
        createdAt: true,
        viewCount: true,
        _count: { select: { comments: true } },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })

    for (const post of relatedPosts) {
      results.push({
        id: post.id,
        title: post.title,
        content: post.content.slice(0, 200),
        authorName: post.author?.name || null,
        createdAt: post.createdAt,
        viewCount: post.viewCount,
        commentCount: post._count.comments,
        score: 50,
      })
    }

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    console.error('GET /api/v1/knowledge/[id]/posts error:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: 'Server error' } },
      { status: 500 }
    )
  }
}
