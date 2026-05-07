'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnlineUser {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface OnlineUsersProps {
  users: OnlineUser[];
  onClose: () => void;
}

export function OnlineUsers({ users, onClose }: OnlineUsersProps) {
  return (
    <div className="w-64 border-l bg-card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-medium">在线用户 ({users.length})</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-4">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            暂无在线用户
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {user.name?.[0] || '?'}
                </div>
                <span className="text-sm truncate">
                  {user.name || '匿名用户'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
