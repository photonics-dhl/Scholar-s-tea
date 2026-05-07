import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { votePost } from '@/services/posts';

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

    const { id: postId } = await params;
    const body = await request.json();
    const { value } = body;

    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '投票值必须是 1（点赞）或 -1（反对）',
          },
        },
        { status: 400 }
      );
    }

    const result = await votePost(session.user.id, postId, value);

    return NextResponse.json({
      success: true,
      data: result,
      meta: null,
    });
  } catch (error) {
    console.error('POST /api/v1/posts/[id]/vote error:', error);
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
