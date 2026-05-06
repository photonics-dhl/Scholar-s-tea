'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, MessageSquare, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RoomCard } from '@/components/features/tea-party/RoomCard';
import { CreateRoomDialog } from '@/components/features/tea-party/CreateRoomDialog';

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

interface RoomsResponse {
  success: boolean;
  data: Room[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function TeaPartyPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const fetchRooms = async (searchTerm = '', pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '20',
      });
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/v1/tea-party/rooms?${params}`);
      const data: RoomsResponse = await res.json();

      if (data.success) {
        setRooms(data.data);
        setTotalPages(data.meta.totalPages);
        setTotal(data.meta.total);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRooms(search, 1);
  };

  const handleRoomCreated = (room: Room) => {
    setRooms((prev) => [room, ...prev]);
    setTotal((prev) => prev + 1);
    setShowCreate(false);
  };

  return (
    <div>
      {/* Social Page Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-tea-primary/[0.08] via-tea-bg to-tea-primary/[0.02] border-b border-journal-border/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-tea-accent/10 via-transparent to-transparent" />
        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="flex items-end justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <Coffee className="h-5 w-5 text-tea-primary" />
                <span className="text-sm font-medium text-tea-primary tracking-wide uppercase">Live Chat</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                茶话会
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                加入实时聊天室，与研究者交流思想
                <span className="mx-2 text-tea-accent">·</span>
                共 <span className="font-semibold text-tea-primary">{total}</span> 个房间
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="hidden sm:inline-flex bg-tea-primary hover:bg-tea-primary/90 text-tea-primary-foreground">
              <Plus className="size-4 mr-2" />
              创建房间
            </Button>
          </div>
        </div>
      </section>

      <div className="container py-10">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索房间..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 focus-visible:ring-tea-primary/30 focus-visible:border-tea-primary/50"
            />
          </div>
          <Button type="submit" variant="tea-outline">
            搜索
          </Button>
          <Button
            onClick={() => setShowCreate(true)}
            className="sm:hidden bg-tea-primary hover:bg-tea-primary/90 text-tea-primary-foreground"
            size="icon"
          >
            <Plus className="size-4" />
          </Button>
        </form>

        {/* Stats */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <MessageSquare className="size-4 text-tea-primary" />
          <span>共 <span className="font-medium text-foreground">{total}</span> 个房间</span>
        </div>

        {/* Room List */}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-tea-primary/10 flex items-center justify-center mx-auto mb-4">
              <Coffee className="size-8 text-tea-primary/50" />
            </div>
            <h3 className="text-xl font-medium mb-2">暂无房间</h3>
            <p className="text-muted-foreground mb-6">
              成为第一个创建茶话会房间的人
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-tea-primary hover:bg-tea-primary/90 text-tea-primary-foreground"
            >
              <Plus className="size-4 mr-2" />
              创建房间
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room, i) => (
                <Link key={room.id} href={`/tea-party/${room.id}`} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <RoomCard room={room} />
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => {
                    setPage((p) => p - 1);
                    fetchRooms(search, page - 1);
                  }}
                  className="border-journal-border/50"
                >
                  上一页
                </Button>
                <span className="px-4 py-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{page}</span> / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => {
                    setPage((p) => p + 1);
                    fetchRooms(search, page + 1);
                  }}
                  className="border-journal-border/50"
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        )}

        {/* Create Dialog */}
        <CreateRoomDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onSuccess={handleRoomCreated}
        />
      </div>
    </div>
  );
}
