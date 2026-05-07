import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// POST /api/v1/citations/batch-verify - Agent batch verifies pending citations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { limit = 10 } = body;

    // 获取待审核的 citations
    const pendingCitations = await prisma.communityCitation.findMany({
      where: { status: 'PENDING' },
      include: {
        publication: { select: { id: true, title: true } },
        citingPost: { select: { id: true, title: true, content: true } },
        citingComment: { select: { id: true, content: true } },
        citingUser: { select: { id: true, name: true } },
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
      const verification = await verifyCitationWithAI({
        sourceContent,
        context,
        paperTitle,
        publicationId: citation.publication.id,
        citingUser: citation.citingUser.name || '匿名用户',
      });

      // 更新状态
      await prisma.communityCitation.update({
        where: { id: citation.id },
        data: {
          status: verification.approved ? 'APPROVED' : 'REJECTED',
          rejectionNote: verification.reason,
          verifiedAt: new Date(),
          verifiedBy: 'system-agent',
        },
      });

      results.push({
        citationId: citation.id,
        status: verification.approved ? 'APPROVED' : 'REJECTED',
        reason: verification.reason,
        confidence: verification.confidence,
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
    console.error('POST /api/v1/citations/batch-verify error:', error);
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

async function verifyCitationWithAI(input: {
  sourceContent: string;
  context: string;
  paperTitle: string;
  publicationId: string;
  citingUser: string;
}): Promise<{ approved: boolean; reason: string; confidence: number }> {
  const { sourceContent, context, paperTitle, citingUser } = input;

  const prompt = `你是学术引用审核 Agent。判断以下引用是否真实有效。

论文：${paperTitle}
用户 ${citingUser} 声称："${context}"
原文：${sourceContent.slice(0, 400)}

判断：引用是否有具体内容、是否相关、是否有学术价值？

返回 JSON：
{
  "approved": true/false,
  "reason": "原因（30字内）",
  "confidence": 0.0-1.0
}`;

  try {
    const response = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      const result = JSON.parse(jsonStr);

      return {
        approved: result.approved === true,
        reason: result.reason || '审核完成',
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      };
    } catch {
      return { approved: true, reason: 'AI 解析异常', confidence: 0.3 };
    }
  } catch (error) {
    console.error('AI verification error:', error);
    return { approved: true, reason: '服务异常', confidence: 0.2 };
  }
}
