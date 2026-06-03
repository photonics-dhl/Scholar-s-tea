import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { normalizeDiscipline } from '@/lib/knowledge/categories'
import { extractPreview } from '@/lib/knowledge/utils'

interface KnowledgeDocWithMeta {
  id: string
  title: string
  source: string | null
  discipline: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  viewCount: number
  contentPreview: string
}

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

// GET /api/v1/knowledge - List knowledge documents
// Query params:
//   - discipline: filter by discipline value
//   - tags: comma-separated tags to filter (must contain all specified tags)
//   - search: full-text search in title and content
//   - page, pageSize: pagination
//   - stats: if 'true', include discipline distribution statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const disciplineParam = searchParams.get('discipline') || undefined
    const tagsParam = searchParams.get('tags') || undefined
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSizeRaw = searchParams.get('pageSize')
    // pageSize=0 means "all documents", no pagination
    const pageSize = pageSizeRaw === '0' ? 0 : Math.min(parseInt(pageSizeRaw || '20'), 50)
    const includeStats = searchParams.get('stats') === 'true'

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    const validSortFields = ['createdAt', 'viewCount', 'title']
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const orderByDir = sortOrder === 'asc' ? 'asc' : 'desc'

    // Normalize discipline
    const discipline = disciplineParam ? normalizeDiscipline(disciplineParam) || disciplineParam : undefined

    // Parse tags filter
    const tagsFilter = tagsParam
      ? tagsParam.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    const where: Record<string, unknown> = {}
    if (discipline) {
      where.discipline = discipline
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch documents
    const findArgs: any = {
      where,
      select: {
        id: true,
        title: true,
        content: true,
        source: true,
        discipline: true,
        metadata: true,
        viewCount: true,
        createdAt: true,
      },
      orderBy: { [orderByField]: orderByDir },
    }
    if (pageSize > 0) {
      findArgs.skip = (page - 1) * pageSize
      findArgs.take = pageSize
    }
    const documents = await prisma.knowledgeDocument.findMany(findArgs)

    // Parse metadata and apply tags filter in memory
    let parsedDocs: KnowledgeDocWithMeta[] = documents.map((doc) => {
      const metadata = safeParseMetadata(doc.metadata)
      const abstract = typeof metadata?.abstract === 'string' ? metadata.abstract : null
      return {
        id: doc.id,
        title: doc.title,
        source: doc.source,
        discipline: doc.discipline,
        metadata,
        createdAt: doc.createdAt,
        viewCount: doc.viewCount,
        contentPreview: abstract ? abstract : extractPreview(doc.content || '', 180),
      }
    })

    if (tagsFilter.length > 0) {
      parsedDocs = parsedDocs.filter((doc) => {
        const docTags = (doc.metadata?.tags as string[]) || []
        return tagsFilter.every((tag) => docTags.includes(tag))
      })
    }

    // Total count (approximate for tags-filtered; exact for non-tagged)
    let total = 0
    if (tagsFilter.length === 0) {
      total = await prisma.knowledgeDocument.count({ where })
    } else {
      // For tags filter, we need to count all matching docs
      const allDocs = await prisma.knowledgeDocument.findMany({
        where,
        select: { metadata: true },
      })
      total = allDocs.filter((doc) => {
        const meta = doc.metadata ? JSON.parse(doc.metadata) : null
        const docTags = (meta?.tags as string[]) || []
        return tagsFilter.every((tag) => docTags.includes(tag))
      }).length
    }

    // Build response
    const response: {
      success: boolean
      data: KnowledgeDocWithMeta[]
      meta: {
        page: number
        pageSize: number
        total: number
        totalPages: number
      }
      stats?: { disciplineDistribution: Record<string, number> }
    } = {
      success: true,
      data: parsedDocs,
      meta: {
        page,
        pageSize,
        total,
        totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 1,
      },
    }

    // Include statistics if requested
    if (includeStats) {
      const allDocs = await prisma.knowledgeDocument.findMany({
        select: { discipline: true },
      })
      const distribution: Record<string, number> = {}
      for (const doc of allDocs) {
        const d = doc.discipline || '未分类'
        distribution[d] = (distribution[d] || 0) + 1
      }
      response.stats = { disciplineDistribution: distribution }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('GET /api/v1/knowledge error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '服务器内部错误',
        },
      },
      { status: 500 }
    )
  }
}
