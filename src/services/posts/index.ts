import prisma from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

// ============================================
// Types
// ============================================

export type PostWithDetails = Prisma.PostGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        name: true;
        avatar: true;
      };
    };
    discipline: {
      select: {
        id: true;
        name: true;
        slug: true;
      };
    };
    _count: {
      select: {
        comments: true;
        votes: true;
      };
    };
    votes: {
      select: {
        userId: true;
        value: true;
      };
    };
  };
}>;

export interface CreatePostInput {
  title: string;
  content: string;
  disciplineId?: string;
  groupId?: string;
  tags?: string[];
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  isPinned?: boolean;
  isLocked?: boolean;
}

export type SortOrder = 'latest' | 'hot' | 'pinned';

// ============================================
// Query Functions
// ============================================

export async function getPosts(params: {
  disciplineId?: string;
  groupId?: string;
  authorId?: string;
  page?: number;
  pageSize?: number;
  sort?: SortOrder;
  search?: string;
}) {
  const { disciplineId, groupId, authorId, page = 1, pageSize = 20, sort = 'latest', search } = params;

  const where: Prisma.PostWhereInput = {
    ...(disciplineId && { disciplineId }),
    ...(groupId && { groupId }),
    ...(authorId && { authorId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  let orderBy: Prisma.PostOrderByWithRelationInput = { createdAt: 'desc' };
  if (sort === 'hot') {
    orderBy = { viewCount: 'desc' };
  } else if (sort === 'pinned') {
    orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }] as unknown as Prisma.PostOrderByWithRelationInput;
  }

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        discipline: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
        votes: {
          select: {
            userId: true,
            value: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Calculate vote stats
  const postsWithStats = posts.map((post) => {
    const upvotes = post.votes.filter((v) => v.value === 1).length;
    const downvotes = post.votes.filter((v) => v.value === -1).length;
    const { votes: _, ...rest } = post;
    return {
      ...rest,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
    };
  });

  return {
    posts: postsWithStats,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      discipline: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      linkedPublications: {
        include: {
          publication: {
            select: {
              id: true,
              title: true,
              doi: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
          votes: true,
        },
      },
      votes: true,
    },
  });

  if (!post) return null;

  // Increment view count
  await prisma.post.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  const upvotes = post.votes.filter((v) => v.value === 1).length;
  const downvotes = post.votes.filter((v) => v.value === -1).length;
  const { votes: _, ...rest } = post;

  return {
    ...rest,
    upvotes,
    downvotes,
    score: upvotes - downvotes,
  };
}

export async function getPostsByDisciplineSlug(slug: string, params: {
  page?: number;
  pageSize?: number;
  sort?: SortOrder;
}) {
  const { page = 1, pageSize = 20, sort = 'latest' } = params;

  const discipline = await prisma.discipline.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          posts: true,
          groups: true,
        },
      },
    },
  });

  if (!discipline) return null;

  const { posts, total, totalPages } = await getPosts({
    disciplineId: discipline.id,
    page,
    pageSize,
    sort,
  });

  return {
    discipline,
    posts,
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ============================================
// Create/Update Functions
// ============================================

export async function createPost(authorId: string, data: CreatePostInput) {
  const { title, content, disciplineId, groupId, tags } = data;

  return prisma.post.create({
    data: {
      title,
      content,
      authorId,
      disciplineId,
      groupId,
      tags: tags && tags.length > 0 ? {
        create: tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        })),
      } : undefined,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      discipline: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}

export async function updatePost(id: string, authorId: string, data: UpdatePostInput) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!post) throw new Error('帖子不存在');
  if (post.authorId !== authorId) throw new Error('无权限修改');

  return prisma.post.update({
    where: { id },
    data,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
}

export async function deletePost(id: string, authorId: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!post) throw new Error('帖子不存在');
  if (post.authorId !== authorId) throw new Error('无权限删除');

  await prisma.post.delete({ where: { id } });
  return { success: true };
}

// ============================================
// Vote Functions
// ============================================

export async function votePost(userId: string, postId: string, value: 1 | -1) {
  const existing = await prisma.vote.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (existing) {
    if (existing.value === value) {
      // Remove vote if same value
      await prisma.vote.delete({
        where: { id: existing.id },
      });
      return { action: 'removed', value: 0 };
    } else {
      // Update vote if different value
      const updated = await prisma.vote.update({
        where: { id: existing.id },
        data: { value },
      });
      return { action: 'updated', value: updated.value };
    }
  }

  // Create new vote
  const vote = await prisma.vote.create({
    data: {
      userId,
      postId,
      value,
    },
  });
  return { action: 'created', value: vote.value };
}

export async function getUserVotes(userId: string, postIds: string[]) {
  const votes = await prisma.vote.findMany({
    where: {
      userId,
      postId: { in: postIds },
    },
    select: {
      postId: true,
      value: true,
    },
  });

  return votes.reduce((acc, vote) => {
    if (vote.postId) {
      acc[vote.postId] = vote.value;
    }
    return acc;
  }, {} as Record<string, number>);
}
