import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { voteComment } from '@/services/comments';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录',
          },
        },
        { status: 401 }
      );
    }

    const { id: commentId } = await params;
    const body = await request.json();
    const { value } = body;

    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '投票值必须是 1 或 -1',
          },
        },
        { status: 400 }
      );
    }

    const result = await voteComment(session.user.id, commentId, value);

    return NextResponse.json({
      success: true,
      data: result,
      meta: null,
    });
  } catch (error) {
    console.error('POST /api/v1/comments/[id]/vote error:', error);
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
