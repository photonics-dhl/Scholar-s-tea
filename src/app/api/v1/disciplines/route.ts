import { unstable_cache } from 'next/cache';
import { getDisciplines } from '@/services/disciplines';
import { successResponse, apiErrors } from '@/lib/api/response';

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
    return successResponse(disciplines);
  } catch (error) {
    return apiErrors.internal(error, '获取学科列表失败');
  }
}
