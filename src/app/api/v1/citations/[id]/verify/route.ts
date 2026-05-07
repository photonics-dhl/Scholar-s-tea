import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/v1/citations/[id]/verify - Approve or reject citation
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, verifierId, rejectionNote } = body;

    if (!verifierId || !action) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: '缺少必要参数' },
        },
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: 'action 必须是 APPROVED 或 REJECTED' },
        },
        { status: 400 }
      );
    }

    const citation = await prisma.communityCitation.update({
      where: { id },
      data: {
        status: action,
        verifiedBy: verifierId,
        verifiedAt: new Date(),
        rejectionNote: action === 'REJECTED' ? rejectionNote : null,
      },
      include: {
        citingUser: { select: { id: true, name: true } },
        publication: { select: { id: true, title: true } },
        group: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: citation,
    });
  } catch (error) {
    console.error('PATCH /api/v1/citations/[id]/verify error:', error);
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
