import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

// ============================================
// Types
// ============================================

export interface RoomListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isPublic?: boolean;
}

export interface CreateRoomDTO {
  name: string;
  description?: string;
  isPublic?: boolean;
  maxParticipants?: number;
  hostId: string;
}

export interface UpdateRoomDTO {
  name?: string;
  description?: string;
  isPublic?: boolean;
  maxParticipants?: number;
}

export interface MessageListParams {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

// ============================================
// Query Functions
// ============================================

export async function getTeaPartyRooms(params: RoomListParams = {}) {
  const {
    page = 1,
    pageSize = 20,
    search,
    isPublic = true,
  } = params;

  const where: Prisma.TeaPartyRoomWhereInput = { isPublic };

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get total count
  const total = await prisma.teaPartyRoom.count({ where });

  // Get rooms with relations
  const rooms = await prisma.teaPartyRoom.findMany({
    where,
    include: {
      host: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          participants: true,
          messages: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    rooms: rooms.map((r: any) => ({
      ...r,
      participantCount: r._count.participants,
      messageCount: r._count.messages,
    })),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getTeaPartyRoom(roomId: string) {
  const room = await prisma.teaPartyRoom.findUnique({
    where: { id: roomId },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        take: 50,
      },
      messages: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!room) return null;

  return {
    ...room,
    participantCount: room.participants.length,
    recentMessages: room.messages.reverse(),
  };
}

export async function createTeaPartyRoom(data: CreateRoomDTO) {
  return prisma.teaPartyRoom.create({
    data: {
      name: data.name,
      description: data.description,
      isPublic: data.isPublic ?? true,
      maxParticipants: data.maxParticipants ?? 50,
      hostId: data.hostId,
    },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
}

export async function updateTeaPartyRoom(roomId: string, data: UpdateRoomDTO) {
  return prisma.teaPartyRoom.update({
    where: { id: roomId },
    data,
    include: {
      host: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
}

export async function deleteTeaPartyRoom(roomId: string) {
  await prisma.teaPartyRoom.delete({
    where: { id: roomId },
  });
  return { success: true };
}

// ============================================
// Participant Functions
// ============================================

export async function joinRoom(roomId: string, userId: string) {
  // Check if room exists
  const room = await prisma.teaPartyRoom.findUnique({
    where: { id: roomId },
    include: { _count: { select: { participants: true } } },
  });

  if (!room) {
    throw new Error('ROOM_NOT_FOUND');
  }

  if (room._count.participants >= room.maxParticipants) {
    throw new Error('ROOM_FULL');
  }

  return prisma.teaPartyRoomParticipant.upsert({
    where: {
      roomId_userId: { roomId, userId },
    },
    create: { roomId, userId },
    update: {},
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
}

export async function leaveRoom(roomId: string, userId: string) {
  await prisma.teaPartyRoomParticipant.deleteMany({
    where: { roomId, userId },
  });
  return { success: true };
}

// ============================================
// Message Functions
// ============================================

export async function getRoomMessages(roomId: string, params: MessageListParams = {}) {
  const { cursor, limit = 50, direction = 'forward' } = params;

  const messages = await prisma.message.findMany({
    where: { roomId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: direction === 'forward' ? 'asc' : 'desc' },
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  const hasMore = messages.length > limit;
  const result = hasMore ? messages.slice(0, limit) : messages;

  // Reverse if getting backward (older messages)
  if (direction === 'backward') {
    result.reverse();
  }

  return {
    messages: result,
    meta: {
      hasMore,
      nextCursor: hasMore ? result[result.length - 1]?.id : null,
      prevCursor: hasMore ? result[0]?.id : null,
    },
  };
}

export async function createMessage(
  roomId: string,
  userId: string,
  content: string,
  type: MessageType = 'TEXT'
) {
  return prisma.message.create({
    data: { roomId, userId, content, type },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
}
