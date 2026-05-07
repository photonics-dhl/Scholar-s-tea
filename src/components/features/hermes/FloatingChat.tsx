'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Send, Minimize2, Trash2, User, Sparkles, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useHermesChat } from '@/hooks/useHermesChat';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { HermesAvatar } from './HermesAvatar';

const HIDDEN_PATHS = ['/admin'];
const AVATAR_SIZE = 72; // 包含 padding/blur 的总占用
const PANEL_W = 400;
const PANEL_H = 560;
const MARGIN = 12;

function shouldShowHermes(pathname: string): boolean {
  return !HIDDEN_PATHS.some((p) => pathname.startsWith(p));
}

function getSavedPosition(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem('hermes-pos-v2');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function savePosition(x: number, y: number) {
  try {
    localStorage.setItem('hermes-pos-v2', JSON.stringify({ x, y }));
  } catch { /* ignore */ }
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function getDefaultPosition() {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  return {
    x: window.innerWidth - 24 - AVATAR_SIZE,
    y: Math.round(window.innerHeight / 2 - AVATAR_SIZE / 2),
  };
}

function clampPosition(x: number, y: number) {
  if (typeof window === 'undefined') return { x, y };
  return {
    x: clamp(x, MARGIN, window.innerWidth - AVATAR_SIZE - MARGIN),
    y: clamp(y, MARGIN, window.innerHeight - AVATAR_SIZE - MARGIN),
  };
}

/** 计算面板位置，确保不被截断 */
function getPanelPosition(avatarX: number, avatarY: number) {
  if (typeof window === 'undefined') return { left: 0, top: 0 };

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 默认：面板在头像左上方（右下角对齐头像左上角，留一点间距）
  let left = avatarX - PANEL_W - MARGIN;
  let top = avatarY - PANEL_H - MARGIN;

  // 左侧空间不够 → 放到头像右侧
  if (left < MARGIN) {
    left = avatarX + AVATAR_SIZE + MARGIN;
  }

  // 上方空间不够 → 放到头像下方
  if (top < MARGIN) {
    top = avatarY + AVATAR_SIZE + MARGIN;
  }

  // 最终边界限制
  left = clamp(left, MARGIN, vw - PANEL_W - MARGIN);
  top = clamp(top, MARGIN, vh - PANEL_H - MARGIN);

  return { left, top };
}

export function FloatingChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, clearMessages } = useHermesChat();

  // ===== 拖拽状态 =====
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ sx: number; sy: number; ix: number; iy: number } | null>(null);

  // 初始化位置（避免 SSR 问题）
  useEffect(() => {
    const saved = getSavedPosition();
    if (saved) {
      setPos(clampPosition(saved.x, saved.y));
    } else {
      setPos(getDefaultPosition());
    }
    setMounted(true);

    const onResize = () => {
      setPos((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isOpen) return;

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    dragStartRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      ix: pos.x,
      iy: pos.y,
    };
    setIsDragging(true);

    // 防止拖拽时选中文本
    e.preventDefault();
  }, [isOpen, pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.sx;
    const dy = e.clientY - dragStartRef.current.sy;
    setPos(clampPosition(dragStartRef.current.ix + dx, dragStartRef.current.iy + dy));
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const dx = e.clientX - (dragStartRef.current?.sx ?? 0);
    const dy = e.clientY - (dragStartRef.current?.sy ?? 0);
    const distance = Math.sqrt(dx * dx + dy * dy);

    dragStartRef.current = null;
    savePosition(pos.x, pos.y);

    if (distance < 5) {
      setIsOpen(true);
    }
  }, [isDragging, pos]);

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

  const hermesMood = isLoading ? 'thinking' : 'idle';

  const panelPos = useMemo(() => {
    if (!mounted) return { left: 0, top: 0 };
    return getPanelPosition(pos.x, pos.y);
  }, [pos, mounted]);

  if (!pathname || !shouldShowHermes(pathname)) return null;

  return (
    <>
      {/* Avatar */}
      <div
        className="fixed z-50"
        style={{
          left: pos.x,
          top: pos.y,
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className={cn(
            'group relative flex items-center justify-center w-full h-full',
            'transition-all duration-300',
            isOpen && 'scale-0 opacity-0 pointer-events-none',
            isDragging && 'cursor-grabbing',
            !isDragging && 'cursor-grab'
          )}
          title="AI 助手 Hermes（按住拖拽）"
          role="button"
          tabIndex={0}
        >
          {/* 背景光环 */}
          <div
            className="absolute inset-0 rounded-full bg-tea-primary/20 animate-ping"
            style={{ animationDuration: '3s' }}
          />
          <div className="absolute inset-[-6px] rounded-full bg-gradient-to-br from-tea-primary/30 to-tea-mint/30 blur-sm" />

          {/* 拖拽提示条 */}
          <div
            className={cn(
              'absolute -top-3 left-1/2 -translate-x-1/2',
              'flex items-center gap-0.5 px-2 py-0.5 rounded-full',
              'bg-tea-primary/90 text-white text-[10px] shadow-sm',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'cursor-grab active:cursor-grabbing pointer-events-none'
            )}
          >
            <GripHorizontal className="w-3 h-3" />
            <span>拖拽</span>
          </div>

          <div>
            <HermesAvatar
              size={64}
              mood={hermesMood}
              className="relative z-10 drop-shadow-lg hover:drop-shadow-xl transition-shadow"
              interactive={false}
            />
          </div>

          {/* 未读提示小红点 */}
          {!isOpen && messages.length <= 1 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white animate-pulse" />
          )}

          {/* 常驻提示文字 */}
          {!isOpen && (
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
              <span className="text-[10px] bg-white/90 text-tea-primary px-2 py-0.5 rounded-full shadow-sm border border-tea-primary/20 font-medium">
                点我聊天~
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel - completely separate from avatar to avoid event interference */}
      <div
        className={cn(
          'fixed z-50',
          'w-[400px] max-w-[calc(100vw-24px)]',
          'h-[560px] max-h-[calc(100vh-24px)]',
          'bg-white rounded-2xl shadow-2xl border border-gray-200/80',
          'flex flex-col overflow-hidden',
          'transition-all duration-300 ease-out',
          isOpen
            ? 'scale-100 opacity-100'
            : 'scale-75 opacity-0 pointer-events-none'
        )}
        style={{
          left: panelPos.left,
          top: panelPos.top,
          transformOrigin: `${pos.x < panelPos.left ? 'left' : 'right'} ${pos.y < panelPos.top ? 'top' : 'bottom'}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-tea-primary to-tea-mint text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <HermesAvatar size={36} mood={hermesMood} interactive={false} />
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
                  <HermesAvatar size={28} interactive={false} />
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

          {/* Loading indicator */}
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div className="flex gap-2.5">
              <div className="flex-shrink-0">
                <HermesAvatar size={28} mood="thinking" interactive={false} />
              </div>
              <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span
                    className="w-2 h-2 bg-tea-primary/40 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-tea-primary/40 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-tea-primary/40 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
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
