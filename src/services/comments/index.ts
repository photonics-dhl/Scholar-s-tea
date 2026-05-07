import prisma from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

// ============================================
// Types
// ============================================

export type CommentWithDetails = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        name: true;
        avatar: true;
      };
    };
    _count: {
      select: {
        votes: true;
        children: true;
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

// ============================================
// Query Functions
// ============================================

export async function getCommentsByPostId(postId: string, params: {
  page?: number;
  pageSize?: number;
} = {}) {
  const { page = 1, pageSize = 50 } = params;

  // Get top-level comments (no parent)
  const where = {
    postId,
    parentId: null,
  };

  const [total, comments] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        children: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                votes: true,
                children: true,
              },
            },
            votes: {
              select: {
                userId: true,
                value: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            votes: true,
            children: true,
          },
        },
        votes: {
          select: {
            userId: true,
            value: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'asc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Calculate vote stats for comments and their children
  const commentsWithStats = comments.map((comment) => {
    const upvotes = comment.votes.filter((v) => v.value === 1).length;
    const downvotes = comment.votes.filter((v) => v.value === -1).length;
    const { votes: _, ...rest } = comment;

    const childrenWithStats = comment.children.map((child) => {
      const childUpvotes = child.votes.filter((v) => v.value === 1).length;
      const childDownvotes = child.votes.filter((v) => v.value === -1).length;
      const { votes: childVotes, ...childRest } = child;
      return {
        ...childRest,
        upvotes: childUpvotes,
        downvotes: childDownvotes,
        score: childUpvotes - childDownvotes,
      };
    });

    return {
      ...rest,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      children: childrenWithStats,
    };
  });

  return {
    comments: commentsWithStats,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ============================================
// Create/Update/Delete Functions
// ============================================

export async function createComment(authorId: string, postId: string, data: {
  content: string;
  parentId?: string;
}) {
  const { content, parentId } = data;

  // Verify post exists
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, isLocked: true },
  });

  if (!post) throw new Error('帖子不存在');
  if (post.isLocked) throw new Error('帖子已锁定，无法评论');

  // If parentId provided, verify parent comment exists
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, parentId: true },
    });
    if (!parent) throw new Error('父评论不存在');
    // Only allow 2 levels of nesting
    if (parent.parentId) throw new Error('回复层级不能超过两层');
  }

  return prisma.comment.create({
    data: {
      content,
      authorId,
      postId,
      parentId,
    },
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

export async function updateComment(id: string, authorId: string, content: string) {
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!comment) throw new Error('评论不存在');
  if (comment.authorId !== authorId) throw new Error('无权限修改');

  return prisma.comment.update({
    where: { id },
    data: { content },
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

export async function deleteComment(id: string, authorId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!comment) throw new Error('评论不存在');
  if (comment.authorId !== authorId) throw new Error('无权限删除');

  await prisma.comment.delete({ where: { id } });
  return { success: true };
}

// ============================================
// Vote Functions
// ============================================

export async function voteComment(userId: string, commentId: string, value: 1 | -1) {
  const existing = await prisma.vote.findUnique({
    where: {
      userId_commentId: { userId, commentId },
    },
  });

  if (existing) {
    if (existing.value === value) {
      await prisma.vote.delete({ where: { id: existing.id } });
      return { action: 'removed', value: 0 };
    } else {
      const updated = await prisma.vote.update({
        where: { id: existing.id },
        data: { value },
      });
      return { action: 'updated', value: updated.value };
    }
  }

  const vote = await prisma.vote.create({
    data: { userId, commentId, value },
  });
  return { action: 'created', value: vote.value };
}
