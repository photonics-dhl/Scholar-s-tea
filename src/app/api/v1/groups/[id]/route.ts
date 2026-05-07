import { NextRequest, NextResponse } from 'next/server';
import {
  getGroupById,
  getGroupBySlug,
  updateGroup,
  deleteGroup,
} from '@/services/groups';
import type { UpdateGroupDTO } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/groups/[id] - Get group by ID or slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Try to find by ID first, then by slug
    let group = await getGroupById(id);
    if (!group) {
      group = await getGroupBySlug(id);
    }

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

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error('GET /api/v1/groups/[id] error:', error);
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

// PATCH /api/v1/groups/[id] - Update group
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateGroupDTO = await request.json();

    // Check if group exists
    const existing = await getGroupById(id);
    if (!existing) {
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

    const group = await updateGroup(id, body);

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error('PATCH /api/v1/groups/[id] error:', error);

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

// DELETE /api/v1/groups/[id] - Delete group
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if group exists
    const existing = await getGroupById(id);
    if (!existing) {
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

    await deleteGroup(id);

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('DELETE /api/v1/groups/[id] error:', error);
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
