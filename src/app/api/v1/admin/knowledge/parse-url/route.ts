import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { parseUrlForKnowledgeCard } from '@/lib/ai/url-content-extractor'
import { successResponse, errorResponse } from '@/lib/api/response'

/**
 * POST /api/v1/admin/knowledge/parse-url
 * 解析 URL 内容，生成结构化知识卡片摘要（预览，不入库）
 *
 * Body: { url: string, discipline?: string }
 * Response: { title, content, metadata, source }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('FORBIDDEN', '需要管理员权限', 403)
    }

    const body = await request.json()
    const { url, discipline } = body

    if (!url || typeof url !== 'string') {
      return errorResponse('INVALID_INPUT', 'URL 不能为空', 400)
    }

    // 基本 URL 格式校验
    let validatedUrl: string
    try {
      const urlObj = new URL(url)
      validatedUrl = urlObj.href
    } catch {
      return errorResponse('INVALID_INPUT', 'URL 格式不正确', 400)
    }

    const result = await parseUrlForKnowledgeCard(validatedUrl)

    if ('error' in result) {
      return errorResponse('PARSE_FAILED', result.error, 422)
    }

    return successResponse({
      ...result,
      discipline: discipline || null,
    })
  } catch (error) {
    console.error('[parse-url] Error:', error)
    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : '解析失败', 500)
  }
}
