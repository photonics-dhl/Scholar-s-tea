import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { updateComment, deleteComment } from '@/services/comments';

export async function PATCH(
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

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '内容不能为空',
          },
        },
        { status: 400 }
      );
    }

    const comment = await updateComment(id, session.user.id, content);

    return NextResponse.json({
      success: true,
      data: comment,
      meta: null,
    });
  } catch (error) {
    console.error('PATCH /api/v1/comments/[id] error:', error);

    const message = error instanceof Error ? error.message : '服务器内部错误';
    const status = message.includes('不存在') ? 404 : message.includes('无权限') ? 403 : 500;

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR',
          message,
        },
      },
      { status }
    );
  }
}

export async function DELETE(
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

    const { id } = await params;
    await deleteComment(id, session.user.id);

    return NextResponse.json({
      success: true,
      data: null,
      meta: null,
    });
  } catch (error) {
    console.error('DELETE /api/v1/comments/[id] error:', error);

    const message = error instanceof Error ? error.message : '服务器内部错误';
    const status = message.includes('不存在') ? 404 : message.includes('无权限') ? 403 : 500;

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR',
          message,
        },
      },
      { status }
    );
  }
}
