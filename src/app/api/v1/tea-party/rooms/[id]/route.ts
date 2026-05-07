import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { getTeaPartyRoom, updateTeaPartyRoom, deleteTeaPartyRoom } from '@/services/tea-party';

// GET /api/v1/tea-party/rooms/:id - Get room details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = await getTeaPartyRoom(id);

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'NOT_FOUND', message: '房间不存在' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('GET /api/v1/tea-party/rooms/:id error:', error);
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

// PATCH /api/v1/tea-party/rooms/:id - Update room
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const room = await getTeaPartyRoom(id);

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'NOT_FOUND', message: '房间不存在' },
        },
        { status: 404 }
      );
    }

    // Only host can update
    if (room.hostId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'FORBIDDEN', message: '只有房主可以修改房间' },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, isPublic, maxParticipants } = body;

    const updated = await updateTeaPartyRoom(id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(isPublic !== undefined && { isPublic }),
      ...(maxParticipants && { maxParticipants }),
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('PATCH /api/v1/tea-party/rooms/:id error:', error);
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

// DELETE /api/v1/tea-party/rooms/:id - Delete room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const room = await getTeaPartyRoom(id);

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'NOT_FOUND', message: '房间不存在' },
        },
        { status: 404 }
      );
    }

    // Only host can delete
    if (room.hostId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'FORBIDDEN', message: '只有房主可以删除房间' },
        },
        { status: 403 }
      );
    }

    await deleteTeaPartyRoom(id);

    return NextResponse.json({
      success: true,
      data: { message: '房间已删除' },
    });
  } catch (error) {
    console.error('DELETE /api/v1/tea-party/rooms/:id error:', error);
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
