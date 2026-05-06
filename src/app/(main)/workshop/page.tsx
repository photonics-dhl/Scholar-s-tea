'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, User, Bot, BookOpen, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  { icon: BookOpen, text: '解释一下机器学习中的梯度下降法', action: '解释机器学习中的梯度下降法' },
  { icon: Lightbulb, text: '给我一些关于强化学习的研究方向建议', action: '给我一些关于强化学习的研究方向建议' },
  { icon: Sparkles, text: '帮我分析这篇论文的核心贡献', action: '分析这篇论文的核心贡献' },
];

export default function WorkshopPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (data.success && data.data?.content) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.content,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setError(data.error?.message || 'AI 响应失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggestion = async (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-tea-primary" />
          思想工坊
        </h1>
        <p className="mt-1 text-muted-foreground">
          与 AI 助手讨论学术问题，获取研究灵感
        </p>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden border-tea-primary/10">
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-dot-pattern">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="relative size-16 rounded-2xl bg-gradient-to-br from-tea-primary/20 to-tea-accent/20 flex items-center justify-center mb-4">
                  <Sparkles className="size-8 text-tea-primary" />
                  <div className="absolute -top-1 -right-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tea-accent opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-tea-accent" />
                    </span>
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-2">欢迎来到思想工坊</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  在这里你可以与 AI 助手讨论学术问题、获取研究灵感、分析论文内容
                </p>

                {/* Suggestions */}
                <div className="grid gap-2.5 w-full max-w-lg">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4 text-left border-tea-primary/20 hover:border-tea-primary/50 hover:bg-tea-primary/5 transition-all duration-200"
                      onClick={() => handleSuggestion(prompt.action)}
                    >
                      <prompt.icon className="h-4 w-4 mr-3 flex-shrink-0 text-tea-primary" />
                      <span className="text-sm">{prompt.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, i) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-fade-in-up ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 size-9 rounded-full flex items-center justify-center shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-tea-primary to-tea-mint text-tea-primary-foreground'
                    : 'bg-gradient-to-br from-convo-blue to-convo-blue/80 text-convo-blue-foreground'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 inline-block text-left shadow-sm transition-shadow duration-200 hover:shadow-md ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-tea-primary to-tea-mint text-tea-primary-foreground rounded-tr-md'
                      : 'bg-gradient-to-br from-convo-blue to-convo-blue/80 text-convo-blue-foreground rounded-tl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 px-1">
                    {message.timestamp.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3 animate-fade-in-up">
                <div className="size-9 rounded-full bg-gradient-to-br from-convo-blue to-convo-blue/80 flex items-center justify-center">
                  <Bot className="size-4 text-convo-blue-foreground" />
                </div>
                <div className="flex-1">
                  <div className="bg-convo-blue/10 rounded-2xl rounded-tl-md px-4 py-3 inline-block border border-convo-blue/20">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin text-convo-blue" />
                      <span>AI 思考中</span>
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-convo-blue animate-typing-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 rounded-full bg-convo-blue animate-typing-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 rounded-full bg-convo-blue animate-typing-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex gap-3 animate-fade-in-up">
                <div className="size-9 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Bot className="size-4 text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="bg-destructive/10 text-destructive rounded-2xl rounded-tl-md px-4 py-3 inline-block border border-destructive/20">
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-tea-primary/10 p-4 bg-background">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入你的问题..."
                disabled={loading}
                className="flex-1 focus-visible:ring-tea-primary/30 focus-visible:border-tea-primary/50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || loading}
                className="bg-tea-primary hover:bg-tea-primary/90 text-tea-primary-foreground transition-all duration-200"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI 助手可能会产生不准确的信息，请批判性思考
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
