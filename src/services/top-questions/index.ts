import prisma from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

// ============================================
// Types
// ============================================

export type TopTenPost = Prisma.PostGetPayload<{
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
  };
}>;

export interface TopTenEntry {
  rank: number;
  post: TopTenPost;
  voteCount: number;
}

// ============================================
// Query Functions
// ============================================

export async function getTopTenPosts(params: {
  year?: number;
  month?: number;
  page?: number;
  pageSize?: number;
} = {}) {
  const { year, month, page = 1, pageSize = 10 } = params;

  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1;

  // Get start and end of month
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  // Find TOP10 candidates (posts created in this month with topTenVotes > 0)
  const posts = await prisma.post.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      topTenVotes: {
        gt: 0,
      },
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
      _count: {
        select: {
          comments: true,
          votes: true,
        },
      },
    },
    orderBy: {
      topTenVotes: 'desc',
    },
    take: pageSize,
    skip: (page - 1) * pageSize,
  });

  // Get total count
  const total = await prisma.post.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      topTenVotes: {
        gt: 0,
      },
    },
  });

  // Assign ranks
  const entries: TopTenEntry[] = posts.map((post, index) => ({
    rank: (page - 1) * pageSize + index + 1,
    post,
    voteCount: post.topTenVotes,
  }));

  return {
    entries,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    year: targetYear,
    month: targetMonth,
  };
}

export async function getAllTimeTopPosts(params: {
  page?: number;
  pageSize?: number;
} = {}) {
  const { page = 1, pageSize = 10 } = params;

  const posts = await prisma.post.findMany({
    where: {
      topTenVotes: {
        gt: 0,
      },
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
      _count: {
        select: {
          comments: true,
          votes: true,
        },
      },
    },
    orderBy: {
      topTenVotes: 'desc',
    },
    take: pageSize,
    skip: (page - 1) * pageSize,
  });

  const total = await prisma.post.count({
    where: {
      topTenVotes: {
        gt: 0,
      },
    },
  });

  const entries: TopTenEntry[] = posts.map((post, index) => ({
    rank: (page - 1) * pageSize + index + 1,
    post,
    voteCount: post.topTenVotes,
  }));

  return {
    entries,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ============================================
// Vote Functions
// ============================================

export async function voteTopTen(userId: string, postId: string) {
  // Check if post exists
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, topTenVotes: true },
  });

  if (!post) throw new Error('帖子不存在');

  // Check if user already voted
  const existingVote = await prisma.topTenVote.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (existingVote) {
    // Remove vote
    await prisma.topTenVote.delete({
      where: { id: existingVote.id },
    });
    await prisma.post.update({
      where: { id: postId },
      data: { topTenVotes: { decrement: 1 } },
    });
    return { action: 'removed', voteCount: post.topTenVotes - 1 };
  }

  // Add vote
  await prisma.topTenVote.create({
    data: { userId, postId },
  });
  await prisma.post.update({
    where: { id: postId },
    data: { topTenVotes: { increment: 1 } },
  });

  return { action: 'added', voteCount: post.topTenVotes + 1 };
}

export async function getUserTopTenVotes(userId: string, postIds: string[]) {
  const votes = await prisma.topTenVote.findMany({
    where: {
      userId,
      postId: { in: postIds },
    },
    select: {
      postId: true,
    },
  });

  return new Set(votes.map((v) => v.postId));
}

export async function getTopTenStatus(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      topTenVotes: true,
      createdAt: true,
    },
  });

  if (!post) return null;

  // Calculate current rank in its month
  const startDate = new Date(post.createdAt.getFullYear(), post.createdAt.getMonth(), 1);
  const endDate = new Date(post.createdAt.getFullYear(), post.createdAt.getMonth() + 1, 0, 23, 59, 59);

  const rank = await prisma.post.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      topTenVotes: {
        gt: post.topTenVotes,
      },
    },
  });

  return {
    voteCount: post.topTenVotes,
    rank: rank + 1,
    month: post.createdAt.getMonth() + 1,
    year: post.createdAt.getFullYear(),
  };
}
