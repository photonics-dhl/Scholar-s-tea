import { NextRequest, NextResponse } from 'next/server';
import { getDisciplineBySlug } from '@/services/disciplines';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/v1/disciplines/[slug] - Get discipline by slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const discipline = await getDisciplineBySlug(slug);

    if (!discipline) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: '学科不存在',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: discipline,
    });
  } catch (error) {
    console.error('GET /api/v1/disciplines/[slug] error:', error);
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
