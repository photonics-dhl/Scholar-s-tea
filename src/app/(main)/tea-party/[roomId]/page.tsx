'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageList } from '@/components/features/tea-party/MessageList';
import { MessageInput } from '@/components/features/tea-party/MessageInput';
import { OnlineUsers } from '@/components/features/tea-party/OnlineUsers';
import { useTeaPartySocket } from '@/hooks/useTeaPartySocket';
import { useTeaPartyMessages } from '@/hooks/useTeaPartyMessages';

interface Message {
  id: string;
  content: string;
  type: string;
  roomId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

interface Room {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  maxParticipants: number;
  hostId: string;
  host: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  participants: Array<{
    user: {
      id: string;
      name: string | null;
      avatar: string | null;
    };
    joinedAt: string;
  }>;
  recentMessages: Message[];
  participantCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export default function TeaPartyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUsers, setShowUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { socket, isConnected, isJoined, connectionError, socketError, onlineUsers, typingUsers, joinRoom: joinSocketRoom, leaveRoom: leaveSocketRoom, sendMessage, sendTyping } = useTeaPartySocket(roomId);
  const { messages, addMessage, setMessages } = useTeaPartyMessages();

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/v1/tea-party/rooms/${roomId}`);
        const data: ApiResponse<Room> = await res.json();

        if (data.success && data.data) {
          setRoom(data.data);
          setMessages(data.data.recentMessages as any);
        } else {
          setError(data.error?.message || '房间不存在');
        }
      } catch (err) {
        setError('加载房间失败');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId, setMessages]);

  // Leave room on unmount
  useEffect(() => {
    return () => {
      if (socket && isConnected) {
        leaveSocketRoom();
      }
    };
  }, [socket, isConnected]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('room:joined', ({ room: updatedRoom, users }: { room: Room; users: any[] }) => {
      setRoom(updatedRoom);
    });

    socket.on('room:user_joined', ({ user }: { user: { id: string; name: string | null; avatar: string | null } }) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              participants: [
                ...prev.participants,
                { user, joinedAt: new Date().toISOString() },
              ],
              participantCount: prev.participantCount + 1,
            }
          : prev
      );
    });

    socket.on('room:user_left', ({ userId }: { userId: string }) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              participants: prev.participants.filter((p) => p.user.id !== userId),
              participantCount: Math.max(0, prev.participantCount - 1),
            }
          : prev
      );
    });

    socket.on('message:received', ({ message }: { message: any }) => {
      addMessage(message);
    });

    return () => {
      socket.off('room:joined');
      socket.off('room:user_joined');
      socket.off('room:user_left');
      socket.off('message:received');
    };
  }, [socket, addMessage]);

  const handleSendMessage = (content: string, type?: string) => {
    if (!content.trim()) return;
    sendMessage(content, type || 'TEXT');
  };

  const handleTyping = (isTyping: boolean) => {
    sendTyping(isTyping);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="size-8 border-4 border-tea-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] px-4">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-destructive/60" />
        </div>
        <h2 className="text-xl font-semibold mb-2">连接失败</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">{connectionError}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/tea-party')}>
            返回房间列表
          </Button>
          <Button onClick={() => window.location.reload()}>
            重试连接
          </Button>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <h2 className="text-xl font-semibold mb-2">{error || '房间不存在'}</h2>
        <Button variant="outline" onClick={() => router.push('/tea-party')}>
          返回房间列表
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] -mx-4 -mt-4">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-tea-primary/[0.03] to-transparent">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/tea-party')} className="hover:bg-tea-primary/10">
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{room.name}</h1>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tea-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-tea-primary" />
                </span>
              </div>
              {room.description && (
                <p className="text-xs text-muted-foreground">{room.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUsers(!showUsers)}
              className="hover:bg-tea-primary/10"
            >
              <Users className="size-4 mr-1.5 text-tea-primary" />
              <span className="text-tea-primary font-medium">{room.participantCount}</span>
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-dot-pattern">
          {socketError && (
            <div className="mx-4 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <span className="font-medium">发送失败:</span>
              {socketError}
            </div>
          )}
          <MessageList
            messages={messages}
            typingUsers={typingUsers}
            roomId={roomId}
            currentUserId={currentUserId}
          />
        </div>

        {/* Input */}
        <div className="border-t border-tea-primary/10 p-3 bg-background">
          <MessageInput
            onSend={handleSendMessage}
            onTyping={handleTyping}
            disabled={!isConnected || !isJoined}
          />
        </div>
      </div>

      {/* Online Users Sidebar */}
      {showUsers && (
        <OnlineUsers
          users={room.participants.map((p) => p.user)}
          onClose={() => setShowUsers(false)}
        />
      )}
    </div>
  );
}
