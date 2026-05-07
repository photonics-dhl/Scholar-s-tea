import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const publication = await prisma.publication.findUnique({
      where: { id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
            institution: {
              select: { name: true },
            },
          },
        },
        linkedPosts: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                createdAt: true,
                author: {
                  select: { name: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            citedCitations: true,
            citingCitations: true,
          },
        },
      },
    });

    if (!publication) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'NOT_FOUND', message: '论文不存在' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: publication,
    });
  } catch (error) {
    console.error('GET /api/v1/publications/[id] error:', error);
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
