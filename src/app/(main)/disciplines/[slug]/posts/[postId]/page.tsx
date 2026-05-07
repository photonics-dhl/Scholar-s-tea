'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronRight,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Eye,
  Pin,
  Lock,
  Share2,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeHtml } from '@/lib/utils/sanitize';

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
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
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

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) return;

    try {
      const res = await fetch('/api/v1/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: commentContent }),
      });

      const data = await res.json();
      if (data.success) {
        setComments([...comments, { ...data.data, children: [], upvotes: 0, downvotes: 0, score: 0 }]);
        setCommentContent('');
        if (post) {
          setPost({ ...post, _count: { comments: post._count.comments + 1 } });
        }
      }
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const res = await fetch('/api/v1/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: replyContent, parentId }),
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
        setReplyContent('');
        setReplyingTo(null);
        if (post) {
          setPost({ ...post, _count: { comments: post._count.comments + 1 } });
        }
      }
    } catch (err) {
      console.error('Reply failed:', err);
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
        <div className="flex gap-6">
          {/* Vote */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleVote(1)}
              disabled={voting}
            >
              <ArrowUp className={`h-5 w-5 ${post.upvotes > 0 ? 'text-orange-500' : ''}`} />
            </Button>
            <span className="text-lg font-semibold">{post.score}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleVote(-1)}
              disabled={voting}
            >
              <ArrowDown className={`h-5 w-5 ${post.downvotes > 0 ? 'text-blue-500' : ''}`} />
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
      <section className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {post._count.comments} 条评论
        </h2>

        {/* Comment Form */}
        {!post.isLocked && (
          <div className="mb-8">
            <Textarea
              placeholder="写下你的评论..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="mb-3"
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmitComment} disabled={!commentContent.trim()}>
                发布评论
              </Button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              {/* Main Comment */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{comment.score}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{comment.author.name || '匿名用户'}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{comment.content}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  >
                    回复
                  </Button>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <Textarea
                        placeholder={`回复 @${comment.author.name || '匿名'}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <div className="flex flex-col gap-1">
                        <Button size="sm" onClick={() => handleReply(comment.id)}>
                          发布
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                          取消
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Children Comments */}
                  {comment.children.length > 0 && (
                    <div className="mt-4 ml-4 pl-4 border-l space-y-4">
                      {comment.children.map((child) => (
                        <div key={child.id} className="flex gap-3">
                          <div className="flex flex-col items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-5 w-5">
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <span className="text-xs font-medium">{child.score}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5">
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {child.author.name || '匿名用户'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(child.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm">{child.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无评论，来说点什么吧</p>
          </div>
        )}
      </section>
    </div>
  );
}
