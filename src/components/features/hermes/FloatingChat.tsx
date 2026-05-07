'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minimize2, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useHermesChat } from '@/hooks/useHermesChat';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';

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

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'w-14 h-14 rounded-full shadow-lg',
          'bg-gradient-to-br from-tea-primary to-tea-mint',
          'text-white flex items-center justify-center',
          'hover:shadow-xl hover:scale-110 transition-all duration-300',
          'animate-fade-in-up',
          isOpen && 'scale-0 opacity-0 pointer-events-none'
        )}
        title="AI 助手 Hermes"
      >
        <Bot className="w-7 h-7" />
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'w-[380px] max-w-[calc(100vw-48px)]',
          'h-[520px] max-h-[calc(100vh-100px)]',
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
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Hermes</h3>
                <p className="text-[10px] text-white/80">常驻 AI 助手</p>
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
                <div
                  className={cn(
                    'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
                    message.role === 'user'
                      ? 'bg-tea-primary/10 text-tea-primary'
                      : 'bg-gradient-to-br from-tea-primary to-tea-mint text-white'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <Bot className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    'max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
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

            {/* Loading indicator */}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-2.5">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-tea-primary to-tea-mint flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-tea-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-tea-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-tea-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
