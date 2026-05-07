'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Eye,
  Pin,
  Lock,
  Share2,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { CommentSection } from '@/components/features/posts/CommentSection';

interface Author {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface Discipline {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: Author;
  discipline: Discipline | null;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  score: number;
  tags: { tag: Tag }[];
  _count: {
    comments: number;
  };
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

interface PageProps {
  params: Promise<{ slug: string; postId: string }>;
}

export default function PostDetailPage() {
  const params = useParams<{ slug: string; postId: string }>();
  const slug = params.slug;
  const postId = params.postId;
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

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
          router.push(`/disciplines/${slug}/posts`);
        }

        if (commentsData.success) {
          setComments(commentsData.data);
        }
      } catch (err) {
        console.error('Failed to fetch post:', err);
        router.push(`/disciplines/${slug}/posts`);
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
        setPost({
          ...post,
          score: data.data.value === 0
            ? post.score - value
            : data.data.value === value
              ? post.score + value
              : post.score + (value * 2),
          upvotes: data.data.value === 1 || (data.data.value === 0 && value === 1)
            ? post.upvotes - (data.data.action === 'removed' ? 1 : 0)
            : data.data.value === 1
              ? post.upvotes + 1
              : post.upvotes,
          downvotes: data.data.value === -1 || (data.data.value === 0 && value === -1)
            ? post.downvotes - (data.data.action === 'removed' ? 1 : 0)
            : data.data.value === -1
              ? post.downvotes + 1
              : post.downvotes,
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
      setComments(comments.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            children: [...c.children, { ...data.data, children: [], upvotes: 0, downvotes: 0, score: 0 }],
          };
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-4 w-96 mb-4" />
        <Skeleton className="h-8 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/disciplines" className="hover:text-foreground">学科社区</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/disciplines/${slug}`} className="hover:text-foreground">
          {post.discipline?.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/disciplines/${slug}/posts`} className="hover:text-foreground">帖子</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
      </nav>

      {/* Post Header */}
      <article className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {post.isPinned && <Badge><Pin className="h-3 w-3 mr-1" /> 置顶</Badge>}
          {post.isLocked && <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" /> 锁定</Badge>}
          {post.tags.map(({ tag }) => (
            <Badge key={tag.id} variant="outline">{tag.name}</Badge>
          ))}
        </div>

        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span>{post.author.name || '匿名用户'}</span>
          <span>{formatDate(post.createdAt)}</span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" /> {post.viewCount}
          </span>
        </div>

        {/* Vote & Content */}
        <div className="flex gap-4">
          {/* Vote - 弱化设计 */}
          <div className="flex flex-col items-center gap-0.5 min-w-[36px]">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-300 hover:text-gray-400"
              onClick={() => handleVote(1)}
              disabled={voting}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground/70">{post.score}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-300 hover:text-gray-400"
              onClick={() => handleVote(-1)}
              disabled={voting}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 prose prose-sm max-w-none">
            <div
              className="prose-content"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(post.content),
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4 mr-1" /> 分享
            </Button>
          </div>
          <Button variant="ghost" size="sm">
            <Flag className="h-4 w-4 mr-1" /> 举报
          </Button>
        </div>
      </article>

      {/* Comments Section */}
      <CommentSection
        comments={comments}
        postAuthorId={post.author.id}
        commentCount={post._count.comments}
        isLocked={post.isLocked}
        onSubmitComment={handleSubmitComment}
        onSubmitReply={handleSubmitReply}
      />
    </div>
  );
}
