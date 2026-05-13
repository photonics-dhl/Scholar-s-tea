import { createServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from './middleware/auth.js';
import { registerRoomHandlers } from './handlers/room.js';
import { registerMessageHandlers } from './handlers/message.js';
import { query } from './db.js';

// Create HTTP server
const httpServer = createServer();

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3002', 'http://localhost:3000', 'http://10.72.212.33:3002', 'http://10.72.212.33:3005'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Authenticate socket connections
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const user = await verifyToken(token);
    if (!user) {
      return next(new Error('Invalid token'));
    }
    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Register handlers
registerRoomHandlers(io, query);
registerMessageHandlers(io, query);

// Start server
const PORT = parseInt(process.env.SOCKET_PORT || '3001', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await new Promise(resolve => setTimeout(resolve, 100));
  process.exit(0);
});
