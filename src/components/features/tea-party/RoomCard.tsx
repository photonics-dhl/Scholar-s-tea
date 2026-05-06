'use client';

import { Users, MessageSquare, Lock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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
  participantCount: number;
  messageCount: number;
  createdAt: string;
}

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const isFull = room.participantCount >= room.maxParticipants;
  const occupancy = room.participantCount / room.maxParticipants;

  // 根据热度选择渐变颜色
  const heatGradient =
    occupancy > 0.7
      ? 'from-tea-accent/30 via-tea-accent/10 to-transparent'
      : occupancy > 0.3
        ? 'from-tea-primary/30 via-tea-primary/10 to-transparent'
        : 'from-convo-blue/20 via-convo-blue/5 to-transparent';

  const heatBar =
    occupancy > 0.7
      ? 'bg-tea-accent'
      : occupancy > 0.3
        ? 'bg-tea-primary'
        : 'bg-convo-blue';

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-journal-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-tea-primary/40 cursor-pointer">
      {/* Top heat gradient bar */}
      <div className={cn('h-1.5 w-full bg-gradient-to-r', heatBar)} />

      {/* Background gradient on hover */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none', heatGradient)} />

      <div className="relative p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate group-hover:text-tea-primary transition-colors">
                {room.name}
              </h3>
              {!room.isPublic && (
                <span className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded-full border">
                  <Lock className="h-3 w-3" />
                  私有
                </span>
              )}
            </div>
            {room.host && (
              <p className="text-sm text-muted-foreground mt-1">
                主持人: <span className="font-medium text-foreground">{room.host.name || '匿名用户'}</span>
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {room.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
            {room.description}
          </p>
        )}

        {/* Stats Footer */}
        <div className="flex items-center justify-between text-sm pt-3 border-t border-journal-border/50">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4 text-tea-primary" />
            <span className={cn('font-medium', isFull && 'text-destructive')}>
              {room.participantCount} / {room.maxParticipants}
            </span>
            {isFull && <span className="text-xs text-destructive font-medium">(已满)</span>}
            {!isFull && room.participantCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tea-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tea-primary" />
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-tea-accent" />
            <span className="bg-tea-accent/10 text-tea-accent font-medium px-2 py-0.5 rounded-full text-xs">
              {room.messageCount}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
