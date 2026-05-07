import { NextRequest, NextResponse } from 'next/server';
import { getDisciplines } from '@/services/disciplines';

// GET /api/v1/disciplines - List all disciplines (tree structure)
export async function GET() {
  try {
    const disciplines = await getDisciplines();

    return NextResponse.json({
      success: true,
      data: disciplines,
    });
  } catch (error) {
    console.error('GET /api/v1/disciplines error:', error);
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
