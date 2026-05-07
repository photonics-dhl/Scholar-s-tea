import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { createComment, getCommentsByPostId } from '@/services/comments';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 50;

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '帖子ID不能为空',
          },
        },
        { status: 400 }
      );
    }

    const result = await getCommentsByPostId(postId, { page, pageSize });

    return NextResponse.json({
      success: true,
      data: result.comments,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/comments error:', error);
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

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { postId, content, parentId } = body;

    if (!postId || !content) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '帖子ID和内容不能为空',
          },
        },
        { status: 400 }
      );
    }

    const comment = await createComment(session.user.id, postId, {
      content,
      parentId,
    });

    return NextResponse.json({
      success: true,
      data: comment,
      meta: null,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/comments error:', error);

    const message = error instanceof Error ? error.message : '服务器内部错误';
    const status = message.includes('不存在') || message.includes('锁定') ? 400 : 500;

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: status === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR',
          message,
        },
      },
      { status }
    );
  }
}
