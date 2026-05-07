'use client';

import { useState } from 'react';
import { RoomCard } from './RoomCard';

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

interface RoomListProps {
  rooms: Room[];
  loading?: boolean;
}

export function RoomList({ rooms, loading }: RoomListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无房间</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
