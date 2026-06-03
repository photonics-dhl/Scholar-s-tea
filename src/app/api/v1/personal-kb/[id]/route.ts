import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

interface Params {
  params: { id: string }
}

// PATCH /api/v1/personal-kb/documents/[id] — 更新元数据
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json().catch(() => ({}))

    // Verify ownership
    const existing = await prisma.personalDocument.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '文献不存在或无权限' } },
        { status: 404 }
      )
    }

    const {
      title,
      authors,
      year,
      journal,
      doi,
      url,
      pageCount,
      chunkCount,
      keywords,
      abstract,
    } = body

    const metadata = existing.metadata ? JSON.parse(existing.metadata) : {}

    const doc = await prisma.personalDocument.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        authors: authors !== undefined ? (Array.isArray(authors) ? JSON.stringify(authors) : null) : undefined,
        year: year !== undefined ? (year ? parseInt(year) : null) : undefined,
        journal: journal !== undefined ? journal || null : undefined,
        doi: doi !== undefined ? doi || null : undefined,
        url: url !== undefined ? url || null : undefined,
        pageCount: pageCount !== undefined ? pageCount || null : undefined,
        chunkCount: chunkCount !== undefined ? chunkCount : undefined,
        metadata: JSON.stringify({
          ...metadata,
          keywords: keywords !== undefined ? keywords : metadata.keywords,
          abstract: abstract !== undefined ? abstract : metadata.abstract,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        title: doc.title,
        updatedAt: doc.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('[PersonalKB] PATCH error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '更新文献失败' } },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/personal-kb/documents/[id] — 删除元数据
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const { id } = params

    // Verify ownership
    const existing = await prisma.personalDocument.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '文献不存在或无权限' } },
        { status: 404 }
      )
    }

    await prisma.personalDocument.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('[PersonalKB] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '删除文献失败' } },
      { status: 500 }
    )
  }
}
