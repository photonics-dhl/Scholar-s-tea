import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { getPostById, updatePost, deletePost } from '@/services/posts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getPostById(id);

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: '帖子不存在',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
      meta: null,
    });
  } catch (error) {
    console.error('GET /api/v1/posts/[id] error:', error);
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
    const { title, content, isPinned, isLocked } = body;

    const post = await updatePost(id, session.user.id, {
      title,
      content,
      isPinned,
      isLocked,
    });

    return NextResponse.json({
      success: true,
      data: post,
      meta: null,
    });
  } catch (error) {
    console.error('PATCH /api/v1/posts/[id] error:', error);

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
    await deletePost(id, session.user.id);

    return NextResponse.json({
      success: true,
      data: null,
      meta: null,
    });
  } catch (error) {
    console.error('DELETE /api/v1/posts/[id] error:', error);

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
