import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { chatWithZAI } from '@/lib/ai/zai-service';

// POST /api/v1/citations/verify-all - Trigger batch AI verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { limit = 20 } = body;

    // 获取所有待审核的 citations
    const pendingCitations = await prisma.communityCitation.findMany({
      where: { status: 'PENDING' },
      include: {
        publication: { select: { id: true, title: true } },
        citingPost: { select: { id: true, content: true } },
        citingComment: { select: { id: true, content: true } },
        citingUser: { select: { name: true } },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    if (pendingCitations.length === 0) {
      return NextResponse.json({
        success: true,
        data: { processed: 0, results: [] },
      });
    }

    const results = [];

    for (const citation of pendingCitations) {
      const sourceContent = citation.citingPost?.content || citation.citingComment?.content || '';
      const context = citation.context || '';
      const paperTitle = citation.publication.title;

      // AI 审核
      const verification = await verifyWithAI({
        sourceContent,
        context,
        paperTitle,
        citingUser: citation.citingUser.name || '匿名',
      });

      // 更新
      await prisma.communityCitation.update({
        where: { id: citation.id },
        data: {
          status: verification.approved ? 'APPROVED' : 'REJECTED',
          rejectionNote: verification.reason,
          verifiedAt: new Date(),
          verifiedBy: 'ai-agent',
        },
      });

      results.push({
        citationId: citation.id,
        paper: paperTitle.slice(0, 50),
        status: verification.approved ? 'APPROVED' : 'REJECTED',
        reason: verification.reason,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        results,
      },
    });
  } catch (error) {
    console.error('POST /api/v1/citations/verify-all error:', error);
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
    );
  }
}

async function verifyWithAI(input: {
  sourceContent: string;
  context: string;
  paperTitle: string;
  citingUser: string;
}): Promise<{ approved: boolean; reason: string; confidence: number }> {
  const { sourceContent, context, paperTitle, citingUser } = input;

  const prompt = `你是学术引用审核 Agent。

论文：${paperTitle}
引用者：${citingUser}
引用说明："${context}"
原文：${sourceContent.slice(0, 300)}

判断这个引用是否有效（真实、有意义、非 spam）。

返回 JSON：
{
  "approved": boolean,
  "reason": "原因（30字内）",
  "confidence": 0.0-1.0
}`;

  try {
    const result = await chatWithZAI(
      [{ role: 'user', content: prompt }],
      { model: 'glm-4.7-flash', maxTokens: 150, temperature: 0.3 }
    );

    if (result.error) {
      throw new Error(`ZAI API error: ${result.error}`);
    }

    const content = result.content || '';

    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
      const result = JSON.parse(jsonMatch ? jsonMatch[1] : content);
      return {
        approved: result.approved === true,
        reason: result.reason || '审核完成',
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      };
    } catch {
      return { approved: true, reason: 'AI 解析异常', confidence: 0.3 };
    }
  } catch (error) {
    console.error('verifyWithAI error:', error);
    return { approved: true, reason: '服务异常', confidence: 0.2 };
  }
}
