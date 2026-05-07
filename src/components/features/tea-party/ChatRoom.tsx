'use client';

import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { OnlineUsers } from './OnlineUsers';
import { TypingIndicator } from './TypingIndicator';

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  roomId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
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

interface ChatRoomProps {
  roomId: string;
  messages: Message[];
  onlineUsers: OnlineUser[];
  typingUsers: TypingUser[];
  isConnected: boolean;
  onSendMessage: (content: string, type?: string) => void;
  onTyping: (isTyping: boolean) => void;
  showUsers: boolean;
  onCloseUsers: () => void;
  currentUserId?: string;
}

export function ChatRoom({
  roomId,
  messages,
  onlineUsers,
  typingUsers,
  isConnected,
  onSendMessage,
  onTyping,
  showUsers,
  onCloseUsers,
  currentUserId,
}: ChatRoomProps) {
  return (
    <div className="flex flex-1">
      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <MessageList messages={messages} typingUsers={typingUsers} roomId={roomId} currentUserId={currentUserId} />
        <MessageInput
          onSend={onSendMessage}
          onTyping={onTyping}
          disabled={!isConnected}
        />
      </div>

      {/* Online Users Sidebar */}
      {showUsers && (
        <OnlineUsers users={onlineUsers} onClose={onCloseUsers} />
      )}
    </div>
  );
}
