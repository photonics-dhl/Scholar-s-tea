import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { getTeaPartyRooms, createTeaPartyRoom } from '@/services/tea-party';
import type { RoomListParams } from '@/services/tea-party';

// GET /api/v1/tea-party/rooms - List rooms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: RoomListParams = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined,
      search: searchParams.get('search') || undefined,
      isPublic: searchParams.get('isPublic') !== 'false',
    };

    const result = await getTeaPartyRooms(params);

    return NextResponse.json({
      success: true,
      data: result.rooms,
      meta: result.meta,
    });
  } catch (error) {
    console.error('GET /api/v1/tea-party/rooms error:', error);
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

// POST /api/v1/tea-party/rooms - Create room
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'UNAUTHORIZED', message: '请先登录' },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, isPublic, maxParticipants } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: '房间名称不能为空' },
        },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: '房间名称不能超过50字符' },
        },
        { status: 400 }
      );
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: '房间描述不能超过500字符' },
        },
        { status: 400 }
      );
    }

    const room = await createTeaPartyRoom({
      name: name.trim(),
      description: description?.trim(),
      isPublic: isPublic ?? true,
      maxParticipants: maxParticipants ?? 50,
      hostId: session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: room,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/v1/tea-party/rooms error:', error);
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
