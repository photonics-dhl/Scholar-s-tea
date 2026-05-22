import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { successResponse, apiErrors } from '@/lib/api/response'

/** GET /api/v1/admin/research-memory — 研究记忆列表（ADMIN only） */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return apiErrors.forbidden('需要管理员权限')
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 50)
    const type = searchParams.get('type') || undefined
    const discipline = searchParams.get('discipline') || undefined

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (discipline) where.discipline = discipline

    const [memories, total] = await Promise.all([
      prisma.researchMemory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.researchMemory.count({ where }),
    ])

    return successResponse({
      memories: memories.map((m) => ({
        ...m,
        metadata: m.metadata ? JSON.parse(m.metadata) : null,
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    return apiErrors.internal(error, '获取研究记忆列表失败')
  }
}

/** POST /api/v1/admin/research-memory — 创建研究记忆（ADMIN only） */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return apiErrors.forbidden('需要管理员权限')
    }

    const body = await request.json().catch(() => ({}))
    const {
      type,
      title,
      content,
      summary,
      discipline,
      relatedPaper,
      tags,
      metadata,
    } = body

    if (!type || !title || !content) {
      return apiErrors.validation('类型、标题和内容不能为空')
    }

    const validTypes = ['IDEA', 'PAPER_SUMMARY', 'DISCUSSION', 'QUESTION', 'NOTES']
    if (!validTypes.includes(type)) {
      return apiErrors.validation(`无效的类型，可选: ${validTypes.join(', ')}`)
    }

    const memory = await prisma.researchMemory.create({
      data: {
        type,
        title: String(title).slice(0, 200),
        content: String(content),
        summary: summary ? String(summary) : null,
        discipline: discipline ? String(discipline) : null,
        userId: session.user.id,
        relatedPaper: relatedPaper ? String(relatedPaper) : null,
        tags: Array.isArray(tags) ? tags.filter((t): t is string => typeof t === 'string') : [],
        metadata: metadata ? JSON.stringify(metadata) : null,
        embedding: '[]',
      },
    })

    return successResponse(
      {
        ...memory,
        metadata: memory.metadata ? JSON.parse(memory.metadata) : null,
      },
      undefined,
      201
    )
  } catch (error) {
    return apiErrors.internal(error, '创建研究记忆失败')
  }
}
