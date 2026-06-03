import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/v1/knowledge/:id/bookmark - Check if current user bookmarked this doc
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: true, data: { bookmarked: false } })
    }

    const { id: docId } = await params
    const userId = session.user.id

    const bookmark = await prisma.knowledgeBookmark.findUnique({
      where: { userId_docId: { userId, docId } },
    })

    return NextResponse.json({
      success: true,
      data: { bookmarked: !!bookmark },
    })
  } catch (error) {
    console.error('GET /api/v1/knowledge/:id/bookmark error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Server internal error',
        },
      },
      { status: 500 }
    )
  }
}

// POST /api/v1/knowledge/:id/bookmark - Toggle bookmark
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Please sign in to bookmark' },
        },
        { status: 401 }
      )
    }

    const { id: docId } = await params
    const userId = session.user.id

    const existing = await prisma.knowledgeBookmark.findUnique({
      where: { userId_docId: { userId, docId } },
    })

    if (existing) {
      await prisma.knowledgeBookmark.delete({
        where: { userId_docId: { userId, docId } },
      })
      return NextResponse.json({
        success: true,
        data: { bookmarked: false },
      })
    }

    await prisma.knowledgeBookmark.create({
      data: { userId, docId },
    })

    return NextResponse.json({
      success: true,
      data: { bookmarked: true },
    })
  } catch (error) {
    console.error('POST /api/v1/knowledge/:id/bookmark error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Server internal error',
        },
      },
      { status: 500 }
    )
  }
}
