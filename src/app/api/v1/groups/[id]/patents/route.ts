import { NextRequest, NextResponse } from 'next/server';
import { getGroupPatents, createPatent } from '@/services/groups';
import { getGroupById } from '@/services/groups';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/groups/[id]/patents - Get group patents
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20;

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

    const result = await getGroupPatents(id, { page, pageSize });

    return NextResponse.json({
      success: true,
      data: result.patents,
      meta: result.meta,
    });
  } catch (error) {
    console.error('GET /api/v1/groups/[id]/patents error:', error);
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

// POST /api/v1/groups/[id]/patents - Create patent
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少必填字段：title',
          },
        },
        { status: 400 }
      );
    }

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

    const patent = await createPatent(id, body);

    return NextResponse.json(
      {
        success: true,
        data: patent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/v1/groups/[id]/patents error:', error);
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
