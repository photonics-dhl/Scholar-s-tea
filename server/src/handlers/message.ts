import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';

type QueryFunction = (text: string, params?: any[]) => Promise<any>;

export function registerMessageHandlers(io: Server, query: QueryFunction) {
  io.on('connection', (socket: Socket) => {
    // Send message
    socket.on('message:send', async ({ roomId, content, type = 'TEXT' }: { roomId: string; content: string; type?: string }) => {
      try {
        // Verify user is in the room
        const participantResult = await query(
          'SELECT 1 FROM "TeaPartyRoomParticipant" WHERE "roomId" = $1 AND "userId" = $2',
          [roomId, socket.data.user.id]
        );

        if (participantResult.rows.length === 0) {
          socket.emit('message:error', { code: 'NOT_IN_ROOM', message: '请先加入房间' });
          return;
        }

        // Create message
        const messageResult = await query(
          `INSERT INTO "Message" ("id", "roomId", "userId", "content", "type", "createdAt")
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING *`,
          [randomUUID(), roomId, socket.data.user.id, content, type]
        );

        const message = messageResult.rows[0];

        // Broadcast to room
        io.to(roomId).emit('message:received', {
          message: {
            ...message,
            user: {
              id: socket.data.user.id,
              name: socket.data.user.name,
              avatar: null,
            },
          },
        });
      } catch (error) {
        console.error('message:send error:', error);
        socket.emit('message:error', { code: 'SERVER_ERROR', message: '发送消息失败' });
      }
    });

    // Get message history
    socket.on('message:history', async ({ roomId, cursor, limit = 50 }: { roomId: string; cursor?: string; limit?: number }) => {
      try {
        let queryText: string;
        let queryParams: any[];

        if (cursor) {
          queryText = `SELECT m.*, u.id as user_id, u.name as user_name, u.avatar as user_avatar
           FROM "Message" m
           JOIN "User" u ON m."userId" = u.id
           WHERE m."roomId" = $1 AND m.id < $2
           ORDER BY m."createdAt" DESC
           LIMIT $3`;
          queryParams = [roomId, cursor, limit + 1];
        } else {
          queryText = `SELECT m.*, u.id as user_id, u.name as user_name, u.avatar as user_avatar
           FROM "Message" m
           JOIN "User" u ON m."userId" = u.id
           WHERE m."roomId" = $1
           ORDER BY m."createdAt" DESC
           LIMIT $2`;
          queryParams = [roomId, limit + 1];
        }

        const messagesResult = await query(queryText, queryParams);

        const hasMore = messagesResult.rows.length > limit;
        const messages = hasMore ? messagesResult.rows.slice(0, limit) : messagesResult.rows;

        // Reverse to get oldest first
        messages.reverse();

        socket.emit('message:history', {
          messages: messages.map((m: any) => ({
            ...m,
            user: {
              id: m.user_id,
              name: m.user_name,
              avatar: m.user_avatar,
            },
          })),
          hasMore,
          nextCursor: hasMore ? messages[messages.length - 1]?.id : null,
        });
      } catch (error) {
        console.error('message:history error:', error);
        socket.emit('message:error', { code: 'SERVER_ERROR', message: '获取消息历史失败' });
      }
    });

    // Typing indicator
    socket.on('message:typing', ({ roomId, isTyping }: { roomId: string; isTyping: boolean }) => {
      socket.to(roomId).emit('user:typing', {
        userId: socket.data.user.id,
        userName: socket.data.user.name,
        roomId,
        isTyping,
      });
    });
  });
}
