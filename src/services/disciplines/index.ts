import prisma from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

// ============================================
// Query Functions
// ============================================

export async function getDisciplines() {
  return prisma.discipline.findMany({
    where: { parentId: null }, // Only root disciplines
    include: {
      children: {
        include: {
          children: {
            include: {
              _count: {
                select: {
                  posts: true,
                  groups: true,
                },
              },
            },
          },
          _count: {
            select: {
              posts: true,
              groups: true,
            },
          },
        },
      },
      _count: {
        select: {
          posts: true,
          groups: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getDisciplineBySlug(slug: string) {
  return prisma.discipline.findUnique({
    where: { slug },
    include: {
      parent: {
        include: {
          parent: true,
        },
      },
      children: {
        include: {
          _count: {
            select: {
              posts: true,
              groups: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      },
      groups: {
        include: {
          group: {
            include: {
              institution: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                },
              },
              _count: {
                select: {
                  members: true,
                  publications: true,
                },
              },
            },
          },
        },
        take: 10,
        orderBy: {
          group: {
            score: 'desc',
          },
        },
      },
      _count: {
        select: {
          posts: true,
          groups: true,
        },
      },
    },
  });
}

export async function getDisciplineById(id: string) {
  return prisma.discipline.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true,
      _count: {
        select: {
          posts: true,
          groups: true,
        },
      },
    },
  });
}

// Get all disciplines as a flat list (for select component)
export async function getAllDisciplines() {
  return prisma.discipline.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      level: true,
      parentId: true,
    },
    orderBy: [
      { level: 'asc' },
      { name: 'asc' },
    ],
  });
}

// ============================================
// Create/Update Functions
// ============================================

export async function createDiscipline(data: {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
}) {
  const { name, slug, description, parentId } = data;

  // Check if slug exists
  const existing = await prisma.discipline.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new Error('学科 URL 别名已存在');
  }

  // Determine level based on parent
  let level = 0;
  if (parentId) {
    const parent = await prisma.discipline.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      throw new Error('父级学科不存在');
    }
    level = parent.level + 1;
  }

  return prisma.discipline.create({
    data: {
      name,
      slug,
      description,
      parentId,
      level,
    },
  });
}

// Get disciplines by level
export async function getDisciplinesByLevel(level: number) {
  return prisma.discipline.findMany({
    where: { level },
    orderBy: { name: 'asc' },
  });
}