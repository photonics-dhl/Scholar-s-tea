'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

export type HermesMood =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'sleepy'
  | 'dancing'
  | 'waving'
  | 'surprised'
  | 'curious'
  | 'love'
  | 'angry'
  | 'shy'
  | 'dizzy'
  | 'bored';

interface HermesAvatarProps {
  size?: number;
  mood?: HermesMood;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
  isDragging?: boolean;
}

/* ============ 气泡消息库 ============ */
const BUBBLES = {
  greeting: [
    '你好呀~ 我是 Hermes！',
    '今天也要努力学习哦 ✨',
    '有什么学术问题问我吧！',
    '嘿嘿~ 好开心见到你！',
    '要一起喝茶聊天吗？🍵',
    '加油加油！你是最棒的！',
  ],
  idle: [
    '在吗在吗？',
    '好无聊呀~',
    '我想喝学者的茶 🍵',
    '你知道吗？茶可以提神哦~',
    '最近在看什么论文呀？',
    '点我点我！我会跳舞~',
    'Zzz... 啊，我没睡着！',
    '这里好安静...',
    '等你好久了呢~',
  ],
  hover: [
    '点我聊天~',
    '握住我拖拽哦',
    '有什么想问的吗？',
    '我在这儿陪着你 ✨',
    '需要帮忙吗？',
    '今天心情怎么样？',
  ],
  drag: [
    '哇啊啊~',
    '我要飞走了！',
    '慢点慢点！',
    '好刺激呀！',
    '抓紧我哦~',
  ],
  dizzy: [
    '头晕晕...',
    '转得好快...',
    '天旋地转...',
    '让我缓一缓...',
  ],
  love: [
    '最喜欢你了！❤️',
    '你对我真好~',
    '么么哒！',
    '好喜欢你呀~',
  ],
  bored: [
    '好无聊...',
    '没人理我...',
    '我要发霉了...',
    '数羊中... 1、2、3...',
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function HermesAvatar({
  size = 56,
  mood: controlledMood,
  onClick,
  className,
  interactive = true,
  isDragging = false,
}: HermesAvatarProps) {
  const [internalMood, setInternalMood] = useState<HermesMood>('idle');
  const [blinking, setBlinking] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const [isDancing, setIsDancing] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const [dizzyStars, setDizzyStars] = useState(false);

  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractRef = useRef<number>(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartTimeRef = useRef<number>(0);

  const mood = controlledMood || internalMood;

  /* ============ 工具函数 ============ */
  const showBubble = useCallback((text?: string, duration = 2500) => {
    setSpeechBubble(text || null);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    if (text) {
      bubbleTimerRef.current = setTimeout(() => setSpeechBubble(null), duration);
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    lastInteractRef.current = Date.now();
  }, []);

  /* ============ 自动眨眼 ============ */
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (mood === 'sleepy' || mood === 'bored') return; // 困倦时不眨眼
      setBlinking(true);
      setTimeout(() => setBlinking(false), 120 + Math.random() * 80);
    }, 2500 + Math.random() * 3000);
    return () => clearInterval(blinkInterval);
  }, [mood]);

  /* ============ 眼睛跟随鼠标 ============ */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxOffset = size * 0.04;
      const dx = ((e.clientX - centerX) / (rect.width / 2)) * maxOffset;
      const dy = ((e.clientY - centerY) / (rect.height / 2)) * maxOffset;
      setEyeOffset({
        x: Math.max(-maxOffset, Math.min(maxOffset, dx)),
        y: Math.max(-maxOffset, Math.min(maxOffset, dy)),
      });
    },
    [size]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    resetIdleTimer();
    // 随机出现 hover 气泡
    if (Math.random() > 0.5 && !speechBubble) {
      showBubble(pickRandom(BUBBLES.hover), 2000);
    }
    // 好奇歪头
    if (mood === 'idle') {
      setHeadTilt(Math.random() > 0.5 ? 8 : -8);
      setTimeout(() => setHeadTilt(0), 800);
    }
  }, [resetIdleTimer, showBubble, speechBubble, mood]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setEyeOffset({ x: 0, y: 0 });
    setHeadTilt(0);
  }, []);

  /* ============ 拖拽反应 ============ */
  useEffect(() => {
    if (isDragging) {
      dragStartTimeRef.current = Date.now();
      setInternalMood('surprised');
      showBubble(pickRandom(BUBBLES.drag), 1500);
      resetIdleTimer();
    } else {
      // 拖拽结束，判断是否有眩晕
      const dragDuration = Date.now() - dragStartTimeRef.current;
      if (dragDuration > 800) {
        setInternalMood('dizzy');
        setDizzyStars(true);
        showBubble(pickRandom(BUBBLES.dizzy), 2000);
        setTimeout(() => {
          setDizzyStars(false);
          setInternalMood('idle');
        }, 2000);
      } else {
        setInternalMood('idle');
      }
    }
  }, [isDragging, showBubble, resetIdleTimer]);

  /* ============ 空闲自动小动作 ============ */
  useEffect(() => {
    const checkIdle = () => {
      const elapsed = Date.now() - lastInteractRef.current;

      // 超过 45 秒无聊
      if (elapsed > 45000 && mood === 'idle' && !isDragging && !controlledMood) {
        const actions: (() => void)[] = [
          // 打哈欠
          () => {
            setInternalMood('bored');
            showBubble('哈~ 欠~ 🥱', 2000);
            setTimeout(() => setInternalMood('idle'), 2000);
          },
          // 左顾右盼
          () => {
            setHeadTilt(12);
            setTimeout(() => setHeadTilt(-12), 400);
            setTimeout(() => setHeadTilt(0), 800);
          },
          // 自言自语
          () => {
            showBubble(pickRandom(BUBBLES.idle), 3000);
          },
          // 想睡觉
          () => {
            setInternalMood('sleepy');
            showBubble('Zzz... 好困...', 2500);
            setTimeout(() => setInternalMood('idle'), 2500);
          },
          // 爱心眼
          () => {
            setInternalMood('love');
            showBubble(pickRandom(BUBBLES.love), 2000);
            setTimeout(() => setInternalMood('idle'), 2000);
          },
          // 好奇
          () => {
            setInternalMood('curious');
            showBubble('嗯？什么声音？', 1500);
            setTimeout(() => setInternalMood('idle'), 1500);
          },
        ];
        pickRandom(actions)();
      }
    };

    idleTimerRef.current = setInterval(checkIdle, 15000);
    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [mood, isDragging, controlledMood, showBubble, resetIdleTimer]);

  /* ============ 点击交互 ============ */
  const doWave = useCallback(() => {
    setIsWaving(true);
    setInternalMood('waving');
    showBubble('嗨~ 我在这里！👋');
    setTimeout(() => {
      setIsWaving(false);
      setInternalMood('idle');
    }, 1200);
  }, [showBubble]);

  const doDance = useCallback(() => {
    setIsDancing(true);
    setInternalMood('dancing');
    showBubble('啦啦啦~ 看我跳舞！💃');
    setTimeout(() => {
      setIsDancing(false);
      setInternalMood('idle');
    }, 1800);
  }, [showBubble]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      resetIdleTimer();
      if (!interactive) {
        onClick?.();
        return;
      }

      const nextCount = clickCount + 1;
      setClickCount(nextCount);

      if (nextCount % 3 === 1) {
        setIsBouncing(true);
        setInternalMood('happy');
        showBubble(pickRandom(BUBBLES.greeting));
        setTimeout(() => {
          setIsBouncing(false);
          setInternalMood('idle');
        }, 600);
      } else if (nextCount % 3 === 2) {
        doWave();
      } else {
        doDance();
      }

      onClick?.();
    },
    [clickCount, interactive, onClick, showBubble, doWave, doDance, resetIdleTimer]
  );

  /* ============ 右键菜单 ============ */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive) return;
      e.preventDefault();
      resetIdleTimer();
      const actions = [
        doWave,
        doDance,
        () => {
          setInternalMood('sleepy');
          showBubble('Zzz... 我要睡觉觉了~');
          setTimeout(() => setInternalMood('idle'), 2000);
        },
        () => {
          setInternalMood('angry');
          showBubble('哼！别戳我！');
          setTimeout(() => setInternalMood('idle'), 1500);
        },
        () => {
          setInternalMood('shy');
          showBubble('哎呀，羞羞~');
          setTimeout(() => setInternalMood('idle'), 1500);
        },
        () => {
          setInternalMood('love');
          showBubble(pickRandom(BUBBLES.love));
          setTimeout(() => setInternalMood('idle'), 2000);
        },
      ];
      pickRandom(actions)();
    },
    [interactive, doWave, doDance, showBubble, resetIdleTimer]
  );

  /* ============ 受控 mood 恢复 ============ */
  useEffect(() => {
    if (controlledMood === 'thinking') {
      const timer = setTimeout(() => setInternalMood('idle'), 5000);
      return () => clearTimeout(timer);
    }
  }, [controlledMood]);

  /* ============ SVG 渲染辅助 ============ */
  const s = size;
  const eyeScaleY = blinking && mood !== 'sleepy' && mood !== 'bored' ? 0.1 : 1;

  // 眼睛基础位置 + 跟随偏移
  const eyeBaseX = s * 0.38;
  const eyeBaseY = s * 0.5;
  const eye2BaseX = s * 0.62;
  const eye2BaseY = s * 0.5;
  const eyeRx = s * 0.07;
  const eyeRy = s * 0.09;

  // 不同 mood 的眼睛渲染
  const renderEyes = () => {
    const ex1 = eyeBaseX + eyeOffset.x;
    const ey1 = eyeBaseY + eyeOffset.y;
    const ex2 = eye2BaseX + eyeOffset.x;
    const ey2 = eye2BaseY + eyeOffset.y;

    if (mood === 'love') {
      // 爱心眼
      return (
        <>
          <g transform={`translate(${ex1 - eyeBaseX}, ${ey1 - eyeBaseY})`}>
            <path
              d={`M ${eyeBaseX} ${eyeBaseY + eyeRy * 0.3} 
                C ${eyeBaseX - eyeRx} ${eyeBaseY - eyeRy * 0.5}, ${eyeBaseX - eyeRx} ${eyeBaseY - eyeRy}, ${eyeBaseX} ${eyeBaseY - eyeRy * 0.3}
                C ${eyeBaseX + eyeRx} ${eyeBaseY - eyeRy}, ${eyeBaseX + eyeRx} ${eyeBaseY - eyeRy * 0.5}, ${eyeBaseX} ${eyeBaseY + eyeRy * 0.3}`}
              fill="#E84A5F"
              transform={`rotate(-10 ${eyeBaseX} ${eyeBaseY})`}
            />
          </g>
          <g transform={`translate(${ex2 - eye2BaseX}, ${ey2 - eye2BaseY})`}>
            <path
              d={`M ${eye2BaseX} ${eye2BaseY + eyeRy * 0.3} 
                C ${eye2BaseX - eyeRx} ${eye2BaseY - eyeRy * 0.5}, ${eye2BaseX - eyeRx} ${eye2BaseY - eyeRy}, ${eye2BaseX} ${eye2BaseY - eyeRy * 0.3}
                C ${eye2BaseX + eyeRx} ${eye2BaseY - eyeRy}, ${eye2BaseX + eyeRx} ${eye2BaseY - eyeRy * 0.5}, ${eye2BaseX} ${eye2BaseY + eyeRy * 0.3}`}
              fill="#E84A5F"
              transform={`rotate(10 ${eye2BaseX} ${eye2BaseY})`}
            />
          </g>
        </>
      );
    }

    if (mood === 'dizzy') {
      // 螺旋眼
      return (
        <>
          <g transform={`translate(${ex1 - eyeBaseX}, ${ey1 - eyeBaseY})`}>
            <circle cx={eyeBaseX} cy={eyeBaseY} r={eyeRx} fill="#1a1a2e" />
            <circle cx={eyeBaseX} cy={eyeBaseY} r={eyeRx * 0.6} fill="none" stroke="white" strokeWidth={1} />
            <path d={`M ${eyeBaseX - eyeRx * 0.3} ${eyeBaseY - eyeRx * 0.3} Q ${eyeBaseX} ${eyeBaseY - eyeRx * 0.5} ${eyeBaseX + eyeRx * 0.3} ${eyeBaseY}`} fill="none" stroke="white" strokeWidth={0.8} />
          </g>
          <g transform={`translate(${ex2 - eye2BaseX}, ${ey2 - eye2BaseY})`}>
            <circle cx={eye2BaseX} cy={eye2BaseY} r={eyeRx} fill="#1a1a2e" />
            <circle cx={eye2BaseX} cy={eye2BaseY} r={eyeRx * 0.6} fill="none" stroke="white" strokeWidth={1} />
            <path d={`M ${eye2BaseX - eyeRx * 0.3} ${eye2BaseY - eyeRx * 0.3} Q ${eye2BaseX} ${eye2BaseY - eyeRx * 0.5} ${eye2BaseX + eyeRx * 0.3} ${eye2BaseY}`} fill="none" stroke="white" strokeWidth={0.8} />
          </g>
        </>
      );
    }

    if (mood === 'surprised') {
      // 大眼圆
      return (
        <>
          <g transform={`translate(${ex1 - eyeBaseX}, ${ey1 - eyeBaseY}) scale(1.2)`} style={{ transformOrigin: `${eyeBaseX}px ${eyeBaseY}px` }}>
            <circle cx={eyeBaseX} cy={eyeBaseY} r={eyeRx} fill="#1a1a2e" />
            <circle cx={eyeBaseX - eyeRx * 0.2} cy={eyeBaseY - eyeRx * 0.2} r={eyeRx * 0.35} fill="white" />
          </g>
          <g transform={`translate(${ex2 - eye2BaseX}, ${ey2 - eye2BaseY}) scale(1.2)`} style={{ transformOrigin: `${eye2BaseX}px ${eye2BaseY}px` }}>
            <circle cx={eye2BaseX} cy={eye2BaseY} r={eyeRx} fill="#1a1a2e" />
            <circle cx={eye2BaseX - eyeRx * 0.2} cy={eye2BaseY - eyeRx * 0.2} r={eyeRx * 0.35} fill="white" />
          </g>
        </>
      );
    }

    if (mood === 'sleepy' || mood === 'bored') {
      // 半闭眼（弧线）
      return (
        <>
          <g transform={`translate(${ex1 - eyeBaseX}, ${ey1 - eyeBaseY})`}>
            <path d={`M ${eyeBaseX - eyeRx} ${eyeBaseY} Q ${eyeBaseX} ${eyeBaseY + eyeRy * 0.3} ${eyeBaseX + eyeRx} ${eyeBaseY}`} stroke="#1a1a2e" strokeWidth={2} fill="none" strokeLinecap="round" />
          </g>
          <g transform={`translate(${ex2 - eye2BaseX}, ${ey2 - eye2BaseY})`}>
            <path d={`M ${eye2BaseX - eyeRx} ${eye2BaseY} Q ${eye2BaseX} ${eye2BaseY + eyeRy * 0.3} ${eye2BaseX + eyeRx} ${eye2BaseY}`} stroke="#1a1a2e" strokeWidth={2} fill="none" strokeLinecap="round" />
          </g>
        </>
      );
    }

    if (mood === 'angry') {
      // 倒竖眉 + 横眼
      return (
        <>
          {/* 眉毛 */}
          <line x1={eyeBaseX - eyeRx} y1={eyeBaseY - eyeRy - 2} x2={eyeBaseX + eyeRx} y2={eyeBaseY - eyeRy * 0.3} stroke="#1a1a2e" strokeWidth={2} strokeLinecap="round" />
          <line x1={eye2BaseX + eyeRx} y1={eyeBaseY - eyeRy - 2} x2={eye2BaseX - eyeRx} y2={eyeBaseY - eyeRy * 0.3} stroke="#1a1a2e" strokeWidth={2} strokeLinecap="round" />
          {/* 眼睛 */}
          <g style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: `${ex1}px ${ey1}px` }}>
            <ellipse cx={ex1} cy={ey1} rx={eyeRx} ry={eyeRy} fill="#1a1a2e" />
            <circle cx={ex1 - eyeRx * 0.2} cy={ey1 - eyeRy * 0.3} r={eyeRx * 0.25} fill="white" />
          </g>
          <g style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: `${ex2}px ${ey2}px` }}>
            <ellipse cx={ex2} cy={ey2} rx={eyeRx} ry={eyeRy} fill="#1a1a2e" />
            <circle cx={ex2 - eyeRx * 0.2} cy={ey2 - eyeRy * 0.3} r={eyeRx * 0.25} fill="white" />
          </g>
        </>
      );
    }

    if (mood === 'shy') {
      // 向下看
      return (
        <>
          <g style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: `${ex1}px ${ey1}px` }}>
            <ellipse cx={ex1} cy={ey1 + 2} rx={eyeRx} ry={eyeRy * 0.7} fill="#1a1a2e" />
            <circle cx={ex1 - 1} cy={ey1} r={eyeRx * 0.25} fill="white" />
          </g>
          <g style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: `${ex2}px ${ey2}px` }}>
            <ellipse cx={ex2} cy={ey2 + 2} rx={eyeRx} ry={eyeRy * 0.7} fill="#1a1a2e" />
            <circle cx={ex2 - 1} cy={ey2} r={eyeRx * 0.25} fill="white" />
          </g>
        </>
      );
    }

    if (mood === 'curious') {
      // 一只眼睁大一只眼正常 + 歪眉
      return (
        <>
          <line x1={eyeBaseX - eyeRx} y1={eyeBaseY - eyeRy} x2={eyeBaseX + eyeRx} y2={eyeBaseY - eyeRy - 3} stroke="#1a1a2e" strokeWidth={1.5} strokeLinecap="round" />
          <g style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: `${ex1}px ${ey1}px` }}>
            <ellipse cx={ex1} cy={ey1} rx={eyeRx * 1.1} ry={eyeRy * 1.1} fill="#1a1a2e" />
            <circle cx={ex1 - 1} cy={ey1 - 2} r={eyeRx * 0.3} fill="white" />
          </g>
          <g style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: `${ex2}px ${ey2}px` }}>
            <ellipse cx={ex2} cy={ey2} rx={eyeRx} ry={eyeRy} fill="#1a1a2e" />
            <circle cx={ex2 - 1} cy={ey2 - 1} r={eyeRx * 0.25} fill="white" />
          </g>
        </>
      );
    }

    // 默认：正常椭圆眼
    return (
      <>
        <g style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: `${ex1}px ${ey1}px` }}>
          <ellipse cx={ex1} cy={ey1} rx={eyeRx} ry={eyeRy} fill="#1a1a2e" />
          <circle cx={ex1 - eyeRx * 0.2} cy={ey1 - eyeRy * 0.3} r={eyeRx * 0.35} fill="white" />
        </g>
        <g style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: `${ex2}px ${ey2}px` }}>
          <ellipse cx={ex2} cy={ey2} rx={eyeRx} ry={eyeRy} fill="#1a1a2e" />
          <circle cx={ex2 - eyeRx * 0.2} cy={ey2 - eyeRy * 0.3} r={eyeRx * 0.35} fill="white" />
        </g>
      </>
    );
  };

  // 嘴巴路径
  const mouthD = (() => {
    if (mood === 'happy' || mood === 'dancing' || mood === 'waving')
      return `M ${s * 0.35} ${s * 0.62} Q ${s * 0.5} ${s * 0.74} ${s * 0.65} ${s * 0.62}`;
    if (mood === 'surprised')
      return `M ${s * 0.46} ${s * 0.62} A ${s * 0.04} ${s * 0.05} 0 1 1 ${s * 0.46} ${s * 0.63}`;
    if (mood === 'thinking')
      return `M ${s * 0.38} ${s * 0.65} Q ${s * 0.5} ${s * 0.6} ${s * 0.62} ${s * 0.65}`;
    if (mood === 'angry')
      return `M ${s * 0.38} ${s * 0.68} Q ${s * 0.5} ${s * 0.62} ${s * 0.62} ${s * 0.68}`;
    if (mood === 'sleepy' || mood === 'bored')
      return `M ${s * 0.42} ${s * 0.66} Q ${s * 0.5} ${s * 0.66} ${s * 0.58} ${s * 0.66}`;
    if (mood === 'love')
      return `M ${s * 0.38} ${s * 0.64} Q ${s * 0.5} ${s * 0.7} ${s * 0.62} ${s * 0.64}`;
    if (mood === 'curious')
      return `M ${s * 0.45} ${s * 0.66} A ${s * 0.03} ${s * 0.03} 0 1 1 ${s * 0.45} ${s * 0.67}`;
    if (mood === 'shy')
      return `M ${s * 0.38} ${s * 0.66} Q ${s * 0.5} ${s * 0.69} ${s * 0.62} ${s * 0.66}`;
    return `M ${s * 0.38} ${s * 0.65} Q ${s * 0.5} ${s * 0.68} ${s * 0.62} ${s * 0.65}`;
  })();

  // 动画类名
  const animationClass = isDancing
    ? 'animate-hermes-dance'
    : isBouncing
      ? 'animate-hermes-bounce'
      : mood === 'dizzy'
        ? 'animate-hermes-dizzy'
        : mood === 'idle' && !isWaving && !isDragging
          ? 'animate-hermes-breathe'
          : '';

  // 头部倾斜（好奇、歪头时）
  const headTransform = headTilt !== 0 ? `rotate(${headTilt} ${s * 0.5} ${s * 0.55})` : undefined;

  // 生气时的身体微颤
  const bodyShake = mood === 'angry' ? 'animate-hermes-shake' : '';

  // 腮红颜色和透明度按 mood
  const blushOpacity = mood === 'love' || mood === 'shy' ? 0.7 : mood === 'angry' ? 0.5 : 0.4;
  const blushColor = mood === 'angry' ? '232,100,100' : '232,160,160';

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative cursor-pointer select-none',
        'transition-transform duration-200',
        animationClass,
        bodyShake,
        className
      )}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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

      <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} className="drop-shadow-md">
        <defs>
          <linearGradient id={`bodyGrad-${s}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7BC4A8" />
            <stop offset="100%" stopColor="#6AB894" />
          </linearGradient>
          <radialGradient id={`highlight-${s}`} cx="30%" cy="25%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id={`blush-${s}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`rgba(${blushColor},${blushOpacity})`} />
            <stop offset="100%" stopColor={`rgba(${blushColor},0)`} />
          </radialGradient>
        </defs>

        {/* 天线/叶子 */}
        <g
          className={cn(
            'origin-bottom',
            mood === 'thinking' && 'animate-hermes-wiggle',
            mood === 'happy' && 'animate-hermes-bounce-leaf',
            mood === 'dizzy' && 'animate-hermes-spin-slow'
          )}
          style={{ transformOrigin: `${s * 0.5}px ${s * 0.22}px` }}
        >
          <path
            d={`M ${s * 0.5} ${s * 0.22} Q ${s * 0.42} ${s * 0.08} ${s * 0.38} ${s * 0.04} Q ${s * 0.45} ${s * 0.1} ${s * 0.5} ${s * 0.14} Q ${s * 0.55} ${s * 0.1} ${s * 0.62} ${s * 0.04} Q ${s * 0.58} ${s * 0.08} ${s * 0.5} ${s * 0.22}`}
            fill="#7BC4A8"
            stroke="#5AA888"
            strokeWidth={1}
          />
          <path d={`M ${s * 0.5} ${s * 0.22} Q ${s * 0.5} ${s * 0.13} ${s * 0.5} ${s * 0.06}`} stroke="#5AA888" strokeWidth={0.5} fill="none" />
        </g>

        {/* 身体（带头部倾斜） */}
        <g transform={headTransform}>
          <circle cx={s * 0.5} cy={s * 0.55} r={s * 0.38} fill={`url(#bodyGrad-${s})`} />
          <circle cx={s * 0.5} cy={s * 0.55} r={s * 0.38} fill={`url(#highlight-${s})`} />
        </g>

        {/* 小手脚 - 挥手动画 */}
        <g
          className={cn(isWaving && 'animate-hermes-wave-left')}
          style={{ transformOrigin: `${s * 0.18}px ${s * 0.58}px` }}
        >
          <ellipse cx={s * 0.18} cy={s * 0.58} rx={s * 0.06} ry={s * 0.08} fill="#6AB894" />
        </g>
        <ellipse cx={s * 0.82} cy={s * 0.58} rx={s * 0.06} ry={s * 0.08} fill="#6AB894" />
        <ellipse cx={s * 0.38} cy={s * 0.9} rx={s * 0.07} ry={s * 0.05} fill="#6AB894" />
        <ellipse cx={s * 0.62} cy={s * 0.9} rx={s * 0.07} ry={s * 0.05} fill="#6AB894" />

        {/* 眼睛 */}
        <g transform={headTransform}>
          {renderEyes()}
        </g>

        {/* 腮红 */}
        <g transform={headTransform}>
          <circle cx={s * 0.28} cy={s * 0.6} r={s * 0.08} fill={`url(#blush-${s})`} />
          <circle cx={s * 0.72} cy={s * 0.6} r={s * 0.08} fill={`url(#blush-${s})`} />
        </g>

        {/* 嘴巴 */}
        <g transform={headTransform}>
          <path d={mouthD} stroke="#1a1a2e" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        </g>

        {/* 思考时的问号 */}
        {mood === 'thinking' && (
          <text x={s * 0.72} y={s * 0.32} fontSize={s * 0.16} fill="#E8924A" fontWeight="bold" className="animate-hermes-pulse">
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

        {/* 爱心 */}
        {mood === 'love' && (
          <>
            <text x={s * 0.12} y={s * 0.3} fontSize={s * 0.12} fill="#E84A5F" className="animate-hermes-float-heart">♥</text>
            <text x={s * 0.82} y={s * 0.25} fontSize={s * 0.1} fill="#E84A5F" className="animate-hermes-float-heart" style={{ animationDelay: '0.3s' }}>♥</text>
          </>
        )}

        {/* 睡觉时的 Zzz */}
        {mood === 'sleepy' && (
          <>
            <text x={s * 0.72} y={s * 0.28} fontSize={s * 0.12} fill="#8B9DC3" className="animate-hermes-pulse">z</text>
            <text x={s * 0.8} y={s * 0.2} fontSize={s * 0.08} fill="#8B9DC3" className="animate-hermes-pulse" style={{ animationDelay: '0.3s' }}>z</text>
          </>
        )}

        {/* 无聊时的叹气 */}
        {mood === 'bored' && (
          <text x={s * 0.68} y={s * 0.3} fontSize={s * 0.1} fill="#8B9DC3" className="animate-hermes-pulse">...</text>
        )}

        {/* 眩晕星星（拖拽后） */}
        {dizzyStars && (
          <>
            <text x={s * 0.2} y={s * 0.2} fontSize={s * 0.14} fill="#E8924A" className="animate-hermes-dizzy-star">★</text>
            <text x={s * 0.75} y={s * 0.18} fontSize={s * 0.1} fill="#E8924A" className="animate-hermes-dizzy-star" style={{ animationDelay: '0.2s' }}>✦</text>
            <text x={s * 0.5} y={s * 0.12} fontSize={s * 0.08} fill="#E8924A" className="animate-hermes-dizzy-star" style={{ animationDelay: '0.4s' }}>★</text>
          </>
        )}
      </svg>

      {/* 悬浮提示（无受控 mood 且无气泡时） */}
      {!controlledMood && !speechBubble && isHovered && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-tea-primary text-white px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none animate-scale-in">
          点击聊天~
        </span>
      )}
    </div>
  );
}
