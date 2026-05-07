'use client';

import { cn } from '@/lib/utils/cn';
import { FileText, Image, Download } from 'lucide-react';

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
  isGrouped?: boolean;
  isLastInGroup?: boolean;
}

export function MessageItem({ message, isOwn, isGrouped, isLastInGroup }: MessageItemProps) {
  const isSystem = message.type === 'SYSTEM';

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-[11px] text-muted-foreground/80 px-3 py-1 bg-muted/50 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const timeStr = new Date(message.createdAt).toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={cn(
      'flex gap-2.5 py-0.5',
      isOwn ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar - only show if not grouped or is last in group */}
      <div className={cn(
        'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium shadow-sm',
        isOwn
          ? 'bg-gradient-to-br from-tea-primary to-tea-mint text-white'
          : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white',
        isGrouped && !isLastInGroup && 'opacity-0'
      )}>
        {message.user?.name?.[0] || '?'}
      </div>

      {/* Message Content Column */}
      <div className={cn(
        'flex flex-col max-w-[70%] min-w-0',
        isOwn ? 'items-end' : 'items-start'
      )}>
        {/* User Name - only show if not grouped */}
        {!isGrouped && (
          <span className={cn(
            'text-[11px] text-muted-foreground mb-0.5',
            isOwn && 'text-right'
          )}>
            {message.user?.name || '匿名用户'}
          </span>
        )}

        {/* Message Bubble + Time Row */}
        <div className={cn(
          'flex items-end gap-1.5',
          isOwn ? 'flex-row-reverse' : 'flex-row'
        )}>
          {/* Bubble */}
          <MessageBubble message={message} isOwn={isOwn} />
          
          {/* Time - only show for last in group */}
          {isLastInGroup && (
            <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 pb-1">
              {timeStr}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn?: boolean }) {
  if (message.type === 'IMAGE') {
    return (
      <div className={cn(
        'rounded-xl overflow-hidden shadow-sm max-w-[240px] cursor-pointer',
        isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'
      )}>
        <img 
          src={message.content} 
          alt="图片" 
          className="max-w-full h-auto object-cover"
          loading="lazy"
          onClick={() => window.open(message.content, '_blank')}
        />
      </div>
    );
  }

  if (message.type === 'FILE') {
    // Parse file info: filename|url|size
    const parts = message.content.split('|');
    const fileName = parts[0] || '文件';
    const fileUrl = parts[1] || message.content;
    const fileSize = parts[2] || '';

    return (
      <div className={cn(
        'rounded-xl px-4 py-3 shadow-sm max-w-[260px] cursor-pointer group',
        isOwn 
          ? 'bg-[#95EC69] text-gray-900 rounded-tr-sm' 
          : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
      )}>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3"
        >
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            isOwn ? 'bg-green-600/10' : 'bg-gray-100'
          )}>
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{fileName}</p>
            {fileSize && <p className="text-[10px] text-muted-foreground">{fileSize}</p>}
          </div>
          <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </a>
      </div>
    );
  }

  // TEXT
  return (
    <div
      className={cn(
        'px-3.5 py-2.5 shadow-sm break-words',
        isOwn
          ? 'bg-[#95EC69] text-gray-900 rounded-2xl rounded-tr-sm'
          : 'bg-white text-gray-900 border border-gray-200/80 rounded-2xl rounded-tl-sm'
      )}
    >
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {message.content}
      </p>
    </div>
  );
}
