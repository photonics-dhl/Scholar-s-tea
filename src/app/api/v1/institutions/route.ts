import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getInstitutionTree } from '@/services/groups';

const getCachedInstitutions = unstable_cache(
  async () => getInstitutionTree(),
  ['institution-tree'],
  { revalidate: 3600, tags: ['institutions'] }
);

// GET /api/v1/institutions - Get institution tree for cascading select
// Cached for 1 hour, revalidated on institution mutations
export async function GET() {
  try {
    const institutions = await getCachedInstitutions();

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
