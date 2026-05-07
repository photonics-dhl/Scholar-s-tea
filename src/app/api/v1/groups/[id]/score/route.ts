import { NextRequest, NextResponse } from 'next/server';
import { getGroupScore, getGroupScoreHistory, recalculateGroupScore } from '@/services/groups';
import { getGroupById } from '@/services/groups';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/groups/[id]/score - Get group score
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if group exists
    const group = await getGroupById(id);
    if (!group) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: '课题组不存在',
          },
        },
        { status: 404 }
      );
    }

    const score = await getGroupScore(id);
    const history = await getGroupScoreHistory(id);

    return NextResponse.json({
      success: true,
      data: {
        score,
        history,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/groups/[id]/score error:', error);
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

// POST /api/v1/groups/[id]/score - Recalculate group score
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if group exists
    const group = await getGroupById(id);
    if (!group) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: '课题组不存在',
          },
        },
        { status: 404 }
      );
    }

    const result = await recalculateGroupScore(id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('POST /api/v1/groups/[id]/score error:', error);
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
