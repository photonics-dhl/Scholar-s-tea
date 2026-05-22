'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Use NEXT_PUBLIC_SOCKET_URL for client-side env, fallback to window.location origin
const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port: locationPort } = window.location;
    // For localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3001`;
    }
    // For internal network (direct IP access), socket runs on port 3001
    if (hostname === '10.72.212.33') {
      return `${protocol}//${hostname}:3001`;
    }
    // For external access (ngrok, domain, etc.), assume socket is on same origin
    // or user must set NEXT_PUBLIC_SOCKET_URL env var
    if (locationPort) {
      return `${protocol}//${hostname}:${locationPort}`;
    }
    return `${protocol}//${hostname}`;
  }
  return 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

interface UseTeaPartySocketOptions {
  roomId: string;
  userId?: string;
}

interface OnlineUser {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface TypingUser {
  userId: string;
  userName: string | null;
  roomId: string;
  isTyping: boolean;
}

async function fetchSocketToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/v1/auth/socket-token', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data?.token || null : null;
  } catch (err) {
    console.error('Failed to fetch socket token:', err);
    return null;
  }
}

export function useTeaPartySocket(roomId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [socketError, setSocketError] = useState<string | null>(null);
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  useEffect(() => {
    let socket: Socket | null = null;
    let cleanup = false;

    const initSocket = async () => {
      const token = await fetchSocketToken();
      if (!token) {
        setConnectionError('请先登录以使用茶话会');
        return;
      }

      if (cleanup) return;

      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        setConnectionError(null);
        setIsJoined(false);
        // Auto-join room on connect/reconnect
        if (roomIdRef.current && socketRef.current) {
          socketRef.current.emit('room:join', { roomId: roomIdRef.current });
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setIsConnected(false);
        setIsJoined(false);
        setConnectionError(error.message || '连接失败');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        setIsJoined(false);
      });

      socket.on('message:error', (error: { code: string; message: string }) => {
        console.error('Message error:', error);
        setSocketError(error.message || '发送消息失败');
        // Auto-clear error after 5 seconds
        setTimeout(() => setSocketError(null), 5000);
      });

      socket.on('room:error', (error: { code: string; message: string }) => {
        console.error('Room error:', error);
        setConnectionError(error.message);
      });

      socket.on('room:joined', (data: { roomId: string; users: OnlineUser[] }) => {
        setOnlineUsers(data.users || []);
        setIsJoined(true);
      });

      socket.on('room:user_joined', (data: OnlineUser) => {
        setOnlineUsers((prev) => {
          if (prev.some((u) => u.id === data.id)) return prev;
          return [...prev, data];
        });
      });

      socket.on('room:user_left', (data: { userId: string }) => {
        setOnlineUsers((prev) => prev.filter((u) => u.id !== data.userId));
      });

      socket.on('user:typing', (data: TypingUser) => {
      setSocketError(null); // Clear error on any activity
        setTypingUsers((prev) => {
          const filtered = prev.filter((u) => u.userId !== data.userId);
          if (data.isTyping) {
            return [...filtered, data];
          }
          return filtered;
        });
      });
    };

    initSocket();

    return () => {
      cleanup = true;
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, []);

  const joinRoom = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('room:join', { roomId });
    }
  }, [roomId, isConnected]);

  const leaveRoom = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('room:leave', { roomId });
    }
  }, [roomId, isConnected]);

  const sendMessage = useCallback((content: string, type: string = 'TEXT') => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message:send', { roomId, content, type });
    }
  }, [roomId, isConnected]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message:typing', { roomId, isTyping });
    }
  }, [roomId, isConnected]);

  const requestHistory = useCallback((cursor?: string, limit: number = 50) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message:history', { roomId, cursor, limit });
    }
  }, [roomId, isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    isJoined,
    connectionError,
    socketError,
    onlineUsers,
    typingUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    requestHistory,
  };
}
