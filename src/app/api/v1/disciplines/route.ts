import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getDisciplines } from '@/services/disciplines';

const getCachedDisciplines = unstable_cache(
  async () => getDisciplines(),
  ['disciplines-tree'],
  { revalidate: 3600, tags: ['disciplines'] }
);

// GET /api/v1/disciplines - List all disciplines (tree structure)
// Cached for 1 hour, revalidated on discipline mutations
export async function GET() {
  try {
    const disciplines = await getCachedDisciplines();

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
