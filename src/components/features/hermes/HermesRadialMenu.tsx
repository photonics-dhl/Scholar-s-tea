'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  Sparkles,
  Moon,
  Music,
  Hand,
  Heart,
  Shuffle,
  BookOpen,
  Search,
  HelpCircle,
  Coffee,
  Lightbulb,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export type RadialAction =
  | 'encourage'
  | 'rest'
  | 'dance'
  | 'greet'
  | 'love'
  | 'random'
  | 'study'
  | 'insight'
  | 'confused'
  | 'tea'
  | 'inspired'
  | 'debate'
  | 'eureka'
  | 'tea_sip';

interface MenuItem {
  action: RadialAction;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  angle: number; // degrees, 0 = right, positive = downward arc
}

const MENU_ITEMS: MenuItem[] = [
  {
    action: 'encourage',
    label: '安慰我',
    icon: Sparkles,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
    angle: -60,
  },
  {
    action: 'rest',
    label: '放松心情',
    icon: Moon,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
    angle: -40,
  },
  {
    action: 'greet',
    label: '打招呼',
    icon: Hand,
    color: 'text-sky-500',
    bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200',
    angle: -20,
  },
  {
    action: 'dance',
    label: '跳舞',
    icon: Music,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 hover:bg-rose-100 border-rose-200',
    angle: 0,
  },
  {
    action: 'love',
    label: '好心情',
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
    angle: 20,
  },
  {
    action: 'study',
    label: '格物致知',
    icon: BookOpen,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    angle: 40,
  },
  {
    action: 'insight',
    label: '洞察先机',
    icon: Search,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50 hover:bg-violet-100 border-violet-200',
    angle: 60,
  },
  {
    action: 'confused',
    label: 'AI不懂',
    icon: HelpCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
    angle: 80,
  },
  {
    action: 'tea',
    label: '茶会恭候',
    icon: Coffee,
    color: 'text-tea-primary',
    bgColor: 'bg-tea-bg hover:bg-tea-mint/30 border-tea-primary/20',
    angle: -80,
  },
  {
    action: 'inspired',
    label: '灵感爆棚',
    icon: Lightbulb,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
    angle: -100,
  },
  {
    action: 'eureka',
    label: '原来如此',
    icon: Sparkles,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',
    angle: 100,
  },
  {
    action: 'tea_sip',
    label: '茶润学识',
    icon: Coffee,
    color: 'text-tea-primary',
    bgColor: 'bg-tea-bg hover:bg-tea-mint/30 border-tea-primary/20',
    angle: 120,
  },
  {
    action: 'debate',
    label: '学术辩论',
    icon: MessageSquare,
    color: 'text-red-500',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
    angle: 140,
  },
  {
    action: 'random',
    label: '随机',
    icon: Shuffle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
    angle: 160,
  },
];

interface HermesRadialMenuProps {
  open: boolean;
  anchorX: number;
  anchorY: number;
  anchorSize: number;
  onSelect: (action: RadialAction) => void;
  onClose: () => void;
}

export function HermesRadialMenu({
  open,
  anchorX,
  anchorY,
  anchorSize,
  onSelect,
  onClose,
}: HermesRadialMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Delay to avoid immediate close from the same click that opened
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const handleSelect = useCallback(
    (action: RadialAction) => {
      onSelect(action);
      onClose();
    },
    [onSelect, onClose]
  );

  if (!open) return null;

  // Anchor center position
  const centerX = anchorX + anchorSize / 2;
  const centerY = anchorY + anchorSize / 2;
  const radius = 105; // distance from center to each button

  return (
    <div
      ref={menuRef}
      className="fixed z-[60] pointer-events-none"
      style={{
        left: centerX,
        top: centerY,
      }}
    >
      {/* Fan-shaped background */}
      <div
        className="absolute rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-lg animate-scale-in pointer-events-auto"
        style={{
          width: radius * 2.8,
          height: radius * 2.8,
          left: -radius * 0.4,
          top: -radius * 1.4,
        }}
      />

      {MENU_ITEMS.map((item, index) => {
        const rad = (item.angle * Math.PI) / 180;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        const Icon = item.icon;

        return (
          <button
            key={item.action}
            onClick={() => handleSelect(item.action)}
            className={cn(
              'absolute flex flex-col items-center justify-center gap-0.5',
              'w-11 h-11 rounded-full border shadow-md',
              'transition-all duration-200 ease-out',
              'hover:scale-110 hover:shadow-lg active:scale-95',
              'pointer-events-auto cursor-pointer',
              item.bgColor,
              'animate-fade-in-up'
            )}
            style={{
              left: x - 22,
              top: y - 22,
              animationDelay: `${index * 30}ms`,
              animationFillMode: 'both',
            }}
            title={item.label}
          >
            <Icon className={cn('w-3.5 h-3.5', item.color)} />
            <span className={cn('text-[8px] font-medium leading-none', item.color)}>
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Decorative center dot */}
      <div
        className="absolute w-2 h-2 rounded-full bg-tea-primary/40 animate-pulse"
        style={{ left: -4, top: -4 }}
      />
    </div>
  );
}
