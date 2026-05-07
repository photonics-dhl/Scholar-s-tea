import { NextRequest, NextResponse } from 'next/server';
import {
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  updateGroupMemberRole,
} from '@/services/groups';
import { getGroupById } from '@/services/groups';
import type { AddMemberDTO } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/groups/[id]/members - Get members
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

    const members = await getGroupMembers(id);

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('GET /api/v1/groups/[id]/members error:', error);
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

// POST /api/v1/groups/[id]/members - Add member
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: AddMemberDTO = await request.json();

    // Validate
    if (!body.userId || !body.role) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少必填字段：userId, role',
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

    const member = await addGroupMember(id, body);

    return NextResponse.json(
      {
        success: true,
        data: member,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/v1/groups/[id]/members error:', error);

    if (error instanceof Error && error.message.includes('已是')) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'ALREADY_MEMBER',
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

// PATCH /api/v1/groups/[id]/members - Update member role
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: { userId: string; role: 'LEADER' | 'ADVISOR' | 'MEMBER' } = await request.json();

    if (!body.userId || !body.role) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少必填字段：userId, role',
          },
        },
        { status: 400 }
      );
    }

    const member = await updateGroupMemberRole(id, body.userId, body.role);

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error('PATCH /api/v1/groups/[id]/members error:', error);
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

// DELETE /api/v1/groups/[id]/members - Remove member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少 userId 参数',
          },
        },
        { status: 400 }
      );
    }

    await removeGroupMember(id, userId);

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('DELETE /api/v1/groups/[id]/members error:', error);
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
