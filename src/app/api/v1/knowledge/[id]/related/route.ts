import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

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

// GET /api/v1/knowledge/:id/related - Get related knowledge documents
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Fetch the target document
    const targetDoc = await prisma.knowledgeDocument.findUnique({
      where: { id },
      select: { discipline: true, metadata: true },
    })
    if (!targetDoc) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Document not found' } },
        { status: 404 }
      )
    }

    const targetMeta = safeParseMetadata(targetDoc.metadata)
    const targetSub = (targetMeta?.subDiscipline as string) || null
    const targetTags = new Set((targetMeta?.tags as string[]) || [])

    // Fetch all other documents
    const allDocs = await prisma.knowledgeDocument.findMany({
      where: { id: { not: id } },
      select: {
        id: true,
        title: true,
        source: true,
        discipline: true,
        metadata: true,
        viewCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Score each document by relevance
    const scored = allDocs.map((doc) => {
      const meta = safeParseMetadata(doc.metadata)
      const sub = (meta?.subDiscipline as string) || null
      const tags = (meta?.tags as string[]) || []

      let score = 0
      if (doc.discipline && doc.discipline === targetDoc.discipline) score += 3
      if (sub && sub === targetSub) score += 2
      for (const tag of tags) {
        if (targetTags.has(tag)) score += 1
      }

      return {
        id: doc.id,
        title: doc.title,
        source: doc.source,
        discipline: doc.discipline,
        metadata: meta,
        viewCount: doc.viewCount,
        createdAt: doc.createdAt.toISOString(),
        score,
      }
    })

    // Sort by score desc, then by createdAt desc
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Return top 3 with score > 0, or top 3 anyway if none have score
    const related = scored
      .filter((d) => d.score > 0)
      .slice(0, 3)

    return NextResponse.json({ success: true, data: related })
  } catch (error) {
    console.error('GET /api/v1/knowledge/:id/related error:', error)
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
