import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

interface Params {
  params: { sessionId: string }
}

/** GET /api/v1/workshop/sessions/[sessionId] — 获取会话详情（含消息） */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const { sessionId } = params

    const workshopSession = await prisma.workshopSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            citations: true,
            ragContext: true,
            attachments: true,
            createdAt: true,
          },
        },
      },
    })

    if (!workshopSession) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '会话不存在' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: workshopSession })
  } catch (error) {
    console.error('[WorkshopSession] GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '获取会话详情失败' } },
      { status: 500 }
    )
  }
}

/** PATCH /api/v1/workshop/sessions/[sessionId] — 更新会话（标题/mode） */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const { sessionId } = params
    const body = await request.json().catch(() => ({}))
    const { title, mode } = body

    const updateData: Record<string, string> = {}
    if (title !== undefined) updateData.title = String(title).slice(0, 100)
    if (mode !== undefined) updateData.mode = String(mode).slice(0, 30)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: '无有效更新字段' } },
        { status: 400 }
      )
    }

    const updated = await prisma.workshopSession.updateMany({
      where: { id: sessionId, userId: session.user.id },
      data: updateData,
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '会话不存在或无权限' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: { updated: updated.count } })
  } catch (error) {
    console.error('[WorkshopSession] PATCH error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '更新会话失败' } },
      { status: 500 }
    )
  }
}

/** DELETE /api/v1/workshop/sessions/[sessionId] — 删除会话 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const { sessionId } = params

    const deleted = await prisma.workshopSession.deleteMany({
      where: { id: sessionId, userId: session.user.id },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '会话不存在或无权限' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: { deleted: deleted.count } })
  } catch (error) {
    console.error('[WorkshopSession] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '删除会话失败' } },
      { status: 500 }
    )
  }
}
