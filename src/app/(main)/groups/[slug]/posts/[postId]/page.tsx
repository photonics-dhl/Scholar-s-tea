'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Eye,
  Pin,
  Lock,
  Share2,
  Flag,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { cn } from '@/lib/utils/cn';
import { CommentSection } from '@/components/features/posts/CommentSection';

interface Author {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: Author;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  score: number;
  tags: { tag: { id: string; name: string } }[];
  _count: { comments: number };
}

interface CommentAuthor {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface Comment {
  id: string;
  content: string;
  author: CommentAuthor;
  isPinned: boolean;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  score: number;
  children: Comment[];
}

interface PostResponse {
  success: boolean;
  data: Post;
}

interface CommentsResponse {
  success: boolean;
  data: Comment[];
}

export default function GroupPostDetailPage() {
  const params = useParams<{ slug: string; postId: string }>();
  const slug = params.slug;
  const postId = params.postId;
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [voting, setVoting] = useState(false);
  const [userVote, setUserVote] = useState<0 | 1 | -1>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`/api/v1/posts/${postId}`),
          fetch(`/api/v1/comments?postId=${postId}`),
        ]);

        const postData: PostResponse = await postRes.json();
        const commentsData: CommentsResponse = await commentsRes.json();

        if (postData.success) {
          setPost(postData.data);
        } else {
          router.push(`/groups/${slug}/posts`);
        }

        if (commentsData.success) {
          setComments(commentsData.data);
        }
      } catch (err) {
        console.error('Failed to fetch post:', err);
        router.push(`/groups/${slug}/posts`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId, slug, router]);

  const handleVote = async (value: 1 | -1) => {
    if (voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/v1/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (data.success && post) {
        const prevVote = userVote;
        const newVote = data.data.value as 0 | 1 | -1;
        setUserVote(newVote);
        setPost({
          ...post,
          score: data.data.value === 0
            ? post.score - value
            : data.data.value === value
              ? post.score + value
              : post.score + value * 2,
          upvotes: newVote === 1
            ? prevVote === 1 ? post.upvotes : post.upvotes + 1
            : prevVote === 1 ? post.upvotes - 1 : post.upvotes,
          downvotes: newVote === -1
            ? prevVote === -1 ? post.downvotes : post.downvotes + 1
            : prevVote === -1 ? post.downvotes - 1 : post.downvotes,
        });
      }
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setVoting(false);
    }
  };

  const handleSubmitComment = async (content: string) => {
    const res = await fetch('/api/v1/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, content }),
    });
    const data = await res.json();
    if (data.success) {
      setComments([...comments, { ...data.data, children: [], upvotes: 0, downvotes: 0, score: 0 }]);
      if (post) {
        setPost({ ...post, _count: { comments: post._count.comments + 1 } });
      }
    }
  };

  const handleSubmitReply = async (parentId: string, content: string) => {
    const res = await fetch('/api/v1/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, content, parentId }),
    });
    const data = await res.json();
    if (data.success) {
      setComments(comments.map((c) => {
        if (c.id === parentId) {
          return { ...c, children: [...c.children, { ...data.data, children: [], upvotes: 0, downvotes: 0, score: 0 }] };
        }
        return c;
      }));
      if (post) {
        setPost({ ...post, _count: { comments: post._count.comments + 1 } });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatRelative = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Skeleton className="h-4 w-96 mb-4" />
        <Skeleton className="h-10 w-full mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
        <Link href="/groups" className="hover:text-foreground transition-colors">课题组</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/groups/${slug}`} className="hover:text-foreground transition-colors">{post.author.name || '课题组'}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/groups/${slug}/posts`} className="hover:text-foreground transition-colors">讨论</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
      </nav>

      {/* Post Card */}
      <article className="rounded-xl border bg-card shadow-sm mb-6">
        {/* Post Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.isPinned && (
              <Badge className="bg-tea-accent hover:bg-tea-accent text-white">
                <Pin className="h-3 w-3 mr-1" /> 置顶
              </Badge>
            )}
            {post.isLocked && (
              <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" /> 锁定</Badge>
            )}
            {post.tags.map(({ tag }) => (
              <Badge key={tag.id} variant="outline" className="font-normal">
                {tag.name}
              </Badge>
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-4 leading-snug">{post.title}</h1>

          {/* Author Bar */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-tea-primary/10 text-tea-primary">
                {post.author.name?.slice(0, 2) || '匿名'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{post.author.name || '匿名用户'}</span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(post.createdAt)}</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.viewCount} 浏览</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Vote & Content */}
        <div className="flex gap-0">
          {/* 左侧投票区 - 弱化设计 */}
          <div className="flex flex-col items-center gap-0.5 px-3 py-5 min-w-[52px]">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 rounded-md transition-colors',
                userVote === 1
                  ? 'text-tea-primary'
                  : 'text-gray-300 hover:text-gray-400'
              )}
              onClick={() => handleVote(1)}
              disabled={voting}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className={cn(
              'text-sm font-medium tabular-nums text-muted-foreground/70',
            )}>
              {post.score}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 rounded-md transition-colors',
                userVote === -1
                  ? 'text-blue-400'
                  : 'text-gray-300 hover:text-gray-400'
              )}
              onClick={() => handleVote(-1)}
              disabled={voting}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 p-6 pl-3">
            <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-tea-primary prose-a:no-underline hover:prose-a:underline">
              <div
                className="prose-content"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
              <Share2 className="h-4 w-4" /> 分享
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-1.5">
            <Flag className="h-4 w-4" /> 举报
          </Button>
        </div>
      </article>

      {/* Comments Section */}
      <div className="rounded-xl border bg-card shadow-sm p-6">
        <CommentSection
          comments={comments}
          postAuthorId={post.author.id}
          commentCount={post._count.comments}
          isLocked={post.isLocked}
          onSubmitComment={handleSubmitComment}
          onSubmitReply={handleSubmitReply}
        />
      </div>
    </div>
  );
}
