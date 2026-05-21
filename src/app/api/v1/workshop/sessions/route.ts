import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

/** GET /api/v1/workshop/sessions — 获取当前用户的会话列表 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const sessions = await prisma.workshopSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        mode: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    })

    return NextResponse.json({ success: true, data: sessions })
  } catch (error) {
    console.error('[WorkshopSessions] GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '获取会话列表失败' } },
      { status: 500 }
    )
  }
}

/** POST /api/v1/workshop/sessions — 创建新会话 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { title = '新对话', mode = 'general' } = body

    const newSession = await prisma.workshopSession.create({
      data: {
        userId: session.user.id,
        title: String(title).slice(0, 100),
        mode: String(mode).slice(0, 30),
      },
      select: {
        id: true,
        title: true,
        mode: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ success: true, data: newSession }, { status: 201 })
  } catch (error) {
    console.error('[WorkshopSessions] POST error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '创建会话失败' } },
      { status: 500 }
    )
  }
}
