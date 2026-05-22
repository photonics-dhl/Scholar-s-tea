import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { successResponse, apiErrors } from '@/lib/api/response'

interface Params {
  params: Promise<{ id: string }>
}

/** GET /api/v1/knowledge/[id] — 获取单个知识文档详情 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const doc = await prisma.knowledgeDocument.findUnique({
      where: { id },
    })

    if (!doc) {
      return apiErrors.notFound('知识文档不存在')
    }

    return successResponse({
      ...doc,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : null,
      embedding: doc.embedding ? JSON.parse(doc.embedding) : null,
    })
  } catch (error) {
    return apiErrors.internal(error, '获取知识文档失败')
  }
}
