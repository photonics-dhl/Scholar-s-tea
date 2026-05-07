import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { searchKnowledgeBase, addToKnowledgeBase } from '@/lib/ai/rag-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const discipline = searchParams.get('discipline') || undefined;
    const limit = parseInt(searchParams.get('limit') || '5');
    const threshold = parseFloat(searchParams.get('threshold') || '0.7');

    if (!query) {
      return NextResponse.json({
        success: false,
        data: null,
        error: { code: 'INVALID_REQUEST', message: '搜索关键词不能为空' },
      }, { status: 400 });
    }

    const result = await searchKnowledgeBase(query, { limit, threshold, discipline });

    return NextResponse.json({
      success: true,
      data: result,
      meta: null,
    });
  } catch (error) {
    console.error('GET /api/v1/ai/knowledge error:', error);
    return NextResponse.json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '服务器内部错误',
      },
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: '请先登录' },
      }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, source, sourceId, discipline, metadata } = body;

    if (!title || !content) {
      return NextResponse.json({
        success: false,
        data: null,
        error: { code: 'INVALID_REQUEST', message: '标题和内容不能为空' },
      }, { status: 400 });
    }

    const result = await addToKnowledgeBase({
      title,
      content,
      source,
      sourceId,
      discipline,
      authorId: session.user.id,
      metadata,
    });

    if (result.error) {
      return NextResponse.json({
        success: false,
        data: null,
        error: { code: 'RAG_ERROR', message: result.error },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { id: result.id },
      meta: null,
    });
  } catch (error) {
    console.error('POST /api/v1/ai/knowledge error:', error);
    return NextResponse.json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '服务器内部错误',
      },
    }, { status: 500 });
  }
}
