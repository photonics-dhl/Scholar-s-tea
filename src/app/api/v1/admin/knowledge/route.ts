import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { successResponse, apiErrors } from '@/lib/api/response'
import { generateEmbedding } from '@/lib/ai/rag-service'

/** POST /api/v1/admin/knowledge — 创建知识文档（ADMIN only） */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return apiErrors.forbidden('需要管理员权限')
    }

    const body = await request.json().catch(() => ({}))
    const { title, content, source, sourceId, discipline, metadata } = body

    if (!title || !content) {
      return apiErrors.validation('标题和内容不能为空')
    }

    // Generate embedding for the content
    const embeddingResult = await generateEmbedding(content)
    const embedding = embeddingResult.embedding.length > 0
      ? JSON.stringify(embeddingResult.embedding)
      : null

    const doc = await prisma.knowledgeDocument.create({
      data: {
        title: String(title).slice(0, 200),
        content: String(content),
        source: source ? String(source) : null,
        sourceId: sourceId ? String(sourceId) : null,
        discipline: discipline ? String(discipline) : null,
        authorId: session.user.id,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // Set embedding via raw SQL (Unsupported type)
    if (embedding && embedding.length > 2) {
      const embStr = embedding
      await prisma.$executeRaw`
        UPDATE "KnowledgeDocument"
        SET embedding = ${embStr}::vector
        WHERE id = ${doc.id}
      `
    }

    return successResponse({
      ...doc,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : null,
    }, undefined, 201)
  } catch (error) {
    return apiErrors.internal(error, '创建知识文档失败')
  }
}
