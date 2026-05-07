import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { joinRoom } from '@/services/tea-party';

// POST /api/v1/tea-party/rooms/:id/join - Join room
export async function POST(
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

    const { id: roomId } = await params;

    const participant = await joinRoom(roomId, session.user.id);

    return NextResponse.json({
      success: true,
      data: participant,
    });
  } catch (error) {
    console.error('POST /api/v1/tea-party/rooms/:id/join error:', error);

    const message = error instanceof Error ? error.message : '加入房间失败';

    if (message === 'ROOM_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'NOT_FOUND', message: '房间不存在' },
        },
        { status: 404 }
      );
    }

    if (message === 'ROOM_FULL') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'ROOM_FULL', message: '房间已满，请稍后再试' },
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
          message,
        },
      },
      { status: 500 }
    );
  }
}
