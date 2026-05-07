'use client';

import { useState } from 'react';
import { Quote, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface CiteButtonProps {
  publicationId: string;
  publicationTitle: string;
  onCited?: () => void;
}

export function CiteButton({ publicationId, publicationTitle, onCited }: CiteButtonProps) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!context.trim()) {
      setError('请填写引用说明');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // In real app, get current user from session
      const userId = 'demo-user'; // TODO: get from auth session

      const res = await fetch(`/api/v1/publications/${publicationId}/citations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citingUserId: userId, context }),
      });

      const data = await res.json();

      if (data.success) {
        setOpen(false);
        setContext('');
        onCited?.();
      } else {
        setError(data.error?.message || '引用失败');
      }
    } catch {
      setError('引用失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Quote className="mr-1 h-4 w-4" />
          引用
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>引用论文</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">{publicationTitle}</p>
          </div>
          <div>
            <label className="text-sm font-medium">引用说明</label>
            <p className="text-xs text-muted-foreground mb-2">
              描述这篇论文如何帮助了你的研究（如&quot;解决了XX问题&quot;、&quot;提供了XX方法&quot;）
            </p>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="这篇论文帮助我解决了..."
              rows={4}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认引用
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
