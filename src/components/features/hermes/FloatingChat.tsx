'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Send, Minimize2, Trash2, User, Sparkles, GripHorizontal, Shield, MessageCircle, ChevronDown, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useSession } from 'next-auth/react';
import { useHermesChat, type HermesPersonality, compressImageToBase64 } from '@/hooks/useHermesChat';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { HermesAvatar, type HermesMood, type AvatarCommand } from './HermesAvatar';
import { HermesRadialMenu, type RadialAction } from './HermesRadialMenu';

const HIDDEN_PATHS = ['/admin', '/profile', '/settings'];
const AVATAR_SIZE = 96;
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
    x: window.innerWidth - MARGIN - AVATAR_SIZE,
    y: window.innerHeight - MARGIN - AVATAR_SIZE - 80, // bottom-right to avoid UI overlap
  };
}

function clampPosition(x: number, y: number) {
  if (typeof window === 'undefined') return { x, y };
  return {
    x: clamp(x, MARGIN, Math.max(MARGIN, window.innerWidth - AVATAR_SIZE - MARGIN)),
    y: clamp(y, MARGIN, Math.max(MARGIN, window.innerHeight - AVATAR_SIZE - MARGIN)),
  };
}

/** 智能计算面板位置 — 始终紧贴 avatar 的最近可用空间 */
function getPanelPosition(avatarX: number, avatarY: number) {
  if (typeof window === 'undefined')
    return { left: 0, top: 0, originX: 'center' as const, originY: 'center' as const };

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const effW = Math.min(PANEL_W, vw - 2 * MARGIN);
  const effH = Math.min(PANEL_H, vh - 2 * MARGIN);

  const spaceRight = vw - avatarX - AVATAR_SIZE - MARGIN;
  const spaceLeft = avatarX - MARGIN;
  const spaceBelow = vh - avatarY - AVATAR_SIZE - MARGIN;
  const spaceAbove = avatarY - MARGIN;

  let left: number;
  let top: number;
  let originX: 'left' | 'right' | 'center';
  let originY: 'top' | 'bottom' | 'center';

  if (spaceRight >= effW && spaceRight >= spaceLeft) {
    left = avatarX + AVATAR_SIZE + MARGIN;
    originX = 'left';
  } else if (spaceLeft >= effW) {
    left = avatarX - effW - MARGIN;
    originX = 'right';
  } else if (spaceRight >= spaceLeft) {
    left = Math.max(MARGIN, vw - effW - MARGIN);
    originX = 'right';
  } else {
    left = MARGIN;
    originX = 'left';
  }

  if (spaceBelow >= effH) {
    top = avatarY;
    originY = 'top';
  } else if (spaceAbove >= effH) {
    top = avatarY + AVATAR_SIZE - effH;
    originY = 'bottom';
  } else {
    top = avatarY + Math.round(AVATAR_SIZE / 2) - Math.round(effH / 2);
    originY = 'center';
  }

  top = clamp(top, MARGIN, Math.max(MARGIN, vh - effH - MARGIN));
  left = clamp(left, MARGIN, Math.max(MARGIN, vw - effW - MARGIN));

  return { left, top, originX, originY };
}

/** 安慰话语库 — 给用户带来一天的好心情 */
const COMFORT_MESSAGES: Record<RadialAction, string[]> = {
  encourage: [
    '今天的你已经很棒了，剩下的交给明天~ ✨',
    '不管遇到什么困难，记得我永远支持你！',
    '深呼吸，一切都会好起来的 🌈',
    '你是独一无二的，不要和别人比较~',
    '今天的辛苦是为了明天的绽放，加油！💪',
    '失败只是成功在调皮，再试一次吧！',
    '你的努力我都看在眼里，真的很厉害！',
    '别担心，有我在呢~ 🍵',
  ],
  rest: [
    '累了就休息一下吧，身体最重要~ 🌙',
    '闭上眼睛，想象一片宁静的茶园...',
    '休息不是偷懒，是为了更好地出发~',
    '来杯热茶，放松一下心情吧 🍵',
    '你的大脑也需要喝杯茶歇歇脚~',
  ],
  dance: [
    '啦啦啦~ 跟着音乐摇摆起来！🎵',
    '跳舞是灵魂在微笑~',
    '今天的心情是舞曲节奏的！',
    '旋转跳跃我闭着眼~ ✨',
  ],
  greet: [
    '嗨~ 很高兴见到你！👋',
    '又是美好的一天呢！',
    '见到你我就开心起来了~',
    '来，击个掌！✋',
  ],
  love: [
    '最喜欢你了！❤️',
    '你对我真好~ 谢谢你！',
    '有你在的世界真好~',
    '我要给你一个大大的拥抱！🤗',
  ],
  study: [
    '格物致知，学无止境！📚',
    '书中自有黄金屋，书中自有颜如玉~',
    '今天的学习目标，完成了吗？',
    '知识改变命运，学习成就未来！',
  ],
  insight: [
    '洞察先机，明察秋毫！🔍',
    '我发现了一个有趣的规律~',
    '换个角度看问题，会有新发现！',
    '这就是学术的魅力所在~',
  ],
  confused: [
    '这个问题有点难呢...🤔',
    'AI 也有不懂的时候呀~',
    '让我们一起研究研究？',
    '不懂就问，不丢人！',
  ],
  tea: [
    '茶会恭候，随时欢迎！🍵',
    '来杯龙井提提神？',
    '茶香四溢，思绪万千~',
    '喝茶聊天，人生一大乐事~',
  ],
  inspired: [
    '灵感爆棚！💡',
    '我想到一个好主意！',
    '创造力如泉涌~',
    '智慧的火花在闪耀！',
  ],
  debate: [
    '学术辩论，理越辩越明！📖',
    '让我们来一场思想的碰撞~',
    '不同的观点才能激发创新！',
    '真理越辩越明~',
  ],
  eureka: [
    '原来如此！恍然大悟！✨',
    '这就是答案！太棒了！',
    '知识的拼图又完整了一块~',
    '成就感满满！',
  ],
  tea_sip: [
    '茶润学识，口齿留香~ 🍵',
    '好茶配好知识，人生美满~',
    '品味茶香，沉淀思绪...',
    '一杯好茶，一段好时光~',
  ],
  random: [],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function FloatingChat() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, toolStatus, mode, setMode, personality, setPersonality, sendMessage, clearMessages } = useHermesChat();

  // ===== 拖拽状态 =====
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const posRef = useRef(pos);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ sx: number; sy: number; ix: number; iy: number } | null>(null);
  const dragTargetRef = useRef<HTMLElement | null>(null);

  // ===== 动作菜单状态（双击唤起） =====
  const [radialOpen, setRadialOpen] = useState(false);
  const [avatarCommand, setAvatarCommand] = useState<AvatarCommand | undefined>(undefined);
  const lastClickTimeRef = useRef<number>(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 同步 ref 避免闭包问题
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // 初始化位置
  useEffect(() => {
    const saved = getSavedPosition();
    if (saved) {
      const clamped = clampPosition(saved.x, saved.y);
      setPos(clamped);
      posRef.current = clamped;
    } else {
      const def = getDefaultPosition();
      setPos(def);
      posRef.current = def;
    }
    setMounted(true);

    const onResize = () => {
      setPos((prev) => {
        const next = clampPosition(prev.x, prev.y);
        posRef.current = next;
        return next;
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isOpen) return;

    const target = e.currentTarget as HTMLElement;
    dragTargetRef.current = target;
    target.setPointerCapture(e.pointerId);

    dragStartRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      ix: posRef.current.x,
      iy: posRef.current.y,
    };
    setIsDragging(true);

    e.preventDefault();
  }, [isOpen]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.sx;
    const dy = e.clientY - dragStartRef.current.sy;
    const next = clampPosition(dragStartRef.current.ix + dx, dragStartRef.current.iy + dy);
    setPos(next);
    posRef.current = next;
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragTargetRef.current) {
      try {
        dragTargetRef.current.releasePointerCapture(e.pointerId);
      } catch { /* 可能已自动释放 */ }
      dragTargetRef.current = null;
    }

    const dx = e.clientX - (dragStartRef.current?.sx ?? 0);
    const dy = e.clientY - (dragStartRef.current?.sy ?? 0);
    const distance = Math.sqrt(dx * dx + dy * dy);

    dragStartRef.current = null;
    savePosition(posRef.current.x, posRef.current.y);

    if (distance < 5) {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;

      if (timeSinceLastClick < 300) {
        // 双击：打开动作菜单
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }
        lastClickTimeRef.current = 0;
        setRadialOpen(true);
      } else {
        // 单击：延迟打开聊天面板，等待可能的第二次点击
        lastClickTimeRef.current = now;
        clickTimerRef.current = setTimeout(() => {
          setIsOpen(true);
          lastClickTimeRef.current = 0;
          clickTimerRef.current = null;
        }, 250);
      }
    }
  }, [isDragging]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragTargetRef.current) {
      try {
        dragTargetRef.current.releasePointerCapture(e.pointerId);
      } catch { /* ignore */ }
      dragTargetRef.current = null;
    }

    dragStartRef.current = null;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      lastClickTimeRef.current = 0;
    }
    const saved = getSavedPosition();
    if (saved) {
      const clamped = clampPosition(saved.x, saved.y);
      setPos(clamped);
      posRef.current = clamped;
    }
  }, [isDragging]);

  // ===== 右键菜单处理（保留作为备选） =====
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isOpen || isDragging) return;
    // 取消可能待处理的单击
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    lastClickTimeRef.current = 0;
    setRadialOpen(true);
  }, [isOpen, isDragging]);

  const handleRadialClose = useCallback(() => {
    setRadialOpen(false);
  }, []);

  const handleRadialSelect = useCallback((action: RadialAction) => {
    const comfortMessages = COMFORT_MESSAGES[action];
    const bubble = comfortMessages.length > 0 ? pickRandom(comfortMessages) : undefined;

    switch (action) {
      case 'encourage':
        setAvatarCommand({ action: 'happy', bubble });
        break;
      case 'rest':
        setAvatarCommand({ action: 'sleep', bubble });
        break;
      case 'dance':
        setAvatarCommand({ action: 'dance', bubble });
        break;
      case 'greet':
        setAvatarCommand({ action: 'wave', bubble });
        break;
      case 'love':
        setAvatarCommand({ action: 'love', bubble });
        break;
      case 'study':
        setAvatarCommand({ action: 'study', bubble });
        break;
      case 'insight':
        setAvatarCommand({ action: 'insight', bubble });
        break;
      case 'confused':
        setAvatarCommand({ action: 'confused', bubble });
        break;
      case 'tea':
        setAvatarCommand({ action: 'tea', bubble });
        break;
      case 'inspired':
        setAvatarCommand({ action: 'inspired', bubble });
        break;
      case 'debate':
        setAvatarCommand({ action: 'debate', bubble });
        break;
      case 'eureka':
        setAvatarCommand({ action: 'eureka', bubble });
        break;
      case 'tea_sip':
        setAvatarCommand({ action: 'tea_sip', bubble });
        break;
      case 'random':
        setAvatarCommand({ action: 'random' });
        break;
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if ((!input.trim() && !imageData) || isLoading) return;
    sendMessage(input.trim(), imageData || undefined);
    setInput('');
    setImageData(null);
  };

  const handleImageSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const base64 = await compressImageToBase64(file);
      setImageData(base64);
    } catch (err) {
      console.error('[Hermes] Image compression failed:', err);
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageSelect(file);
        break;
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    if (imageFile) handleImageSelect(imageFile);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hermesMood: HermesMood | undefined = isLoading ? 'thinking' : undefined;

  const panelPos = useMemo(() => {
    if (!mounted) return { left: 0, top: 0, originX: 'center' as const, originY: 'center' as const };
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
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={handleContextMenu}
      >
        <div
          className={cn(
            'group relative flex items-center justify-center w-full h-full',
            'transition-all duration-300',
            isOpen && 'scale-0 opacity-0 pointer-events-none',
            isDragging && 'cursor-grabbing',
            !isDragging && 'cursor-grab'
          )}
          title="学者小狗 Hermes（按住拖拽，双击菜单）"
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

          <div className="scale-75 md:scale-100 origin-center">
            <HermesAvatar
              size={96}
              mood={hermesMood}
              className="relative z-10 drop-shadow-lg hover:drop-shadow-xl transition-shadow"
              interactive={false}
              isDragging={isDragging}
              command={avatarCommand}
              onDoubleClick={() => setRadialOpen(true)}
            />
          </div>

          {/* 未读提示小红点 */}
          {!isOpen && messages.length <= 1 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white animate-pulse" />
          )}

          {/* 常驻提示文字 */}
          {!isOpen && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none z-10 md:-bottom-[3.75rem] md:top-auto hidden md:block">
              <span className="text-[10px] bg-white/90 text-tea-primary px-2.5 py-0.5 rounded-full shadow-sm border border-tea-primary/20 font-medium whitespace-nowrap">
                点击我聊天，双击和我玩耍
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 右键扇形菜单 */}
      <HermesRadialMenu
        open={radialOpen}
        anchorX={pos.x}
        anchorY={pos.y}
        anchorSize={AVATAR_SIZE}
        onSelect={handleRadialSelect}
        onClose={handleRadialClose}
      />

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed z-50',
          'w-[400px] max-w-[calc(100vw-24px)]',
          'h-[560px] max-h-[calc(100vh-24px)]',
          'bg-white rounded-2xl shadow-2xl border border-gray-200/80',
          'flex flex-col overflow-hidden',
          'transition-[transform,opacity] duration-300 ease-out',
          isOpen
            ? 'scale-100 opacity-100'
            : 'scale-75 opacity-0 pointer-events-none'
        )}
        style={{
          left: panelPos.left,
          top: panelPos.top,
          transformOrigin: `${panelPos.originX} ${panelPos.originY}`,
        }}
      >
        {/* Header */}
        <div className="flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-tea-primary to-tea-mint text-white">
            <div className="flex items-center gap-2.5">
              <HermesAvatar size={36} mood={hermesMood} interactive={false} />
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1">
                  Hermes
                  {mode === 'community_manager' ? (
                    <Shield className="w-3 h-3 text-yellow-200" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-yellow-200" />
                  )}
                </h3>
                <p className="text-[10px] text-white/80">
                  {toolStatus
                    ? toolStatus
                    : isLoading
                      ? '正在思考中...'
                      : mode === 'community_manager'
                        ? '社区运营助手'
                        : '你的常驻 AI 助手'}
                </p>
                {/* Personality selector */}
                <div className="relative mt-0.5">
                  <select
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value as HermesPersonality)}
                    className="appearance-none bg-white/20 hover:bg-white/30 text-white text-[10px] rounded px-1.5 py-0.5 pr-4 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/50 transition-colors"
                    title="切换人格"
                  >
                    <option value="kawaii" className="text-gray-800">✨ 可爱</option>
                    <option value="technical" className="text-gray-800">⚙️ 技术</option>
                    <option value="teacher" className="text-gray-800">📚 导师</option>
                    <option value="analyst" className="text-gray-800">📊 分析</option>
                    <option value="creative" className="text-gray-800">💡 创意</option>
                    <option value="professor" className="text-gray-800">🎓 教授</option>
                    <option value="helpful" className="text-gray-800">🤝 通用</option>
                  </select>
                  <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-white/80 pointer-events-none" />
                </div>
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

          {/* Mode Switcher — ADMIN only */}
          {isAdmin && (
            <div className="flex bg-tea-primary/10 border-b border-tea-primary/10">
              <button
                onClick={() => setMode('kawaii')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors',
                  mode === 'kawaii'
                    ? 'bg-white text-tea-primary border-b-2 border-tea-primary'
                    : 'text-tea-primary/60 hover:text-tea-primary hover:bg-white/50'
                )}
              >
                <MessageCircle className="w-3 h-3" />
                日常助手
              </button>
              <button
                onClick={() => setMode('community_manager')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors',
                  mode === 'community_manager'
                    ? 'bg-white text-tea-primary border-b-2 border-tea-primary'
                    : 'text-tea-primary/60 hover:text-tea-primary hover:bg-white/50'
                )}
              >
                <Shield className="w-3 h-3" />
                社区管家
              </button>
            </div>
          )}
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
                  'max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed select-text',
                  message.role === 'user'
                    ? 'bg-tea-primary text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200/80 text-gray-800 rounded-tl-sm shadow-sm'
                )}
              >
                {message.imageData && (
                  <img
                    src={message.imageData}
                    alt="Uploaded"
                    className="max-w-full max-h-[180px] rounded-lg mb-2 object-contain"
                  />
                )}
                {message.role === 'assistant' ? (
                  <SimpleMarkdown content={message.content} className="select-text" />
                ) : (
                  <p className="whitespace-pre-wrap select-text">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
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
                  <span className="ml-1 text-xs text-muted-foreground">
                    {toolStatus || 'Hermes 正在思考...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 bg-white border-t border-gray-100 flex-shrink-0">
          {/* 图片预览 */}
          {imageData && (
            <div className="relative inline-block mb-2">
              <img
                src={imageData}
                alt="Preview"
                className="h-16 w-16 rounded-lg object-cover border border-gray-200"
              />
              <button
                onClick={() => setImageData(null)}
                className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white rounded-full p-0.5 hover:bg-gray-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file);
                e.target.value = '';
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !!imageData}
              className="size-10 rounded-full flex-shrink-0 text-gray-400 hover:text-tea-primary hover:bg-tea-primary/10"
              title="上传图片"
            >
              <ImagePlus className="w-4 h-4" />
            </Button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              placeholder={imageData ? '描述图片或补充问题...' : '问点什么...'}
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
              disabled={(!input.trim() && !imageData) || isLoading}
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
