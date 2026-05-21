import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional().nullable(),
  academicProfile: z.object({
    researchField: z.array(z.string()).optional(),
    educationLevel: z.string().optional(),
    institution: z.string().optional(),
    position: z.string().optional(),
    interests: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    publications: z.array(z.string()).optional(),
    bioDetail: z.string().optional(),
  }).optional().nullable(),
})

// GET /api/v1/user/profile - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        role: true,
        academicProfile: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'NOT_FOUND', message: '用户不存在' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('GET /api/v1/user/profile error:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    )
  }
}

// PUT /api/v1/user/profile - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = updateProfileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'VALIDATION_ERROR', message: '参数格式错误', details: result.error.format() } },
        { status: 400 }
      )
    }

    const { name, bio, academicProfile } = result.data

    const updateData: { name?: string; bio?: string | null; academicProfile?: Prisma.InputJsonValue } = {}
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (academicProfile !== undefined) updateData.academicProfile = academicProfile as Prisma.InputJsonValue

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        role: true,
        academicProfile: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('PUT /api/v1/user/profile error:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    )
  }
}
