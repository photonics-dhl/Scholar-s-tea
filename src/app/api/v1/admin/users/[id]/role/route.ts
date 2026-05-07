import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/v1/admin/users/[id]/role - Update user role (ADMIN only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    // Check admin privilege
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'FORBIDDEN', message: '需要管理员权限' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = (await request.json()) as { role: 'USER' | 'GROUP_ADMIN' | 'ADMIN' }

    if (!body.role || !['USER', 'GROUP_ADMIN', 'ADMIN'].includes(body.role)) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'VALIDATION_ERROR', message: '无效的角色值' } },
        { status: 400 }
      )
    }

    // Prevent self-demotion (optional safety)
    if (id === session.user.id && body.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'FORBIDDEN', message: '不能取消自己的管理员权限' } },
        { status: 403 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('PATCH /api/v1/admin/users/[id]/role error:', error)

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'NOT_FOUND', message: '用户不存在' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    )
  }
}
