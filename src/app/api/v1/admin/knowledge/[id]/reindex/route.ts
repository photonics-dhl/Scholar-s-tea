import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { successResponse, apiErrors } from '@/lib/api/response'
import { generateEmbedding } from '@/lib/ai/rag-service'

interface Params {
  params: Promise<{ id: string }>
}

/** POST /api/v1/admin/knowledge/[id]/reindex — 重新生成 embedding（ADMIN only） */
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return apiErrors.forbidden('需要管理员权限')
    }

    const { id } = await params

    const doc = await prisma.knowledgeDocument.findUnique({
      where: { id },
      select: { id: true, title: true, content: true },
    })

    if (!doc) {
      return apiErrors.notFound('知识文档不存在')
    }

    const textToEmbed = `${doc.title}\n\n${doc.content}`
    const embeddingResult = await generateEmbedding(textToEmbed)

    if (embeddingResult.error) {
      return apiErrors.internal(
        new Error(embeddingResult.error),
        'Embedding 生成失败: ' + embeddingResult.error
      )
    }

    const updated = await prisma.knowledgeDocument.update({
      where: { id },
      data: {
        embedding: JSON.stringify(embeddingResult.embedding),
      },
    })

    return successResponse({
      id: updated.id,
      embeddingLength: embeddingResult.embedding.length,
      reindexed: true,
    })
  } catch (error) {
    return apiErrors.internal(error, '重新生成 embedding 失败')
  }
}
