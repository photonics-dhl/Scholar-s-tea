import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getTopTenPosts, getAllTimeTopPosts } from '@/services/top-questions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 10;
    const allTime = searchParams.get('allTime') === 'true';

    const result = allTime
      ? await getAllTimeTopPosts({ page, pageSize })
      : await getTopTenPosts({ year, month, page, pageSize });

    return NextResponse.json({
      success: true,
      data: result,
      meta: null,
    });
  } catch (error) {
    console.error('GET /api/v1/top-questions error:', error);
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
