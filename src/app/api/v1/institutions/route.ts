import { NextResponse } from 'next/server';
import { getInstitutionTree } from '@/services/groups';

// GET /api/v1/institutions - Get institution tree for cascading select
export async function GET() {
  try {
    const institutions = await getInstitutionTree();

    return NextResponse.json({
      success: true,
      data: institutions,
    });
  } catch (error) {
    console.error('GET /api/v1/institutions error:', error);
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
