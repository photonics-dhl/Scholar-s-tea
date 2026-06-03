import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/v1/personal-kb/documents — 获取用户文献元数据列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()

    const where: any = { userId: session.user.id }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { authors: { contains: search, mode: 'insensitive' } },
        { journal: { contains: search, mode: 'insensitive' } },
      ]
    }

    const docs = await prisma.personalDocument.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: docs.map((d) => ({
        id: d.id,
        userId: d.userId,
        title: d.title,
        authors: d.authors ? JSON.parse(d.authors) : [],
        year: d.year,
        journal: d.journal,
        doi: d.doi,
        url: d.url,
        fileSize: d.fileSize,
        pageCount: d.pageCount,
        chunkCount: d.chunkCount,
        keywords: d.metadata ? JSON.parse(d.metadata)?.keywords || [] : [],
        abstract: d.metadata ? JSON.parse(d.metadata)?.abstract || '' : '',
        sourceType: d.metadata ? JSON.parse(d.metadata)?.sourceType || 'pdf' : 'pdf',
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('[PersonalKB] GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '获取文献列表失败' } },
      { status: 500 }
    )
  }
}

// POST /api/v1/personal-kb/documents — 创建文献元数据
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
    const {
      title,
      authors,
      year,
      journal,
      doi,
      url,
      fileSize,
      pageCount,
      chunkCount,
      keywords,
      abstract,
      sourceType,
    } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: '标题不能为空' } },
        { status: 400 }
      )
    }

    const doc = await prisma.personalDocument.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        authors: authors && Array.isArray(authors) ? JSON.stringify(authors) : null,
        year: year ? parseInt(year) : null,
        journal: journal || null,
        doi: doi || null,
        url: url || null,
        fileSize: fileSize || null,
        pageCount: pageCount || null,
        chunkCount: chunkCount || 0,
        metadata: JSON.stringify({
          keywords: keywords || [],
          abstract: abstract || '',
          sourceType: sourceType || 'pdf',
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        title: doc.title,
        chunkCount: doc.chunkCount,
        createdAt: doc.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('[PersonalKB] POST error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '创建文献失败' } },
      { status: 500 }
    )
  }
}
