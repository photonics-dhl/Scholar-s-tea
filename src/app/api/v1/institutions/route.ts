import { unstable_cache } from 'next/cache';
import { getInstitutionTree } from '@/services/groups';
import { successResponse, apiErrors } from '@/lib/api/response';

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
    return successResponse(institutions);
  } catch (error) {
    return apiErrors.internal(error, '获取机构列表失败');
  }
}
