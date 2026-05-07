'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Send, Tag, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RichEditor } from '@/components/features/editor/RichEditor';
import { AiAssistMenu } from '@/components/features/posts/AiAssistMenu';
import { sanitizeHtml } from '@/lib/utils/sanitize';

export default function NewGroupPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const [groupName, setGroupName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/groups/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setGroupName(data.data.name);
          setGroupId(data.data.id);
        }
      })
      .catch(console.error);
  }, [slug]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()?.toString();
    setSelectedText(selection || '');
  }, []);

  const handleAiAssist = async (type: string, text: string): Promise<string> => {
    setAiLoading(true);
    try {
      const prompts: Record<string, string> = {
        improve: `请改进以下段落的学术表达，使其更加严谨、清晰、流畅：\n\n${text}`,
        grammar: `请检查以下段落的语法和用词，指出问题并给出修改建议：\n\n${text}`,
        summary: `请为以下内容生成一段 100 字左右的摘要：\n\n${text}`,
        tags: `请为以下内容推荐 3-5 个合适的学术标签（用逗号分隔）：\n\n${text}`,
      };

      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompts[type] || prompts.improve }],
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.content) {
        if (type === 'tags') {
          const newTags = data.data.content
            .split(/[,，、]/)
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0 && t.length < 20)
            .slice(0, 5);
          setTags((prev) => Array.from(new Set([...prev, ...newTags])));
        }
        return data.data.content;
      }
      return '';
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiResult = useCallback((type: string, result: string) => {
    if ((type === 'improve' || type === 'grammar') && selectedText && result) {
      // 尝试在 content 中精确替换选中的文本
      setContent((prev) => {
        // 首先尝试精确匹配
        let idx = prev.indexOf(selectedText);
        if (idx !== -1) {
          return prev.slice(0, idx) + result + prev.slice(idx + selectedText.length);
        }
        // 如果 HTML 中标签不同，尝试去除 HTML 后匹配（简单回退）
        const plainPrev = prev.replace(/<[^>]*>/g, '');
        const plainIdx = plainPrev.indexOf(selectedText);
        if (plainIdx !== -1) {
          // 在 HTML 中查找对应位置不太精确，这里回退为追加方式
          return prev + '\n\n<p><strong>AI 优化结果：</strong></p><p>' + result + '</p>';
        }
        return prev + '\n\n<p><strong>AI 优化结果：</strong></p><p>' + result + '</p>';
      });
    } else if (type === 'summary' && result) {
      setContent((prev) => {
        const summaryBlock = `<p><strong>📋 AI 摘要：</strong>${result}</p>`;
        return summaryBlock + '\n\n' + prev;
      });
    }
  }, [selectedText]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !groupId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: sanitizeHtml(content),
          tags: tags.join(','),
          groupId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/groups/${slug}/posts/${data.data.id}`);
      } else {
        alert(data.error?.message || '发布失败');
      }
    } catch {
      alert('发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = title.trim().length > 0 && content.trim().length > 10 && groupId;

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/groups/${slug}/posts`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回列表
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">发布新帖</h1>
        <p className="text-sm text-muted-foreground mt-1">
          在 {groupName || '课题组'} 分享你的研究见解
        </p>
      </div>

      <div className="mb-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题（最多 200 字）"
          maxLength={200}
          className="text-lg font-medium h-12"
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-muted-foreground">{title.length}/200</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">正文内容</span>
        <div className="flex items-center gap-2">
          {selectedText && (
            <span className="text-xs text-tea-primary bg-tea-primary/10 px-2 py-0.5 rounded-full">
              已选中 {selectedText.length} 字
            </span>
          )}
          <AiAssistMenu
            onAssist={handleAiAssist}
            onResult={handleAiResult}
            selectedText={selectedText}
          />
        </div>
      </div>

      <div onMouseUp={handleTextSelection}>
        <RichEditor
          content={content}
          onChange={setContent}
          placeholder="开始写作... 支持 Markdown 快捷输入（# 标题、- 列表、``` 代码块）"
          minHeight="300px"
        />
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">标签</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="添加标签，按回车确认"
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={handleAddTag}>添加</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <p className="text-xs text-muted-foreground">请遵守社区规范，发布有价值的学术内容</p>
        <Button onClick={handleSubmit} disabled={!isValid || submitting} className="gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? '发布中...' : '发布帖子'}
        </Button>
      </div>
    </div>
  );
}
