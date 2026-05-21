import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { chatWithZAI } from '@/lib/ai/zai-service';

// POST /api/v1/citations/agent-verify - Agent verifies a citation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { citationId } = body;

    if (!citationId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: '缺少 citationId' },
        },
        { status: 400 }
      );
    }

    // 获取 citation 详情
    const citation = await prisma.communityCitation.findUnique({
      where: { id: citationId },
      include: {
        publication: { select: { id: true, title: true, abstract: true, groupId: true } },
        citingPost: { select: { id: true, title: true, content: true } },
        citingComment: { select: { id: true, content: true } },
        citingUser: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
    });

    if (!citation) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'NOT_FOUND', message: '引用不存在' },
        },
        { status: 404 }
      );
    }

    if (citation.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'ALREADY_PROCESSED', message: '该引用已审核' },
        },
        { status: 400 }
      );
    }

    // 构建审核上下文
    const sourceContent = citation.citingPost?.content || citation.citingComment?.content || '';
    const context = citation.context || '';
    const paperTitle = citation.publication.title;

    // 调用 AI 审核（使用 MiniMax MCP 或直接调用）
    const verificationResult = await verifyCitationWithAI({
      sourceContent,
      context,
      paperTitle,
      publicationId: citation.publication.id,
      citingUser: citation.citingUser.name || '匿名用户',
    });

    // 更新 citation 状态
    const updated = await prisma.communityCitation.update({
      where: { id: citationId },
      data: {
        status: verificationResult.approved ? 'APPROVED' : 'REJECTED',
        rejectionNote: verificationResult.reason,
        verifiedAt: new Date(),
        // 暂时用 system 用户，真实场景需要 service account
        verifiedBy: 'system-agent',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        citationId,
        status: updated.status,
        reason: verificationResult.reason,
        confidence: verificationResult.confidence,
      },
    });
  } catch (error) {
    console.error('POST /api/v1/citations/agent-verify error:', error);
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

interface VerifyInput {
  sourceContent: string;
  context: string;
  paperTitle: string;
  publicationId: string;
  citingUser: string;
}

interface VerifyResult {
  approved: boolean;
  reason: string;
  confidence: number;
}

/**
 * 使用 AI 审核引用真实性
 */
async function verifyCitationWithAI(input: VerifyInput): Promise<VerifyResult> {
  const { sourceContent, context, paperTitle, citingUser } = input;

  // 构建审核 prompt
  const prompt = `你是一个学术引用审核 Agent。请判断以下引用是否真实有效。

## 被引用论文
标题：${paperTitle}

## 引用来源
用户 ${citingUser} 声称：
"${context}"

## 原文上下文
${sourceContent.slice(0, 500)}

## 审核标准
请判断以下几点：
1. 引用是否有明确的具体内容（非泛泛而谈）
2. 引用是否与论文主题相关
3. 是否有 spam 或无意义引用的迹象（如随机关键词堆砌）
4. 引用是否有学术价值（提供了见解、解决了问题、给出了方法等）

## 输出格式
请返回 JSON 格式：
{
  "approved": true/false,
  "reason": "简短原因（30字以内）",
  "confidence": 0.0-1.0
}

只返回 JSON，不要其他内容。`;

  try {
    // 调用 ZAI GLM-4.7-Flash API（轻量级审核任务）
    const result = await chatWithZAI(
      [{ role: 'user', content: prompt }],
      { model: 'glm-4.7-flash', maxTokens: 200, temperature: 0.3 }
    );

    if (result.error) {
      throw new Error(`ZAI API error: ${result.error}`);
    }

    const content = result.content || '';

    // 解析 JSON 响应
    try {
      // 尝试提取 JSON（可能包含在 markdown 代码块中）
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      const result = JSON.parse(jsonStr);

      return {
        approved: result.approved === true,
        reason: result.reason || '审核完成',
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      };
    } catch {
      // JSON 解析失败，使用默认逻辑
      return {
        approved: true, // 默认通过，需要人工复查
        reason: 'AI 审核异常，默认通过',
        confidence: 0.3,
      };
    }
  } catch (error) {
    console.error('AI verification failed:', error);
    return {
      approved: true, // API 失败时默认通过，需人工复查
      reason: 'AI 服务异常，默认通过',
      confidence: 0.2,
    };
  }
}
