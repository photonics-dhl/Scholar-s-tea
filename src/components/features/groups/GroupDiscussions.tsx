'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Eye, Pin, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge'
import { RelativeTime } from '@/components/ui/RelativeTime';

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
}

interface PostsResponse {
  success: boolean;
  data: Post[];
  meta: { total: number };
}

export function GroupDiscussions({ groupId, slug }: { groupId: string; slug: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/posts?groupId=${groupId}&pageSize=5&sort=latest`)
      .then((r) => r.json())
      .then((data: PostsResponse) => {
        if (data.success) setPosts(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupId]);



  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').slice(0, 120);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">最新讨论</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/groups/${slug}/posts`}>查看全部</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/groups/${slug}/posts/new`}>发布帖子</Link>
          </Button>
        </div>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/groups/${slug}/posts/${post.id}`}
              className="block"
            >
              <article className="rounded-lg border p-4 hover:bg-accent transition-colors">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center justify-center min-w-[48px]">
                    <span className="text-base font-semibold">{post.score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.isPinned && (
                        <Badge variant="default" className="text-[10px] h-5">
                          <Pin className="h-3 w-3 mr-1" /> 置顶
                        </Badge>
                      )}
                      {post.isLocked && (
                        <Badge variant="secondary" className="text-[10px] h-5">
                          <Lock className="h-3 w-3 mr-1" /> 锁定
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium line-clamp-1 select-text">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1 select-text">
                      {stripHtml(post.content)}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span className="select-text">{post.author.name || '匿名用户'}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post._count.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.viewCount}
                      </span>
                      <span><RelativeTime date={post.createdAt} variant="short" /></span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground self-center flex-shrink-0" />
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground border rounded-lg">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>暂无讨论</p>
          <Button variant="link" asChild className="mt-1">
            <Link href={`/groups/${slug}/posts/new`}>发起第一个讨论</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
