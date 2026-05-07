import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { leaveRoom } from '@/services/tea-party';

// POST /api/v1/tea-party/rooms/:id/leave - Leave room
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

    await leaveRoom(roomId, session.user.id);

    return NextResponse.json({
      success: true,
      data: { message: '已离开房间' },
    });
  } catch (error) {
    console.error('POST /api/v1/tea-party/rooms/:id/leave error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '离开房间失败',
        },
      },
      { status: 500 }
    );
  }
}
