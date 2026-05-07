import { NextRequest, NextResponse } from 'next/server';
import { getGroups, createGroup } from '@/services/groups';
import type { GroupListParams, CreateGroupDTO } from '@/types';

// GET /api/v1/groups - List groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: GroupListParams = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined,
      search: searchParams.get('search') || undefined,
      institutionId: searchParams.get('institutionId') || undefined,
      disciplineId: searchParams.get('disciplineId') || undefined,
      sortBy: (searchParams.get('sortBy') as GroupListParams['sortBy']) || undefined,
      sortOrder: (searchParams.get('sortOrder') as GroupListParams['sortOrder']) || undefined,
    };

    const result = await getGroups(params);

    return NextResponse.json({
      success: true,
      data: result.groups,
      meta: result.meta,
    });
  } catch (error) {
    console.error('GET /api/v1/groups error:', error);
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

// POST /api/v1/groups - Create group
export async function POST(request: NextRequest) {
  try {
    const body: CreateGroupDTO = await request.json();

    // Basic validation
    if (!body.name || !body.slug || !body.institutionId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少必填字段：name, slug, institutionId',
          },
        },
        { status: 400 }
      );
    }

    const group = await createGroup(body);

    return NextResponse.json(
      {
        success: true,
        data: group,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/v1/groups error:', error);

    // Check for duplicate slug error
    if (error instanceof Error && error.message.includes('已存在')) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'DUPLICATE_SLUG',
            message: error.message,
          },
        },
        { status: 409 }
      );
    }

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
