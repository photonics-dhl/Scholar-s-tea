import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

interface Params {
  params: { sessionId: string }
}

/** POST /api/v1/workshop/sessions/[sessionId]/messages — 批量保存消息 */
export async function POST(request: NextRequest, { params }: Params) {
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
    const { messages } = body as {
      messages?: Array<{
        role: string
        content: string
        citations?: unknown
        ragContext?: unknown
        attachments?: unknown
      }>
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: '消息列表不能为空' } },
        { status: 400 }
      )
    }

    // Verify session ownership
    const workshopSession = await prisma.workshopSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
      select: { id: true },
    })

    if (!workshopSession) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '会话不存在或无权限' } },
        { status: 404 }
      )
    }

    // Use transaction for atomicity
    const created = await prisma.$transaction(
      messages.map((msg) =>
        prisma.workshopMessage.create({
          data: {
            sessionId,
            role: msg.role.slice(0, 20),
            content: msg.content,
            citations: msg.citations ? JSON.stringify(msg.citations) : null,
            ragContext: msg.ragContext ? JSON.stringify(msg.ragContext) : null,
            attachments: msg.attachments ? JSON.stringify(msg.attachments) : null,
          },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        })
      )
    )

    // Touch session updatedAt
    await prisma.workshopSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ success: true, data: { count: created.length, messages: created } })
  } catch (error) {
    console.error('[WorkshopMessages] POST error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '保存消息失败' } },
      { status: 500 }
    )
  }
}
