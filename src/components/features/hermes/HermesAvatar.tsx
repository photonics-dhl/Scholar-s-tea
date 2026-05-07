'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

interface HermesAvatarProps {
  size?: number;
  mood?: 'idle' | 'happy' | 'thinking' | 'sleepy';
  onClick?: () => void;
  className?: string;
}

export function HermesAvatar({
  size = 56,
  mood: controlledMood,
  onClick,
  className,
}: HermesAvatarProps) {
  const [internalMood, setInternalMood] = useState<'idle' | 'happy' | 'thinking' | 'sleepy'>('idle');
  const [isBouncing, setIsBouncing] = useState(false);
  const [blinking, setBlinking] = useState(false);

  const mood = controlledMood || internalMood;

  // 自动眨眼
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // 点击弹跳
  const handleClick = useCallback(() => {
    setIsBouncing(true);
    setInternalMood('happy');
    setTimeout(() => {
      setIsBouncing(false);
      setInternalMood('idle');
    }, 600);
    onClick?.();
  }, [onClick]);

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

  return (
    <div
      className={cn(
        'relative cursor-pointer select-none',
        'transition-transform duration-200',
        isBouncing && 'animate-hermes-bounce',
        !isBouncing && mood === 'idle' && 'animate-hermes-float',
        className
      )}
      onClick={handleClick}
      style={{ width: s, height: s }}
      title="点击我呀~"
    >
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

        {/* 小手脚 */}
        <ellipse cx={s * 0.18} cy={s * 0.58} rx={s * 0.06} ry={s * 0.08} fill="#6AB894" />
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

        {/* 开心时的星星 */}
        {mood === 'happy' && (
          <>
            <text x={s * 0.15} y={s * 0.35} fontSize={s * 0.12} fill="#E8924A" className="animate-hermes-twinkle">✦</text>
            <text x={s * 0.78} y={s * 0.3} fontSize={s * 0.1} fill="#E8924A" className="animate-hermes-twinkle" style={{ animationDelay: '0.2s' }}>★</text>
          </>
        )}
      </svg>

      {/* 悬浮提示 */}
      {!controlledMood && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-tea-primary text-white px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          点击聊天~
        </span>
      )}
    </div>
  );
}
