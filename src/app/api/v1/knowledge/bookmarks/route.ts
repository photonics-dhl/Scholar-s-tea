import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { extractPreview } from '@/lib/knowledge/utils'

/** Defensive JSON parser that handles double-encoded metadata strings */
function safeParseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    let parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed)
    }
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

// GET /api/v1/knowledge/bookmarks - List current user's bookmarked documents
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Please sign in' },
        },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const bookmarks = await prisma.knowledgeBookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { docId: true, createdAt: true },
    })

    const docIds = bookmarks.map((bm) => bm.docId)
    if (docIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const docs = await prisma.knowledgeDocument.findMany({
      where: { id: { in: docIds } },
      select: {
        id: true,
        title: true,
        source: true,
        discipline: true,
        metadata: true,
        viewCount: true,
        createdAt: true,
        content: true,
      },
    })

    // Preserve bookmark order
    const docMap = new Map(docs.map((d) => [d.id, d]))
    const data = bookmarks.map((bm) => {
      const d = docMap.get(bm.docId)
      if (!d) return null
      return {
        id: d.id,
        title: d.title,
        source: d.source,
        discipline: d.discipline,
        metadata: safeParseMetadata(d.metadata),
        viewCount: d.viewCount,
        createdAt: d.createdAt,
        contentPreview: extractPreview(d.content || '', 180),
        bookmarkedAt: bm.createdAt,
      }
    }).filter(Boolean)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/knowledge/bookmarks error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Server internal error',
        },
      },
      { status: 500 }
    )
  }
}
