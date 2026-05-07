'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface HermesAvatarProps {
  size?: number;
  mood?: 'idle' | 'happy' | 'thinking' | 'sleepy' | 'dancing' | 'waving';
  onClick?: () => void;
  className?: string;
  interactive?: boolean; // 是否开启丰富的点击交互
}

const CUTE_MESSAGES = [
  '你好呀~ 我是 Hermes！',
  '今天也要努力学习哦 ✨',
  '点我点我！我会跳舞~',
  '有什么学术问题问我吧！',
  '我想喝学者的茶 🍵',
  '你知道吗？茶可以提神哦~',
  '最近在看什么论文呀？',
  '加油加油！你是最棒的！',
  '嘿嘿~ 好开心见到你！',
  '要一起喝茶聊天吗？',
];

export function HermesAvatar({
  size = 56,
  mood: controlledMood,
  onClick,
  className,
  interactive = true,
}: HermesAvatarProps) {
  const [internalMood, setInternalMood] = useState<'idle' | 'happy' | 'thinking' | 'sleepy' | 'dancing' | 'waving'>('idle');
  const [isBouncing, setIsBouncing] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [isWaving, setIsWaving] = useState(false);
  const [isDancing, setIsDancing] = useState(false);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const mood = controlledMood || internalMood;

  // 自动眨眼
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // 显示气泡对话
  const showBubble = useCallback((text?: string) => {
    const msg = text || CUTE_MESSAGES[Math.floor(Math.random() * CUTE_MESSAGES.length)];
    setSpeechBubble(msg);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => setSpeechBubble(null), 2500);
  }, []);

  // 挥手动画
  const doWave = useCallback(() => {
    setIsWaving(true);
    setInternalMood('waving');
    showBubble('嗨~ 我在这里！👋');
    setTimeout(() => {
      setIsWaving(false);
      setInternalMood('idle');
    }, 1200);
  }, [showBubble]);

  // 跳舞动画
  const doDance = useCallback(() => {
    setIsDancing(true);
    setInternalMood('dancing');
    showBubble('啦啦啦~ 看我跳舞！💃');
    setTimeout(() => {
      setIsDancing(false);
      setInternalMood('idle');
    }, 1800);
  }, [showBubble]);

  // 点击交互：轮播不同动作
  const handleClick = useCallback(() => {
    if (!interactive) {
      onClick?.();
      return;
    }

    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    // 轮播：弹跳 → 挥手 → 跳舞 → 弹跳...
    if (nextCount % 3 === 1) {
      // 弹跳
      setIsBouncing(true);
      setInternalMood('happy');
      showBubble();
      setTimeout(() => {
        setIsBouncing(false);
        setInternalMood('idle');
      }, 600);
    } else if (nextCount % 3 === 2) {
      // 挥手
      doWave();
    } else {
      // 跳舞
      doDance();
    }

    onClick?.();
  }, [clickCount, interactive, onClick, showBubble, doWave, doDance]);

  // 右键菜单：更多互动
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!interactive) return;
    e.preventDefault();
    const actions = [doWave, doDance, () => {
      setInternalMood('sleepy');
      showBubble('Zzz... 我要睡觉觉了~');
      setTimeout(() => setInternalMood('idle'), 2000);
    }];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    randomAction();
  }, [interactive, doWave, doDance, showBubble]);

  // 思考状态自动恢复
  useEffect(() => {
    if (controlledMood === 'thinking') {
      const timer = setTimeout(() => setInternalMood('idle'), 5000);
      return () => clearTimeout(timer);
    }
  }, [controlledMood]);

  const s = size;
  const eyeScaleY = blinking ? 0.1 : 1;
  const mouthD = mood === 'happy'
    ? `M ${s * 0.35} ${s * 0.62} Q ${s * 0.5} ${s * 0.72} ${s * 0.65} ${s * 0.62}`
    : mood === 'thinking'
      ? `M ${s * 0.38} ${s * 0.65} Q ${s * 0.5} ${s * 0.6} ${s * 0.62} ${s * 0.65}`
      : `M ${s * 0.38} ${s * 0.65} Q ${s * 0.5} ${s * 0.68} ${s * 0.62} ${s * 0.65}`;

  // 计算当前动画类名
  const animationClass = isDancing
    ? 'animate-hermes-dance'
    : isBouncing
      ? 'animate-hermes-bounce'
      : mood === 'idle' && !isWaving
        ? 'animate-hermes-float'
        : '';

  // 小手挥手时的旋转角度
  const handWaveAngle = isWaving
    ? 'animate-hermes-wave-hand'
    : '';

  return (
    <div
      className={cn(
        'relative cursor-pointer select-none',
        'transition-transform duration-200',
        animationClass,
        className
      )}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{ width: s, height: s }}
      title="点击我呀~（右键也有惊喜）"
    >
      {/* 对话气泡 */}
      {speechBubble && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
          <div className="bg-white text-gray-700 text-[11px] px-3 py-1.5 rounded-xl shadow-lg border border-gray-100 animate-scale-in relative">
            {speechBubble}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45" />
          </div>
        </div>
      )}
      <svg
        viewBox={`0 0 ${s} ${s}`}
        width={s}
        height={s}
        className="drop-shadow-md"
      >
        <defs>
          {/* 身体渐变 */}
          <linearGradient id={`bodyGrad-${s}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7BC4A8" />
            <stop offset="100%" stopColor="#6AB894" />
          </linearGradient>
          {/* 高光 */}
          <radialGradient id={`highlight-${s}`} cx="30%" cy="25%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          {/* 腮红 */}
          <radialGradient id={`blush-${s}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(232,160,160,0.4)" />
            <stop offset="100%" stopColor="rgba(232,160,160,0)" />
          </radialGradient>
        </defs>

        {/* 天线/叶子 - 茶文化元素 */}
        <g
          className={cn(
            'origin-bottom',
            mood === 'thinking' && 'animate-hermes-wiggle',
            mood === 'happy' && 'animate-hermes-bounce-leaf'
          )}
          style={{ transformOrigin: `${s * 0.5}px ${s * 0.22}px` }}
        >
          <path
            d={`M ${s * 0.5} ${s * 0.22} Q ${s * 0.42} ${s * 0.08} ${s * 0.38} ${s * 0.04} Q ${s * 0.45} ${s * 0.1} ${s * 0.5} ${s * 0.14} Q ${s * 0.55} ${s * 0.1} ${s * 0.62} ${s * 0.04} Q ${s * 0.58} ${s * 0.08} ${s * 0.5} ${s * 0.22}`}
            fill="#7BC4A8"
            stroke="#5AA888"
            strokeWidth={1}
          />
          {/* 叶子中线 */}
          <path
            d={`M ${s * 0.5} ${s * 0.22} Q ${s * 0.5} ${s * 0.13} ${s * 0.5} ${s * 0.06}`}
            stroke="#5AA888"
            strokeWidth={0.5}
            fill="none"
          />
        </g>

        {/* 身体 */}
        <circle cx={s * 0.5} cy={s * 0.55} r={s * 0.38} fill={`url(#bodyGrad-${s})`} />
        <circle cx={s * 0.5} cy={s * 0.55} r={s * 0.38} fill={`url(#highlight-${s})`} />

        {/* 小手脚 - 挥手时左手（左侧手）添加动画 */}
        <g className={cn(isWaving && 'animate-hermes-wave-left')} style={{ transformOrigin: `${s * 0.18}px ${s * 0.58}px` }}>
          <ellipse cx={s * 0.18} cy={s * 0.58} rx={s * 0.06} ry={s * 0.08} fill="#6AB894" />
        </g>
        <ellipse cx={s * 0.82} cy={s * 0.58} rx={s * 0.06} ry={s * 0.08} fill="#6AB894" />
        <ellipse cx={s * 0.38} cy={s * 0.9} rx={s * 0.07} ry={s * 0.05} fill="#6AB894" />
        <ellipse cx={s * 0.62} cy={s * 0.9} rx={s * 0.07} ry={s * 0.05} fill="#6AB894" />

        {/* 眼睛 */}
        <g
          style={{
            transformOrigin: `${s * 0.38}px ${s * 0.5}px`,
            transform: `scaleY(${eyeScaleY})`,
          }}
        >
          <ellipse cx={s * 0.38} cy={s * 0.5} rx={s * 0.07} ry={s * 0.09} fill="#1a1a2e" />
          <circle cx={s * 0.36} cy={s * 0.47} r={s * 0.025} fill="white" />
        </g>
        <g
          style={{
            transformOrigin: `${s * 0.62}px ${s * 0.5}px`,
            transform: `scaleY(${eyeScaleY})`,
          }}
        >
          <ellipse cx={s * 0.62} cy={s * 0.5} rx={s * 0.07} ry={s * 0.09} fill="#1a1a2e" />
          <circle cx={s * 0.6} cy={s * 0.47} r={s * 0.025} fill="white" />
        </g>

        {/* 腮红 */}
        <circle cx={s * 0.28} cy={s * 0.6} r={s * 0.08} fill={`url(#blush-${s})`} />
        <circle cx={s * 0.72} cy={s * 0.6} r={s * 0.08} fill={`url(#blush-${s})`} />

        {/* 嘴巴 */}
        <path
          d={mouthD}
          stroke="#1a1a2e"
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
        />

        {/* 思考时的问号 */}
        {mood === 'thinking' && (
          <text
            x={s * 0.72}
            y={s * 0.32}
            fontSize={s * 0.16}
            fill="#E8924A"
            fontWeight="bold"
            className="animate-hermes-pulse"
          >
            ?
          </text>
        )}

        {/* 开心/跳舞/挥手时的星星 */}
        {(mood === 'happy' || mood === 'dancing' || mood === 'waving') && (
          <>
            <text x={s * 0.15} y={s * 0.35} fontSize={s * 0.12} fill="#E8924A" className="animate-hermes-twinkle">✦</text>
            <text x={s * 0.78} y={s * 0.3} fontSize={s * 0.1} fill="#E8924A" className="animate-hermes-twinkle" style={{ animationDelay: '0.2s' }}>★</text>
          </>
        )}

        {/* 睡觉时的 Zzz */}
        {mood === 'sleepy' && (
          <>
            <text x={s * 0.72} y={s * 0.28} fontSize={s * 0.12} fill="#8B9DC3" className="animate-hermes-pulse">z</text>
            <text x={s * 0.8} y={s * 0.2} fontSize={s * 0.08} fill="#8B9DC3" className="animate-hermes-pulse" style={{ animationDelay: '0.3s' }}>z</text>
          </>
        )}
      </svg>

      {/* 悬浮提示 */}
      {!controlledMood && !speechBubble && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-tea-primary text-white px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          点击聊天~
        </span>
      )}
    </div>
  );
}
