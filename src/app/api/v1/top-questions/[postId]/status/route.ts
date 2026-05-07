import { NextRequest, NextResponse } from 'next/server';
import { getTopTenStatus } from '@/services/top-questions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const status = await getTopTenStatus(postId);

    if (!status) {
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
      data: status,
      meta: null,
    });
  } catch (error) {
    console.error('GET /api/v1/top-questions/[postId]/status error:', error);
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
