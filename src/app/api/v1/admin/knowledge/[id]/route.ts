import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { successResponse, apiErrors } from '@/lib/api/response'

interface Params {
  params: Promise<{ id: string }>
}

/** PATCH /api/v1/admin/knowledge/[id] — 更新知识文档（ADMIN only） */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return apiErrors.forbidden('需要管理员权限')
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { title, content, source, sourceId, discipline, metadata } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = String(title).slice(0, 200)
    if (content !== undefined) updateData.content = String(content)
    if (source !== undefined) updateData.source = source ? String(source) : null
    if (sourceId !== undefined) updateData.sourceId = sourceId ? String(sourceId) : null
    if (discipline !== undefined) updateData.discipline = discipline ? String(discipline) : null
    if (metadata !== undefined) updateData.metadata = metadata ? JSON.stringify(metadata) : null

    if (Object.keys(updateData).length === 0) {
      return apiErrors.validation('无有效更新字段')
    }

    const doc = await prisma.knowledgeDocument.update({
      where: { id },
      data: updateData,
    })

    return successResponse({
      ...doc,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : null,
    })
  } catch (error) {
    return apiErrors.internal(error, '更新知识文档失败')
  }
}

/** DELETE /api/v1/admin/knowledge/[id] — 删除知识文档（ADMIN only） */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return apiErrors.forbidden('需要管理员权限')
    }

    const { id } = await params

    await prisma.knowledgeDocument.delete({
      where: { id },
    })

    return successResponse({ deleted: true })
  } catch (error) {
    return apiErrors.internal(error, '删除知识文档失败')
  }
}
