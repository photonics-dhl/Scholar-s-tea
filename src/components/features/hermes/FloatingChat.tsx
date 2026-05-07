'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, Trash2, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useHermesChat } from '@/hooks/useHermesChat';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { HermesAvatar } from './HermesAvatar';

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, clearMessages } = useHermesChat();

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 判断当前 mood
  const hermesMood = isLoading ? 'thinking' : 'idle';

  return (
    <>
      {/* Floating Button with cute avatar */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'group flex items-center justify-center',
          'transition-all duration-300',
          isOpen && 'scale-0 opacity-0 pointer-events-none'
        )}
        title="AI 助手 Hermes"
      >
        {/* 背景光环 */}
        <div className="absolute inset-0 rounded-full bg-tea-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-tea-primary/30 to-tea-mint/30 blur-sm" />
        
        <HermesAvatar
          size={56}
          mood={hermesMood}
          className="relative z-10 drop-shadow-lg hover:drop-shadow-xl transition-shadow"
        />
        
        {/* 未读提示小红点 */}
        {!isOpen && messages.length <= 1 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'w-[400px] max-w-[calc(100vw-48px)]',
          'h-[560px] max-h-[calc(100vh-100px)]',
          'bg-white rounded-2xl shadow-2xl border border-gray-200/80',
          'flex flex-col overflow-hidden',
          'transition-all duration-300 ease-out origin-bottom-right',
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-75 opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-tea-primary to-tea-mint text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <HermesAvatar size={36} mood={hermesMood} />
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1">
                Hermes
                <Sparkles className="w-3 h-3 text-yellow-200" />
              </h3>
              <p className="text-[10px] text-white/80">
                {isLoading ? '正在思考中...' : '你的常驻 AI 助手'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
              onClick={clearMessages}
              title="清空对话"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
              title="最小化"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex gap-2.5',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Avatar */}
              {message.role === 'assistant' ? (
                <div className="flex-shrink-0">
                  <HermesAvatar size={28} />
                </div>
              ) : (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-tea-primary/10 text-tea-primary flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Bubble */}
              <div
                className={cn(
                  'max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'bg-tea-primary text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200/80 text-gray-800 rounded-tl-sm shadow-sm'
                )}
              >
                {message.role === 'assistant' ? (
                  <SimpleMarkdown content={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator with cute animation */}
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div className="flex gap-2.5">
              <div className="flex-shrink-0">
                <HermesAvatar size={28} mood="thinking" />
              </div>
              <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-tea-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-tea-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-tea-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-1 text-xs text-muted-foreground">Hermes 正在思考...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 bg-white border-t border-gray-100 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="问点什么..."
              rows={1}
              className={cn(
                'flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm',
                'focus:outline-none focus:ring-1 focus:ring-tea-primary focus:border-tea-primary',
                'min-h-[40px] max-h-[100px]'
              )}
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 100) + 'px';
              }}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="size-10 rounded-full flex-shrink-0 bg-tea-primary hover:bg-tea-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
