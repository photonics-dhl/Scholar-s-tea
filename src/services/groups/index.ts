import prisma from '@/lib/db/prisma';
import type {
  GroupListParams,
  CreateGroupDTO,
  UpdateGroupDTO,
  AddMemberDTO,
} from '@/types';
import { Prisma } from '@prisma/client';

// ============================================
// Query Functions
// ============================================

export async function getGroups(params: GroupListParams = {}) {
  const {
    page = 1,
    pageSize = 12,
    search,
    institutionId,
    disciplineId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  const where: Prisma.ResearchGroupWhereInput = {};

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Institution filter
  if (institutionId) {
    where.institutionId = institutionId;
  }

  // Discipline filter (via GroupDiscipline)
  if (disciplineId) {
    where.disciplines = {
      some: {
        disciplineId,
      },
    };
  }

  // Get total count
  const total = await prisma.researchGroup.count({ where });

  // Get groups with relations
  const groups = await prisma.researchGroup.findMany({
    where,
    include: {
      institution: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
      college: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          members: true,
          publications: true,
          news: true,
          patents: true,
          posts: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    groups,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getGroupBySlug(slug: string) {
  const group = await prisma.researchGroup.findUnique({
    where: { slug },
    include: {
      institution: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
      college: {
        select: {
          id: true,
          name: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true,
            },
          },
        },
        orderBy: {
          role: 'asc', // LEADER first
        },
      },
      disciplines: {
        include: {
          discipline: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
          publications: true,
          news: true,
          patents: true,
          posts: true,
        },
      },
    },
  });

  return group;
}

export async function getGroupById(id: string) {
  return prisma.researchGroup.findUnique({
    where: { id },
    include: {
      institution: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
      college: {
        select: {
          id: true,
          name: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true,
            },
          },
        },
        orderBy: {
          role: 'asc',
        },
      },
      disciplines: {
        include: {
          discipline: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
          publications: true,
          news: true,
          patents: true,
          posts: true,
        },
      },
    },
  });
}

// ============================================
// Mutation Functions
// ============================================

export async function createGroup(data: CreateGroupDTO) {
  const { name, slug, description, institutionId, collegeId, departmentId, logo, banner } = data;

  // Check if slug already exists
  const existing = await prisma.researchGroup.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new Error('课题组 URL 别名已存在');
  }

  // Verify institution exists
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
  });

  if (!institution) {
    throw new Error('机构不存在');
  }

  return prisma.researchGroup.create({
    data: {
      name,
      slug,
      description,
      institutionId,
      collegeId,
      departmentId,
      logo,
      banner,
    },
  });
}

export async function updateGroup(id: string, data: UpdateGroupDTO) {
  const { name, slug, description, institutionId, collegeId, departmentId, logo, banner } = data;

  // Check if slug already exists (and not this group)
  if (slug) {
    const existing = await prisma.researchGroup.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (existing) {
      throw new Error('课题组 URL 别名已存在');
    }
  }

  return prisma.researchGroup.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      institutionId,
      collegeId,
      departmentId,
      logo,
      banner,
    },
  });
}

export async function deleteGroup(id: string) {
  return prisma.researchGroup.delete({
    where: { id },
  });
}

// ============================================
// Member Management
// ============================================

export async function getGroupMembers(groupId: string) {
  return prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
        },
      },
    },
    orderBy: {
      role: 'asc',
    },
  });
}

export async function addGroupMember(groupId: string, data: AddMemberDTO) {
  const { userId, role } = data;

  // Check if already a member
  const existing = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (existing) {
    throw new Error('该用户已是课题组成员');
  }

  return prisma.groupMember.create({
    data: {
      userId,
      groupId,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
        },
      },
    },
  });
}

export async function updateGroupMemberRole(groupId: string, userId: string, role: 'LEADER' | 'ADVISOR' | 'MEMBER') {
  return prisma.groupMember.update({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    data: { role },
  });
}

export async function removeGroupMember(groupId: string, userId: string) {
  return prisma.groupMember.delete({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });
}

// ============================================
// Publications
// ============================================

export async function getGroupPublications(groupId: string, params: { page?: number; pageSize?: number } = {}) {
  const { page = 1, pageSize = 20 } = params;

  const where = { groupId };

  const total = await prisma.publication.count({ where });

  const publications = await prisma.publication.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    publications,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function createPublication(groupId: string, data: {
  title: string;
  abstract?: string;
  authors?: string[];
  year?: number;
  doi?: string;
  url?: string;
  pdfUrl?: string;
  semanticScholarId?: string;
}) {
  const { title, abstract, authors, year, doi, url, pdfUrl, semanticScholarId } = data;

  // Check for duplicate DOI if provided
  if (doi) {
    const existing = await prisma.publication.findUnique({
      where: { doi },
    });
    if (existing) {
      throw new Error('该 DOI 论文已存在');
    }
  }

  // Check for duplicate Semantic Scholar ID if provided
  if (semanticScholarId) {
    const existing = await prisma.publication.findUnique({
      where: { semanticScholarId },
    });
    if (existing) {
      throw new Error('该论文已存在');
    }
  }

  return prisma.publication.create({
    data: {
      title,
      abstract,
      authors: authors || [],
      year,
      doi,
      url,
      pdfUrl,
      semanticScholarId,
      groupId,
    },
  });
}

// ============================================
// News
// ============================================

export async function getGroupNews(groupId: string, params: { page?: number; pageSize?: number } = {}) {
  const { page = 1, pageSize = 20 } = params;

  const where = { groupId };

  const total = await prisma.news.count({ where });

  const news = await prisma.news.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    news,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function createNews(groupId: string, data: {
  title: string;
  content: string;
  coverImage?: string;
}) {
  const { title, content, coverImage } = data;

  return prisma.news.create({
    data: {
      title,
      content,
      coverImage,
      groupId,
    },
  });
}

// ============================================
// Patents
// ============================================

export async function getGroupPatents(groupId: string, params: { page?: number; pageSize?: number } = {}) {
  const { page = 1, pageSize = 20 } = params;

  const where = { groupId };

  const total = await prisma.patent.count({ where });

  const patents = await prisma.patent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    patents,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function createPatent(groupId: string, data: {
  title: string;
  number?: string;
  status?: string;
  filingDate?: Date;
}) {
  const { title, number, status, filingDate } = data;

  return prisma.patent.create({
    data: {
      title,
      number,
      status,
      filingDate,
      groupId,
    },
  });
}

// ============================================
// Scoring
// ============================================

export async function getGroupScore(groupId: string) {
  const group = await prisma.researchGroup.findUnique({
    where: { id: groupId },
    select: { score: true, rank: true },
  });
  return group;
}

export async function getGroupScoreHistory(groupId: string, limit = 30) {
  return prisma.scoreHistory.findMany({
    where: { groupId },
    orderBy: { recordedAt: 'desc' },
    take: limit,
  });
}

export async function recalculateGroupScore(groupId: string) {
  // ========================================================================
  // 质量导向评分体系 v2 - 基于社区真实引用
  // ========================================================================
  // 社区引用 (40%):
  //   - 社区引用次数 × 10 (40%)
  // 社区认可 (30%):
  //   - 关注者数 × 5 (15%)
  //   - 帖子投票净值 × 2 (15%)
  // 活跃度 (30%):
  //   - 30天内动态数 × 5 (15%)
  //   - 论文数 × 2 (15%)
  // ========================================================================

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 并行获取所有指标数据
  const [
    communityCitations,
    followersCount,
    posts,
    recentNews,
    publicationsCount,
  ] = await Promise.all([
    // 社区引用（仅计算已认证的）
    prisma.communityCitation.findMany({
      where: { groupId, status: 'APPROVED' },
      select: { id: true, context: true },
    }),
    // 关注者数量
    prisma.researchGroup.findUnique({
      where: { id: groupId },
      select: { _count: { select: { followers: true } } },
    }),
    // 帖子投票数据
    prisma.post.findMany({
      where: { author: { groups: { some: { groupId } } } },
      select: { votes: { select: { value: true } } },
    }),
    // 30天内动态
    prisma.news.count({
      where: { groupId, createdAt: { gte: thirtyDaysAgo } },
    }),
    // 论文总数
    prisma.publication.count({
      where: { groupId },
    }),
  ]);

  // ---- 社区引用 (40%) ----
  const citationCount = communityCitations.length;
  // 有上下文说明的引用质量更高
  const citationsWithContext = communityCitations.filter(c => c.context && c.context.length > 10).length;
  const citationScore = Math.round(
    citationCount * 10 +  // 基础引用 × 10
    citationsWithContext * 5 // 有高质量上下文的额外加分
  );

  // ---- 社区认可 (30%) ----
  const followers = followersCount?._count?.followers || 0;
  const votesSum = posts.reduce((sum, post) =>
    sum + post.votes.reduce((vSum, vote) => vSum + vote.value, 0), 0
  );

  const communityScore = Math.round(
    followers * 5 +  // 关注者 × 5 (15%)
    votesSum * 2    // 投票净值 × 2 (15%)
  );

  // ---- 活跃度 (30%) ----
  const activityScore = Math.round(
    recentNews * 5 +   // 30天动态 × 5 (15%)
    publicationsCount * 2  // 论文数 × 2 (15%)
  );

  // 综合得分
  const score = citationScore + communityScore + activityScore;

  // 更新数据库
  const group = await prisma.researchGroup.update({
    where: { id: groupId },
    data: { score },
  });

  // 记录历史
  await prisma.scoreHistory.create({
    data: { groupId, score },
  });

  return {
    score: group.score,
    breakdown: {
      citation: {
        count: citationCount,
        withContext: citationsWithContext,
        points: citationScore,
      },
      community: {
        followers,
        votesSum,
        points: communityScore,
      },
      activity: {
        recentNews,
        publicationsCount,
        points: activityScore,
      },
    },
  };
}

// ============================================
// Institution Tree (for cascading select)
// ============================================

export async function getInstitutionTree() {
  return prisma.institution.findMany({
    include: {
      colleges: {
        include: {
          departments: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}
