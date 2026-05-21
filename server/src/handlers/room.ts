import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';

type QueryFunction = (text: string, params?: any[]) => Promise<any>;

export function registerRoomHandlers(io: Server, query: QueryFunction) {
  io.on('connection', (socket: Socket) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`User connected: ${socket.data.user.id}`);
    }

    // Track joined rooms for this socket connection
    const joinedRooms = new Set<string>();

    // Join room
    socket.on('room:join', async ({ roomId }: { roomId: string }) => {
      try {
        // Check room exists
        const roomResult = await query(
          'SELECT r.*, (SELECT COUNT(*) FROM "TeaPartyRoomParticipant" WHERE "roomId" = r.id) as participant_count FROM "TeaPartyRoom" r WHERE r.id = $1',
          [roomId]
        );

        if (roomResult.rows.length === 0) {
          socket.emit('room:error', { code: 'NOT_FOUND', message: '房间不存在' });
          return;
        }

        const room = roomResult.rows[0];

        if (parseInt(room.participant_count) >= room.maxParticipants) {
          socket.emit('room:error', { code: 'ROOM_FULL', message: '房间已满' });
          return;
        }

        // Add participant if not exists (PG 9.2 compatible)
        await query(
          `INSERT INTO "TeaPartyRoomParticipant" ("id", "roomId", "userId", "joinedAt")
           SELECT $1, $2, $3, NOW()
           WHERE NOT EXISTS (
             SELECT 1 FROM "TeaPartyRoomParticipant"
             WHERE "roomId" = $2 AND "userId" = $3
           )`,
          [randomUUID(), roomId, socket.data.user.id]
        );

        // Join socket room
        await socket.join(roomId);
        joinedRooms.add(roomId);

        // Get room details
        const roomDetail = {
          id: room.id,
          name: room.name,
          description: room.description,
          isPublic: room.isPublic,
          maxParticipants: room.maxParticipants,
          hostId: room.hostId,
          createdAt: room.createdAt,
        };

        // Get participants
        const participantsResult = await query(
          `SELECT u.id, u.name, u.avatar FROM "TeaPartyRoomParticipant" p
           JOIN "User" u ON p."userId" = u.id
           WHERE p."roomId" = $1
           LIMIT 50`,
          [roomId]
        );

        // Notify user they joined
        socket.emit('room:joined', {
          room: roomDetail,
          users: participantsResult.rows,
        });

        // Notify others
        socket.to(roomId).emit('room:user_joined', {
          user: {
            id: socket.data.user.id,
            name: socket.data.user.name,
          },
          roomId,
        });

        // Create system message
        const systemMsgResult = await query(
          `INSERT INTO "Message" ("id", "roomId", "userId", "content", "type", "createdAt")
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING *`,
          [randomUUID(), roomId, socket.data.user.id, `${socket.data.user.name || '用户'} 加入了房间`, 'SYSTEM']
        );

        // Broadcast system message
        io.to(roomId).emit('message:received', {
          message: {
            ...systemMsgResult.rows[0],
            user: {
              id: socket.data.user.id,
              name: socket.data.user.name,
              avatar: null,
            },
          },
        });
      } catch (error) {
        console.error('room:join error:', error);
        socket.emit('room:error', { code: 'SERVER_ERROR', message: '加入房间失败' });
      }
    });

    // Leave room
    socket.on('room:leave', async ({ roomId }: { roomId: string }) => {
      try {
        await socket.leave(roomId);
        joinedRooms.delete(roomId);

        // Remove participant
        await query(
          'DELETE FROM "TeaPartyRoomParticipant" WHERE "roomId" = $1 AND "userId" = $2',
          [roomId, socket.data.user.id]
        );

        // Notify others
        socket.to(roomId).emit('room:user_left', {
          userId: socket.data.user.id,
          roomId,
        });

        // Create system message
        const systemMsgResult = await query(
          `INSERT INTO "Message" ("id", "roomId", "userId", "content", "type", "createdAt")
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING *`,
          [randomUUID(), roomId, socket.data.user.id, `${socket.data.user.name || '用户'} 离开了房间`, 'SYSTEM']
        );

        // Broadcast system message
        io.to(roomId).emit('message:received', {
          message: {
            ...systemMsgResult.rows[0],
            user: {
              id: socket.data.user.id,
              name: socket.data.user.name,
              avatar: null,
            },
          },
        });
      } catch (error) {
        console.error('room:leave error:', error);
      }
    });

    // Disconnect — clean up all participant records for this socket
    socket.on('disconnect', async () => {
      const userId = socket.data.user?.id;
      if (!userId) return;

      if (process.env.LOG_LEVEL === 'debug') {
        console.log(`User disconnected: ${userId}`);
      }

      for (const roomId of joinedRooms) {
        try {
          // Remove participant
          await query(
            'DELETE FROM "TeaPartyRoomParticipant" WHERE "roomId" = $1 AND "userId" = $2',
            [roomId, userId]
          );

          // Notify others
          socket.to(roomId).emit('room:user_left', {
            userId,
            roomId,
          });

          // Create system message
          const systemMsgResult = await query(
            `INSERT INTO "Message" ("id", "roomId", "userId", "content", "type", "createdAt")
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING *`,
            [randomUUID(), roomId, userId, `${socket.data.user?.name || '用户'} 离开了房间`, 'SYSTEM']
          );

          // Broadcast system message
          io.to(roomId).emit('message:received', {
            message: {
              ...systemMsgResult.rows[0],
              user: {
                id: userId,
                name: socket.data.user?.name,
                avatar: null,
              },
            },
          });
        } catch (error) {
          console.error('disconnect cleanup error:', error);
        }
      }

      joinedRooms.clear();
    });
  });
}
