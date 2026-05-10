import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { getPosts, createPost } from '@/services/posts';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const disciplineId = searchParams.get('disciplineId') || undefined;
    const groupId = searchParams.get('groupId') || undefined;
    const authorId = searchParams.get('authorId') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20;
    const sort = (searchParams.get('sort') || 'latest') as 'latest' | 'hot' | 'pinned';
    const search = searchParams.get('search') || undefined;

    const result = await getPosts({
      disciplineId,
      groupId,
      authorId,
      page,
      pageSize,
      sort,
      search,
    });

    return NextResponse.json({
      success: true,
      data: result.posts,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/posts error:', error);
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
    const { title, content, disciplineId, groupId, tags } = body;

    // Normalize tags: handle both string (comma-separated) and array
    const normalizedTags = typeof tags === 'string' && tags.length > 0
      ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : Array.isArray(tags) ? tags : [];

    // Resolve disciplineId: if it's a slug instead of UUID, look up the actual ID
    let resolvedDisciplineId = disciplineId;
    if (disciplineId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(disciplineId)) {
      const discipline = await prisma.discipline.findUnique({
        where: { slug: disciplineId },
        select: { id: true },
      });
      if (discipline) {
        resolvedDisciplineId = discipline.id;
      } else {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: '无效的学科板块',
            },
          },
          { status: 400 }
        );
      }
    }

    if (!title || !content) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '标题和内容不能为空',
          },
        },
        { status: 400 }
      );
    }

    const post = await createPost(session.user.id, {
      title,
      content,
      disciplineId: resolvedDisciplineId,
      groupId,
      tags: normalizedTags,
    });

    return NextResponse.json({
      success: true,
      data: post,
      meta: null,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/posts error:', error);
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
