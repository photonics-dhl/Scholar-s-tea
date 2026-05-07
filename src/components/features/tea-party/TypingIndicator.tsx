'use client';

interface TypingUser {
  userId: string;
  userName: string | null;
  roomId: string;
  isTyping: boolean;
}

interface TypingIndicatorProps {
  users: TypingUser[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  const typingUsers = users.filter((u) => u.isTyping);

  if (typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.userName || '有人');
  let text = '';

  if (names.length === 1) {
    text = `${names[0]} 正在输入...`;
  } else if (names.length === 2) {
    text = `${names[0]} 和 ${names[1]} 正在输入...`;
  } else {
    text = `${names[0]} 等人正在输入...`;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-2">
      <div className="flex gap-1">
        <span className="size-2 rounded-full bg-tea-primary animate-typing-bounce" style={{ animationDelay: '0ms' }} />
        <span className="size-2 rounded-full bg-tea-primary animate-typing-bounce" style={{ animationDelay: '200ms' }} />
        <span className="size-2 rounded-full bg-tea-primary animate-typing-bounce" style={{ animationDelay: '400ms' }} />
      </div>
      <span className="font-sans">{text}</span>
    </div>
  );
}
