import { NextRequest, NextResponse } from 'next/server';
import { getRoomMessages } from '@/services/tea-party';

// GET /api/v1/tea-party/rooms/:id/messages - Get room messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const { searchParams } = new URL(request.url);

    const cursor = searchParams.get('cursor') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const direction = (searchParams.get('direction') as 'forward' | 'backward') || 'forward';

    const result = await getRoomMessages(roomId, {
      cursor,
      limit: Math.min(limit, 100),
      direction,
    });

    return NextResponse.json({
      success: true,
      data: result.messages,
      meta: result.meta,
    });
  } catch (error) {
    console.error('GET /api/v1/tea-party/rooms/:id/messages error:', error);
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
