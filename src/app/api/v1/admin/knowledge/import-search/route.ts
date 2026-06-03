import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { searchPapersForTopic } from '@/lib/ai/external-paper-search'
import { successResponse, errorResponse } from '@/lib/api/response'

/**
 * POST /api/v1/admin/knowledge/import-search
 * 搜索学术文献，返回结果列表供管理员预览（不入库）
 *
 * Body: { query: string, limit?: number, sources?: string[], discipline?: string }
 * Response: { papers: [...] }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('FORBIDDEN', '需要管理员权限', 403)
    }

    const body = await request.json()
    const { query, limit = 5, sources, discipline } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return errorResponse('INVALID_INPUT', '搜索关键词不能为空', 400)
    }

    const maxLimit = Math.min(Math.max(parseInt(String(limit), 10) || 5, 1), 10)

    const result = await searchPapersForTopic(query.trim(), { limit: maxLimit })

    // 按来源过滤
    let papers = result.papers
    if (Array.isArray(sources) && sources.length > 0) {
      papers = papers.filter((p) => sources.includes(p.source))
    }

    // 转换为知识库预览格式
    const previewPapers = papers.map((p) => ({
      id: p.id,
      title: p.title,
      authors: p.authors || [],
      year: p.year,
      abstract: p.abstract || '',
      url: p.url || p.pdfUrl || '',
      venue: p.venue,
      source: p.source,
      citationCount: p.citationCount,
      // 建议的初始 content：用 abstract 填充，管理员可编辑
      suggestedContent: p.abstract
        ? `【核心贡献】\n${p.abstract.slice(0, 300)}${p.abstract.length > 300 ? '...' : ''}\n\n（请管理员补充完整的结构化摘要）`
        : '（无摘要，请管理员手动补充）',
    }))

    return successResponse({
      query: result.query,
      totalFound: result.totalFound,
      papers: previewPapers,
      discipline: discipline || null,
    })
  } catch (error) {
    console.error('[import-search] Error:', error)
    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : '搜索失败', 500)
  }
}
