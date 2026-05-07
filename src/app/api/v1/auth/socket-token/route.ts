import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { SignJWT } from 'jose';

// Use same secret as socket server for token verification
const SOCKET_SECRET = process.env.SOCKET_SECRET || process.env.NEXTAUTH_SECRET || 'scholars-tea-socket-secret';
const secret = new TextEncoder().encode(SOCKET_SECRET);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    // Create token with same structure as socket server expects
    // Socket server expects { id, email, name? } payload
    const token = await new SignJWT({
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || '',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    return NextResponse.json({ success: true, data: { token } });
  } catch (error) {
    console.error('Socket token error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    );
  }
}