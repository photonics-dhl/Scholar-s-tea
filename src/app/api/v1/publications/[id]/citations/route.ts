import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/v1/publications/[id]/citations - Get citations for a publication
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const citations = await prisma.communityCitation.findMany({
      where: { publicationId: id },
      include: {
        citingUser: {
          select: { id: true, name: true, avatar: true },
        },
        citingPost: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: citations,
    });
  } catch (error) {
    console.error('GET /api/v1/publications/[id]/citations error:', error);
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

// POST /api/v1/publications/[id]/citations - Create a citation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { citingUserId, citingPostId, citingCommentId, context } = body;

    if (!citingUserId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: '缺少 citingUserId' },
        },
        { status: 400 }
      );
    }

    // Get publication to find groupId
    const publication = await prisma.publication.findUnique({
      where: { id },
      select: { groupId: true },
    });

    if (!publication) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'NOT_FOUND', message: '论文不存在' },
        },
        { status: 404 }
      );
    }

    const citation = await prisma.communityCitation.create({
      data: {
        citingUserId,
        citingPostId,
        citingCommentId,
        publicationId: id,
        groupId: publication.groupId,
        context,
      },
      include: {
        citingUser: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: citation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/v1/publications/[id]/citations error:', error);
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
