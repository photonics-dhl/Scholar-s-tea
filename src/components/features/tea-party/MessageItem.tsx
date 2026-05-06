'use client';

import { cn } from '@/lib/utils/cn';

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

interface MessageItemProps {
  message: Message;
  isOwn?: boolean;
}

export function MessageItem({ message, isOwn }: MessageItemProps) {
  const isSystem = message.type === 'SYSTEM';

  if (isSystem) {
    return (
      <div className="flex justify-center animate-fade-in-up">
        <span className="text-xs text-muted-foreground px-4 py-1.5 bg-tea-bg rounded-full border border-journal-border/50">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-3 animate-fade-in-up', isOwn ? 'flex-row-reverse' : '')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 size-9 rounded-full flex items-center justify-center text-sm font-medium shadow-sm transition-transform duration-200 hover:scale-110',
          isOwn
            ? 'bg-gradient-to-br from-tea-primary to-tea-mint text-tea-primary-foreground'
            : 'bg-gradient-to-br from-journal-primary to-journal-primary/80 text-journal-primary-foreground'
        )}
      >
        {message.user?.name?.[0] || '?'}
      </div>

      {/* Message Bubble */}
      <div className={cn('flex flex-col max-w-[78%]', isOwn ? 'items-end' : 'items-start')}>
        {/* User Name & Time */}
        <div className={cn('flex items-center gap-2 mb-1.5 text-xs text-muted-foreground', isOwn ? 'flex-row-reverse' : '')}>
          <span className="font-medium font-sans">{message.user?.name || '匿名用户'}</span>
          <span className="font-sans opacity-70">{new Date(message.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Message Content */}
        <div
          className={cn(
            'px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md',
            isOwn
              ? 'bg-gradient-to-br from-tea-primary to-tea-mint text-tea-primary-foreground rounded-2xl rounded-tr-sm'
              : 'bg-gradient-to-br from-paper-white to-cool-gray text-foreground border border-journal-border/60 rounded-2xl rounded-tl-sm'
          )}
        >
          <p className={cn('text-sm whitespace-pre-wrap break-words leading-relaxed', isOwn ? 'font-sans' : 'font-source-serif')}>
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}
