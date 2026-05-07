'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MessageSquare,
  ChevronRight,
  Pin,
  Flame,
  Clock,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PostCard } from '@/components/features/posts/PostCard';

interface Post {
  id: string;
  title: string;
  content: string;
  author: { id: string; name: string | null; avatar: string | null };
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  score: number;
  _count: { comments: number };
  tags?: { tag: { id: string; name: string } }[];
}

interface PostsResponse {
  success: boolean;
  data: Post[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface GroupInfo {
  id: string;
  name: string;
  slug: string;
}

interface GroupResponse {
  success: boolean;
  data: GroupInfo;
}

export default function GroupPostsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [posts, setPosts] = useState<Post[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<'latest' | 'hot' | 'pinned'>('latest');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const groupRes = await fetch(`/api/v1/groups/${slug}`);
        const groupData: GroupResponse = await groupRes.json();
        if (groupData.success) {
          setGroupName(groupData.data.name);
          setGroupId(groupData.data.id);

          const postsRes = await fetch(
            `/api/v1/posts?groupId=${groupData.data.id}&page=${page}&sort=${sort}`
          );
          const postsData: PostsResponse = await postsRes.json();
          if (postsData.success) {
            setPosts(postsData.data);
            setTotalPages(postsData.meta.totalPages);
          }
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, page, sort]);

  const handleVote = async (postId: string, value: 1 | -1) => {
    try {
      const res = await fetch(`/api/v1/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  score: data.data.value === 0
                    ? p.score - value
                    : data.data.value === value
                      ? p.score + value
                      : p.score + value * 2,
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // 分离置顶帖和普通帖
  const pinnedPosts = posts.filter((p) => p.isPinned);
  const normalPosts = posts.filter((p) => !p.isPinned);

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <Link href="/groups" className="hover:text-foreground transition-colors">课题组</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/groups/${slug}`} className="hover:text-foreground transition-colors">{groupName}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">讨论区</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{groupName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            共 {posts.length} 个讨论 · 分享研究见解
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sort} onValueChange={(value: 'latest' | 'hot' | 'pinned') => { setSort(value); setPage(1); }}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">
                <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> 最新</span>
              </SelectItem>
              <SelectItem value="hot">
                <span className="flex items-center gap-2"><Flame className="h-3.5 w-3.5" /> 最热</span>
              </SelectItem>
              <SelectItem value="pinned">
                <span className="flex items-center gap-2"><Pin className="h-3.5 w-3.5" /> 精华</span>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button asChild size="sm" className="gap-1.5">
            <Link href={`/groups/${slug}/posts/new`}>
              <Plus className="h-4 w-4" />
              发布帖子
            </Link>
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Posts List */}
          {posts.length > 0 ? (
            <div className="space-y-3">
              {/* 置顶帖 */}
              {pinnedPosts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Pin className="h-3.5 w-3.5 text-tea-accent" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      置顶
                    </span>
                  </div>
                  {pinnedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      href={`/groups/${slug}/posts/${post.id}`}
                      onVote={handleVote}
                    />
                  ))}
                </div>
              )}

              {/* 普通帖 */}
              {normalPosts.length > 0 && (
                <div className="space-y-3">
                  {pinnedPosts.length > 0 && (
                    <div className="flex items-center gap-2 px-1 pt-2">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        全部讨论
                      </span>
                    </div>
                  )}
                  {normalPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      href={`/groups/${slug}/posts/${post.id}`}
                      onVote={handleVote}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground border rounded-xl bg-muted/20">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-base font-medium">暂无帖子</p>
              <p className="text-sm mt-1">成为第一个发起讨论的人吧</p>
              <Button asChild className="mt-4 gap-1.5">
                <Link href={`/groups/${slug}/posts/new`}>
                  <Plus className="h-4 w-4" />
                  发布帖子
                </Link>
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground bg-muted/30 rounded-md">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
