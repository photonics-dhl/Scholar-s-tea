import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { successResponse, apiErrors } from '@/lib/api/response'

interface Params {
  params: Promise<{ id: string }>
}

/** GET /api/v1/admin/research-memory/[id] — 研究记忆详情（ADMIN only） */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return apiErrors.forbidden('需要管理员权限')
    }

    const { id } = await params

    const memory = await prisma.researchMemory.findUnique({
      where: { id },
    })

    if (!memory) {
      return apiErrors.notFound('研究记忆不存在')
    }

    return successResponse({
      ...memory,
      metadata: memory.metadata ? JSON.parse(memory.metadata) : null,
    })
  } catch (error) {
    return apiErrors.internal(error, '获取研究记忆失败')
  }
}

/** PATCH /api/v1/admin/research-memory/[id] — 更新研究记忆（ADMIN only） */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return apiErrors.forbidden('需要管理员权限')
    }

    const { id } = await params
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

    const updateData: Record<string, unknown> = {}
    if (type !== undefined) {
      const validTypes = ['IDEA', 'PAPER_SUMMARY', 'DISCUSSION', 'QUESTION', 'NOTES']
      if (!validTypes.includes(type)) {
        return apiErrors.validation(`无效的类型，可选: ${validTypes.join(', ')}`)
      }
      updateData.type = type
    }
    if (title !== undefined) updateData.title = String(title).slice(0, 200)
    if (content !== undefined) updateData.content = String(content)
    if (summary !== undefined) updateData.summary = summary ? String(summary) : null
    if (discipline !== undefined) updateData.discipline = discipline ? String(discipline) : null
    if (relatedPaper !== undefined) updateData.relatedPaper = relatedPaper ? String(relatedPaper) : null
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags.filter((t): t is string => typeof t === 'string') : []
    }
    if (metadata !== undefined) updateData.metadata = metadata ? JSON.stringify(metadata) : null

    if (Object.keys(updateData).length === 0) {
      return apiErrors.validation('无有效更新字段')
    }

    const memory = await prisma.researchMemory.update({
      where: { id },
      data: updateData,
    })

    return successResponse({
      ...memory,
      metadata: memory.metadata ? JSON.parse(memory.metadata) : null,
    })
  } catch (error) {
    return apiErrors.internal(error, '更新研究记忆失败')
  }
}

/** DELETE /api/v1/admin/research-memory/[id] — 删除研究记忆（ADMIN only） */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return apiErrors.forbidden('需要管理员权限')
    }

    const { id } = await params

    await prisma.researchMemory.delete({
      where: { id },
    })

    return successResponse({ deleted: true })
  } catch (error) {
    return apiErrors.internal(error, '删除研究记忆失败')
  }
}
