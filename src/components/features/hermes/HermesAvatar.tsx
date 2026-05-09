'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils/cn'

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
  | 'bored'
  | 'studying'
  | 'insight'
  | 'confused'
  | 'tea_time'
  | 'inspired'
  | 'debate'
  | 'eureka'
  | 'tea_sipping'

/** 外部命令接口 — 让父组件可以命令 Avatar 执行动作 */
export interface AvatarCommand {
  action:
    | 'wave'
    | 'dance'
    | 'sleep'
    | 'love'
    | 'happy'
    | 'random'
    | 'study'
    | 'insight'
    | 'confused'
    | 'tea'
    | 'inspired'
    | 'debate'
    | 'eureka'
    | 'tea_sip'
  bubble?: string
}

interface HermesAvatarProps {
  size?: number
  mood?: HermesMood
  onClick?: () => void
  className?: string
  interactive?: boolean
  isDragging?: boolean
  /** 外部命令 — 传入新对象即触发对应动作 */
  command?: AvatarCommand
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
  comfort: {
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
    study: [
      '格物致知，学无止境！📚',
      '书中自有黄金屋~',
      '继续加油，知识就是力量！',
      '今天的学习目标完成了吗？',
    ],
    insight: [
      '洞察先机，明察秋毫！🔍',
      '我发现了一个有趣的规律~',
      '知识的力量无穷无尽！',
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
  },
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/* ============================================================
   SVG 熊猫绘制函数 — Kakao Friends 粗描边卡通风格 V3
   ============================================================ */

const STROKE = '#1a1a2e'
const STROKE_W = (s: number) => s * 0.018
const WHITE = '#fff'
const DARK = '#1a1a2e'
const PINK = '#ff8fa3'

/** 经典 Kakao 风格多层有神大眼 */
function renderEyes(s: number, mood: HermesMood, blinking: boolean) {
  const eyeY = s * 0.36
  const leftX = s * 0.36
  const rightX = s * 0.64
  const sz = s * 0.09

  // 闭眼
  if (blinking || mood === 'sleepy' || mood === 'bored') {
    return (
      <>
        <path d={`M ${leftX - sz * 0.7} ${eyeY + sz * 0.15} Q ${leftX} ${eyeY + sz * 0.55} ${leftX + sz * 0.7} ${eyeY + sz * 0.15}`}
          stroke={STROKE} strokeWidth={s * 0.028} fill="none" strokeLinecap="round" />
        <path d={`M ${rightX - sz * 0.7} ${eyeY + sz * 0.15} Q ${rightX} ${eyeY + sz * 0.55} ${rightX + sz * 0.7} ${eyeY + sz * 0.15}`}
          stroke={STROKE} strokeWidth={s * 0.028} fill="none" strokeLinecap="round" />
      </>
    )
  }

  // 默认大眼睛结构：倾斜眼圈 + 大眼白 + 大瞳孔 + 双高光
  const normalEye = (cx: number, rot: number) => (
    <>
      {/* 黑眼圈 — 更大角度，更像熊猫墨镜 */}
      <ellipse cx={cx} cy={eyeY} rx={sz * 1.05} ry={sz * 0.88}
        fill={DARK} transform={`rotate(${rot} ${cx} ${eyeY})`} />
      {/* 眼白 — 更大更圆 */}
      <circle cx={cx} cy={eyeY - sz * 0.02} r={sz * 0.68} fill={WHITE} />
      {/* 瞳孔 — 更大！这是可爱的核心 */}
      <circle cx={cx} cy={eyeY + sz * 0.02} r={sz * 0.38} fill={DARK} />
      {/* 主高光 — 大而亮，左上 */}
      <circle cx={cx - sz * 0.18} cy={eyeY - sz * 0.22} r={sz * 0.22} fill={WHITE} />
      {/* 次高光 — 右下小反光 */}
      <circle cx={cx + sz * 0.16} cy={eyeY + sz * 0.18} r={sz * 0.11} fill={WHITE} opacity={0.8} />
      {/* 微小高光点 — 增加水润感 */}
      <circle cx={cx + sz * 0.08} cy={eyeY - sz * 0.08} r={sz * 0.05} fill={WHITE} opacity={0.9} />
    </>
  )

  switch (mood) {
    case 'happy':
    case 'dancing':
    case 'waving':
    case 'eureka':
    case 'inspired':
    case 'tea_time':
    case 'tea_sipping':
      return (
        <>
          <path d={`M ${leftX - sz * 0.9} ${eyeY + sz * 0.3} Q ${leftX} ${eyeY - sz * 0.35} ${leftX + sz * 0.9} ${eyeY + sz * 0.3}`}
            stroke={STROKE} strokeWidth={s * 0.035} fill="none" strokeLinecap="round" />
          <path d={`M ${rightX - sz * 0.9} ${eyeY + sz * 0.3} Q ${rightX} ${eyeY - sz * 0.35} ${rightX + sz * 0.9} ${eyeY + sz * 0.3}`}
            stroke={STROKE} strokeWidth={s * 0.035} fill="none" strokeLinecap="round" />
        </>
      )
    case 'love': {
      const heart = (cx: number) => (
        <path d={`M ${cx} ${eyeY + sz * 0.25} C ${cx - sz * 0.75} ${eyeY - sz * 0.35}, ${cx - sz * 0.75} ${eyeY + sz * 0.65}, ${cx} ${eyeY + sz * 0.25} C ${cx + sz * 0.75} ${eyeY + sz * 0.65}, ${cx + sz * 0.75} ${eyeY - sz * 0.35}, ${cx} ${eyeY + sz * 0.25}`} fill="#E84A5F" stroke={STROKE} strokeWidth={s * 0.012} />
      )
      return (<>{heart(leftX)}{heart(rightX)}</>)
    }
    case 'surprised':
      return (
        <>
          <ellipse cx={leftX} cy={eyeY} rx={sz * 1.15} ry={sz * 1.05} fill={DARK} transform={`rotate(-6 ${leftX} ${eyeY})`} />
          <circle cx={leftX} cy={eyeY - sz * 0.05} r={sz * 0.72} fill={WHITE} />
          <circle cx={leftX} cy={eyeY + sz * 0.02} r={sz * 0.45} fill={DARK} />
          <circle cx={leftX + sz * 0.18} cy={eyeY - sz * 0.22} r={sz * 0.22} fill={WHITE} />
          <circle cx={leftX - sz * 0.12} cy={eyeY + sz * 0.18} r={sz * 0.11} fill={WHITE} opacity={0.8} />
          <ellipse cx={rightX} cy={eyeY} rx={sz * 1.15} ry={sz * 1.05} fill={DARK} transform={`rotate(6 ${rightX} ${eyeY})`} />
          <circle cx={rightX} cy={eyeY - sz * 0.05} r={sz * 0.72} fill={WHITE} />
          <circle cx={rightX} cy={eyeY + sz * 0.02} r={sz * 0.45} fill={DARK} />
          <circle cx={rightX + sz * 0.18} cy={eyeY - sz * 0.22} r={sz * 0.22} fill={WHITE} />
          <circle cx={rightX - sz * 0.12} cy={eyeY + sz * 0.18} r={sz * 0.11} fill={WHITE} opacity={0.8} />
        </>
      )
    case 'angry':
    case 'debate': {
      const angryEye = (cx: number, sx: number) => (
        <>
          <line x1={cx - sx} y1={eyeY - sz * 0.65} x2={cx + sx * 0.4} y2={eyeY + sz * 0.25}
            stroke={STROKE} strokeWidth={s * 0.028} strokeLinecap="round" />
          <ellipse cx={cx} cy={eyeY + sz * 0.25} rx={sz * 0.65} ry={sz * 0.55} fill={DARK} />
          <circle cx={cx - sx * 0.15} cy={eyeY + sz * 0.15} r={sz * 0.22} fill={WHITE} />
          <circle cx={cx - sx * 0.12} cy={eyeY + sz * 0.12} r={sz * 0.1} fill={WHITE} opacity={0.7} />
        </>
      )
      return (<>{angryEye(leftX, sz)}{angryEye(rightX, -sz)}</>)
    }
    case 'thinking':
    case 'curious':
    case 'confused': {
      const thinkEye = (cx: number, rot: number, ry: number) => (
        <>
          <ellipse cx={cx} cy={eyeY} rx={sz * 0.92} ry={sz * ry} fill={DARK} transform={`rotate(${rot} ${cx} ${eyeY})`} />
          <circle cx={cx} cy={eyeY - sz * 0.05} r={sz * 0.50} fill={WHITE} />
          <circle cx={cx - sz * 0.05} cy={eyeY + sz * 0.02} r={sz * 0.28} fill={DARK} />
          <circle cx={cx + sz * 0.12} cy={eyeY - sz * 0.18} r={sz * 0.14} fill={WHITE} />
        </>
      )
      return (<>{thinkEye(leftX, -6, 0.58)}{thinkEye(rightX, 6, 0.68)}</>)
    }
    case 'shy': {
      const shyEye = (cx: number, rot: number) => (
        <>
          <ellipse cx={cx} cy={eyeY + sz * 0.12} rx={sz * 0.88} ry={sz * 0.68} fill={DARK} transform={`rotate(${rot} ${cx} ${eyeY})`} />
          <circle cx={cx + sz * 0.12} cy={eyeY + sz * 0.22} r={sz * 0.45} fill={WHITE} />
          <circle cx={cx + sz * 0.18} cy={eyeY + sz * 0.28} r={sz * 0.25} fill={DARK} />
          <circle cx={cx + sz * 0.22} cy={eyeY + sz * 0.18} r={sz * 0.12} fill={WHITE} />
        </>
      )
      return (<>{shyEye(leftX, -6)}{shyEye(rightX, 6)}</>)
    }
    case 'dizzy':
      return (
        <>
          <text x={leftX - sz * 0.45} y={eyeY + sz * 0.35} fontSize={sz * 1.4} fill={DARK} fontWeight="bold" fontFamily="sans-serif">×</text>
          <text x={rightX - sz * 0.45} y={eyeY + sz * 0.35} fontSize={sz * 1.4} fill={DARK} fontWeight="bold" fontFamily="sans-serif">×</text>
        </>
      )
    default:
      return (<>{normalEye(leftX, -12)}{normalEye(rightX, 12)}</>)
  }
}

/** 根据 mood 渲染嘴巴 — ω 萌嘴风格 */
function renderMouth(s: number, mood: HermesMood) {
  const mx = s * 0.50, my = s * 0.455, w = s * 0.10

  switch (mood) {
    case 'happy':
    case 'dancing':
    case 'waving':
    case 'eureka':
    case 'inspired':
    case 'love':
      // 大大的 D 形笑
      return <path d={`M ${mx - w} ${my} Q ${mx} ${my + w * 1.8} ${mx + w} ${my}`}
        stroke={STROKE} strokeWidth={s * 0.026} strokeLinecap="round" fill="none" />
    case 'surprised':
      return <ellipse cx={mx} cy={my + s * 0.012} rx={s * 0.025} ry={s * 0.035} fill={DARK} />
    case 'thinking':
    case 'curious':
    case 'confused':
      return <path d={`M ${mx - w * 0.6} ${my + s * 0.008} Q ${mx} ${my - s * 0.012} ${mx + w * 0.6} ${my + s * 0.008}`}
        stroke={STROKE} strokeWidth={s * 0.020} strokeLinecap="round" fill="none" />
    case 'angry':
    case 'debate':
      return <path d={`M ${mx - w * 0.7} ${my + s * 0.025} Q ${mx} ${my - s * 0.015} ${mx + w * 0.7} ${my + s * 0.025}`}
        stroke={STROKE} strokeWidth={s * 0.024} strokeLinecap="round" fill="none" />
    case 'sleepy':
    case 'bored':
      return <ellipse cx={mx} cy={my + s * 0.005} rx={s * 0.018} ry={s * 0.014} fill={DARK} />
    case 'shy':
      // ω 形小嘴
      return <path d={`M ${mx - w * 0.5} ${my} Q ${mx - w * 0.15} ${my + w * 0.6} ${mx} ${my + w * 0.3} Q ${mx + w * 0.15} ${my + w * 0.6} ${mx + w * 0.5} ${my}`}
        stroke={STROKE} strokeWidth={s * 0.020} strokeLinecap="round" fill="none" />
    case 'dizzy':
      return <path d={`M ${mx - w} ${my} Q ${mx - w * 0.5} ${my + s * 0.025} ${mx} ${my} Q ${mx + w * 0.5} ${my - s * 0.025} ${mx + w} ${my}`}
        stroke={STROKE} strokeWidth={s * 0.020} strokeLinecap="round" fill="none" />
    default:
      // 默认 ω 萌嘴
      return <path d={`M ${mx - w * 0.65} ${my} Q ${mx - w * 0.2} ${my + w * 0.7} ${mx} ${my + w * 0.4} Q ${mx + w * 0.2} ${my + w * 0.7} ${mx + w * 0.65} ${my}`}
        stroke={STROKE} strokeWidth={s * 0.022} strokeLinecap="round" fill="none" />
  }
}

/** 腮红透明度和颜色 */
function getBlushProps(mood: HermesMood): { opacity: number; color: string } {
  switch (mood) {
    case 'love':
    case 'shy':
      return { opacity: 0.7, color: '255,130,150' }
    case 'angry':
    case 'debate':
      return { opacity: 0.55, color: '255,110,90' }
    case 'happy':
    case 'dancing':
    case 'waving':
    case 'eureka':
      return { opacity: 0.5, color: '255,150,165' }
    case 'sleepy':
    case 'bored':
      return { opacity: 0.25, color: '180,180,210' }
    default:
      return { opacity: 0.4, color: '255,160,175' }
  }
}

/** 渲染手臂 */
function renderArms(s: number, _mood: HermesMood, isWaving: boolean, isDancing: boolean) {
  const leftArmClass = isWaving ? 'animate-hermes-wave-left' : isDancing ? 'animate-hermes-dance' : ''
  return (
    <>
      <g className={cn(leftArmClass)} style={{ transformOrigin: `${s * 0.28}px ${s * 0.58}px`, animationDuration: isDancing ? '0.9s' : undefined }}>
        <ellipse cx={s * 0.28} cy={s * 0.66} rx={s * 0.05} ry={s * 0.07} fill={DARK} />
      </g>
      <g className={cn(isDancing && 'animate-hermes-dance')} style={{ transformOrigin: `${s * 0.72}px ${s * 0.58}px`, animationDuration: isDancing ? '0.9s' : undefined, animationDelay: isDancing ? '0.45s' : undefined }}>
        <ellipse cx={s * 0.72} cy={s * 0.66} rx={s * 0.05} ry={s * 0.07} fill={DARK} />
      </g>
    </>
  )
}

/** 主 SVG 熊猫渲染 — Kakao Friends 粗描边 Q 版风格 */
function PandaSVG({
  size,
  mood,
  blinking,
  isWaving,
  isDancing,
}: {
  size: number
  mood: HermesMood
  blinking: boolean
  isWaving: boolean
  isDancing: boolean
}) {
  const s = size
  const { opacity, color } = getBlushProps(mood)
  const sw = STROKE_W(s)

  return (
    <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} className="drop-shadow-md">
      {/* 底部阴影 */}
      <ellipse cx={s * 0.5} cy={s * 0.92} rx={s * 0.24} ry={s * 0.032} fill="rgba(0,0,0,0.08)" />

      {/* 脚 */}
      <ellipse cx={s * 0.36} cy={s * 0.82} rx={s * 0.07} ry={s * 0.055} fill={DARK} stroke={STROKE} strokeWidth={sw} />
      <ellipse cx={s * 0.64} cy={s * 0.82} rx={s * 0.07} ry={s * 0.055} fill={DARK} stroke={STROKE} strokeWidth={sw} />

      {/* 身体 — 更圆润的水滴形 */}
      <ellipse cx={s * 0.5} cy={s * 0.62} rx={s * 0.23} ry={s * 0.16} fill={DARK} stroke={STROKE} strokeWidth={sw} />
      {/* 肚子 — 更大更明显 */}
      <ellipse cx={s * 0.5} cy={s * 0.63} rx={s * 0.15} ry={s * 0.12} fill="#faf8f5" stroke={STROKE} strokeWidth={sw * 0.6} />

      {/* 耳朵 — 更大更圆，位置更高 */}
      <g className={cn(mood === 'happy' && 'animate-hermes-wiggle')} style={{ transformOrigin: `${s * 0.18}px ${s * 0.14}px` }}>
        <ellipse cx={s * 0.18} cy={s * 0.14} rx={s * 0.10} ry={s * 0.09} fill={DARK} stroke={STROKE} strokeWidth={sw} />
        <ellipse cx={s * 0.18} cy={s * 0.15} rx={s * 0.06} ry={s * 0.05} fill="#3d3d4a" />
      </g>
      <g className={cn(mood === 'happy' && 'animate-hermes-wiggle')} style={{ transformOrigin: `${s * 0.82}px ${s * 0.14}px`, animationDelay: '0.15s' }}>
        <ellipse cx={s * 0.82} cy={s * 0.14} rx={s * 0.10} ry={s * 0.09} fill={DARK} stroke={STROKE} strokeWidth={sw} />
        <ellipse cx={s * 0.82} cy={s * 0.15} rx={s * 0.06} ry={s * 0.05} fill="#3d3d4a" />
      </g>

      {/* 头部 — 接近正圆的大圆球 */}
      <ellipse cx={s * 0.5} cy={s * 0.35} rx={s * 0.28} ry={s * 0.26} fill={WHITE} stroke={STROKE} strokeWidth={sw} />
      {/* 头部下方柔和阴影 */}
      <ellipse cx={s * 0.5} cy={s * 0.54} rx={s * 0.20} ry={s * 0.06} fill="#f0ece5" opacity={0.5} />

      {/* 眼睛 */}
      {renderEyes(s, mood, blinking)}

      {/* 鼻子 — 稍微下移，倒三角 */}
      <ellipse cx={s * 0.50} cy={s * 0.445} rx={s * 0.035} ry={s * 0.025} fill={DARK} />
      <ellipse cx={s * 0.495} cy={s * 0.438} rx={s * 0.012} ry={s * 0.006} fill="white" opacity={0.6} />

      {/* 嘴巴 */}
      {renderMouth(s, mood)}

      {/* 腮红 — 更大更圆，像一团粉色 */}
      <ellipse cx={s * 0.24} cy={s * 0.42} rx={s * 0.075} ry={s * 0.05} fill={`rgba(${color},${opacity})`} />
      <ellipse cx={s * 0.76} cy={s * 0.42} rx={s * 0.075} ry={s * 0.05} fill={`rgba(${color},${opacity})`} />

      {/* 手臂 */}
      {renderArms(s, mood, isWaving, isDancing)}
    </svg>
  )
}

/* ============================================================
   HermesAvatar 主组件
   ============================================================ */


export function HermesAvatar({
  size = 56,
  mood: controlledMood,
  onClick,
  className,
  interactive = true,
  isDragging = false,
  command,
}: HermesAvatarProps) {
  const [internalMood, setInternalMood] = useState<HermesMood>('idle')
  const [speechBubble, setSpeechBubble] = useState<string | null>(null)
  const [clickCount, setClickCount] = useState(0)
  const [isBouncing, setIsBouncing] = useState(false)
  const [isDancing, setIsDancing] = useState(false)
  const [isWaving, setIsWaving] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [headTilt, setHeadTilt] = useState(0)
  const [dizzyStars, setDizzyStars] = useState(false)
  const [blinking, setBlinking] = useState(false)

  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastInteractRef = useRef<number>(Date.now())
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartTimeRef = useRef<number>(0)
  const commandTimerRef = useRef<NodeJS.Timeout | null>(null)
  const prevCommandRef = useRef<AvatarCommand | undefined>(undefined)
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null)
  const moodRef = useRef<HermesMood>('idle')

  const mood = controlledMood || internalMood

  // 同步 mood 到 ref
  useEffect(() => {
    moodRef.current = mood
  }, [mood])

  /* ============ 工具函数 ============ */
  const resetAction = useCallback(() => {
    setIsDancing(false)
    setIsWaving(false)
    setIsBouncing(false)
    setInternalMood('idle')
  }, [])

  /** 根据气泡文本触发匹配的可爱小动作 */
  const triggerMiniActionFromText = useCallback((text: string, duration: number) => {
    // 只在 idle 状态下触发，避免覆盖外部命令或已有动作
    if (moodRef.current !== 'idle') return

    const t = text.toLowerCase()
    let actionTimer: NodeJS.Timeout | null = null

    if (t.includes('茶') || t.includes('tea') || t.includes('喝')) {
      setInternalMood('tea_time')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('睡') || t.includes('困') || t.includes('休息') || t.includes('累') || t.includes('zzz')) {
      setInternalMood('sleepy')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('爱') || t.includes('喜欢') || t.includes('么么') || t.includes('❤') || t.includes('♥') || t.includes('💗')) {
      setInternalMood('love')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('舞') || t.includes('跳') || t.includes('摇摆') || t.includes('舞王') || t.includes('音乐') || t.includes('🎵')) {
      setIsDancing(true)
      setInternalMood('dancing')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('开心') || t.includes('棒') || t.includes('加油') || t.includes('好心情') || t.includes('好棒') || t.includes('赞') || t.includes('✨') || t.includes('耶')) {
      setIsBouncing(true)
      setInternalMood('happy')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('学习') || t.includes('读书') || t.includes('知识') || t.includes('📚') || t.includes('书')) {
      setInternalMood('studying')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('发现') || t.includes('原来') || t.includes('答案') || t.includes('恍然大悟')) {
      setIsBouncing(true)
      setInternalMood('eureka')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('思考') || t.includes('想') || t.includes('🤔') || t.includes('？') || t.includes('?')) {
      setInternalMood('thinking')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('争论') || t.includes('辩论') || t.includes('辩')) {
      setInternalMood('debate')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('灵感') || t.includes('主意') || t.includes('💡')) {
      setInternalMood('inspired')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('洞察') || t.includes('观察') || t.includes('🔍')) {
      setInternalMood('insight')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('挥手') || t.includes('嗨') || t.includes('hello') || t.includes('hi') || t.includes('👋') || t.includes('你好')) {
      setIsWaving(true)
      setInternalMood('waving')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('生气') || t.includes('哼') || t.includes('😠')) {
      setInternalMood('angry')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('害羞') || t.includes('羞') || t.includes('😳')) {
      setInternalMood('shy')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('惊讶') || t.includes('哇') || t.includes('啊') || t.includes('😲')) {
      setInternalMood('surprised')
      actionTimer = setTimeout(resetAction, duration)
    }

    if (actionTimer) {
      commandTimerRef.current = actionTimer
    }
  }, [resetAction])

  const showBubble = useCallback((text?: string, duration = 2500) => {
    setSpeechBubble(text || null)
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    if (text) {
      bubbleTimerRef.current = setTimeout(() => setSpeechBubble(null), duration)
      // 根据气泡文本触发匹配小动作
      triggerMiniActionFromText(text, duration)
    }
  }, [triggerMiniActionFromText])

  const resetIdleTimer = useCallback(() => {
    lastInteractRef.current = Date.now()
  }, [])

  /* ============ 自动眨眼 ============ */
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 3500
      blinkTimerRef.current = setTimeout(() => {
        setBlinking(true)
        setTimeout(() => setBlinking(false), 150)
        scheduleBlink()
      }, delay)
    }
    scheduleBlink()
    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current)
    }
  }, [])

  /* ============ 外部命令处理 ============ */
  useEffect(() => {
    if (!command || command === prevCommandRef.current) return
    prevCommandRef.current = command

    if (commandTimerRef.current) {
      clearTimeout(commandTimerRef.current)
    }

    resetIdleTimer()

    const execute = () => {
      switch (command.action) {
        case 'wave':
          setIsWaving(true)
          setInternalMood('waving')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.greet), 2500)
          commandTimerRef.current = setTimeout(() => {
            setIsWaving(false)
            setInternalMood('idle')
          }, 1500)
          break

        case 'dance':
          setIsDancing(true)
          setInternalMood('dancing')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.dance), 2500)
          commandTimerRef.current = setTimeout(() => {
            setIsDancing(false)
            setInternalMood('idle')
          }, 2000)
          break

        case 'sleep':
          setInternalMood('sleepy')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.rest), 3000)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 2500)
          break

        case 'love':
          setInternalMood('love')
          showBubble(command.bubble || pickRandom(BUBBLES.love), 2500)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 2000)
          break

        case 'happy':
          setIsBouncing(true)
          setInternalMood('happy')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.encourage), 3000)
          commandTimerRef.current = setTimeout(() => {
            setIsBouncing(false)
            setInternalMood('idle')
          }, 1500)
          break

        case 'study':
          setInternalMood('studying')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.study), 2500)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 2000)
          break

        case 'insight':
          setInternalMood('insight')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.insight), 2500)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 2000)
          break

        case 'confused':
          setInternalMood('confused')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.confused), 2500)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 2000)
          break

        case 'tea':
          setInternalMood('tea_time')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.tea), 2500)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 2000)
          break

        case 'inspired':
          setInternalMood('inspired')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.inspired), 2500)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 2000)
          break

        case 'debate':
          setInternalMood('debate')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.debate), 2500)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 2000)
          break

        case 'eureka':
          setIsBouncing(true)
          setInternalMood('eureka')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.eureka), 2500)
          commandTimerRef.current = setTimeout(() => {
            setIsBouncing(false)
            setInternalMood('idle')
          }, 2000)
          break

        case 'tea_sip':
          setInternalMood('tea_sipping')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.tea_sip), 2500)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 2000)
          break

        case 'random': {
          const actions: (() => void)[] = [
            () => {
              setIsWaving(true)
              setInternalMood('waving')
              showBubble('猜猜我要做什么？👋', 2000)
              commandTimerRef.current = setTimeout(() => {
                setIsWaving(false)
                setInternalMood('idle')
              }, 1500)
            },
            () => {
              setIsDancing(true)
              setInternalMood('dancing')
              showBubble('随机舞王登场！💃', 2000)
              commandTimerRef.current = setTimeout(() => {
                setIsDancing(false)
                setInternalMood('idle')
              }, 2000)
            },
            () => {
              setInternalMood('love')
              showBubble(pickRandom(BUBBLES.love), 2000)
              commandTimerRef.current = setTimeout(() => {
                setInternalMood('idle')
              }, 2000)
            },
            () => {
              setIsBouncing(true)
              setInternalMood('happy')
              showBubble(pickRandom(BUBBLES.comfort.encourage), 2500)
              commandTimerRef.current = setTimeout(() => {
                setIsBouncing(false)
                setInternalMood('idle')
              }, 1200)
            },
            () => {
              setInternalMood('curious')
              showBubble('咦？这是什么？🤔', 1500)
              commandTimerRef.current = setTimeout(() => {
                setInternalMood('idle')
              }, 1500)
            },
            () => {
              setInternalMood('insight')
              showBubble(pickRandom(BUBBLES.comfort.insight), 2000)
              commandTimerRef.current = setTimeout(() => {
                setInternalMood('idle')
              }, 2000)
            },
            () => {
              setInternalMood('tea_time')
              showBubble(pickRandom(BUBBLES.comfort.tea), 2000)
              commandTimerRef.current = setTimeout(() => {
                setInternalMood('idle')
              }, 2000)
            },
            () => {
              setInternalMood('eureka')
              showBubble(pickRandom(BUBBLES.comfort.eureka), 2000)
              commandTimerRef.current = setTimeout(() => {
                setInternalMood('idle')
              }, 2000)
            },
          ]
          pickRandom(actions)()
          break
        }
      }
    }

    execute()
  }, [command, showBubble, resetIdleTimer])

  /* ============ 鼠标交互 ============ */
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    resetIdleTimer()
    if (Math.random() > 0.5 && !speechBubble) {
      showBubble(pickRandom(BUBBLES.hover), 2000)
    }
    if (mood === 'idle') {
      setHeadTilt(Math.random() > 0.5 ? 10 : -10)
      setTimeout(() => setHeadTilt(0), 800)
    }
  }, [resetIdleTimer, showBubble, speechBubble, mood])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setHeadTilt(0)
  }, [])

  /* ============ 拖拽反应 ============ */
  useEffect(() => {
    if (isDragging) {
      dragStartTimeRef.current = Date.now()
      setInternalMood('surprised')
      showBubble(pickRandom(BUBBLES.drag), 1500)
      resetIdleTimer()
    } else {
      const dragDuration = Date.now() - dragStartTimeRef.current
      if (dragDuration > 800) {
        setInternalMood('dizzy')
        setDizzyStars(true)
        showBubble(pickRandom(BUBBLES.dizzy), 2000)
        setTimeout(() => {
          setDizzyStars(false)
          setInternalMood('idle')
        }, 2000)
      } else {
        setInternalMood('idle')
      }
    }
  }, [isDragging, showBubble, resetIdleTimer])

  /* ============ 空闲自动小动作 ============ */
  useEffect(() => {
    const checkIdle = () => {
      const elapsed = Date.now() - lastInteractRef.current

      if (elapsed > 45000 && mood === 'idle' && !isDragging && !controlledMood) {
        const actions: (() => void)[] = [
          () => {
            setInternalMood('bored')
            showBubble('哈~ 欠~ 🥱', 2000)
            setTimeout(() => setInternalMood('idle'), 2000)
          },
          () => {
            setHeadTilt(15)
            setTimeout(() => setHeadTilt(-15), 400)
            setTimeout(() => setHeadTilt(0), 800)
          },
          () => {
            showBubble(pickRandom(BUBBLES.idle), 3000)
          },
          () => {
            setInternalMood('sleepy')
            showBubble('Zzz... 好困...', 2500)
            setTimeout(() => setInternalMood('idle'), 2500)
          },
          () => {
            setInternalMood('love')
            showBubble(pickRandom(BUBBLES.love), 2000)
            setTimeout(() => setInternalMood('idle'), 2000)
          },
          () => {
            setInternalMood('curious')
            showBubble('嗯？什么声音？', 1500)
            setTimeout(() => setInternalMood('idle'), 1500)
          },
          () => {
            setInternalMood('tea_time')
            showBubble('来杯茶怎么样？🍵', 2000)
            setTimeout(() => setInternalMood('idle'), 2000)
          },
        ]
        pickRandom(actions)()
      }
    }

    idleTimerRef.current = setInterval(checkIdle, 15000)
    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
    }
  }, [mood, isDragging, controlledMood, showBubble, resetIdleTimer])

  /* ============ 点击交互 ============ */
  const doWave = useCallback(() => {
    setIsWaving(true)
    setInternalMood('waving')
    showBubble('嗨~ 我在这里！👋')
    setTimeout(() => {
      setIsWaving(false)
      setInternalMood('idle')
    }, 1200)
  }, [showBubble])

  const doDance = useCallback(() => {
    setIsDancing(true)
    setInternalMood('dancing')
    showBubble('啦啦啦~ 看我跳舞！💃')
    setTimeout(() => {
      setIsDancing(false)
      setInternalMood('idle')
    }, 1800)
  }, [showBubble])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      resetIdleTimer()
      if (!interactive) {
        onClick?.()
        return
      }

      const nextCount = clickCount + 1
      setClickCount(nextCount)

      if (nextCount % 3 === 1) {
        setIsBouncing(true)
        setInternalMood('happy')
        showBubble(pickRandom(BUBBLES.greeting))
        setTimeout(() => {
          setIsBouncing(false)
          setInternalMood('idle')
        }, 600)
      } else if (nextCount % 3 === 2) {
        doWave()
      } else {
        doDance()
      }

      onClick?.()
    },
    [clickCount, interactive, onClick, showBubble, doWave, doDance, resetIdleTimer]
  )

  /* ============ 右键菜单 ============ */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive) return
      e.preventDefault()
      resetIdleTimer()
      const actions = [
        doWave,
        doDance,
        () => {
          setInternalMood('sleepy')
          showBubble('Zzz... 我要睡觉觉了~')
          setTimeout(() => setInternalMood('idle'), 2000)
        },
        () => {
          setInternalMood('angry')
          showBubble('哼！别戳我！')
          setTimeout(() => setInternalMood('idle'), 1500)
        },
        () => {
          setInternalMood('shy')
          showBubble('哎呀，羞羞~')
          setTimeout(() => setInternalMood('idle'), 1500)
        },
        () => {
          setInternalMood('love')
          showBubble(pickRandom(BUBBLES.love))
          setTimeout(() => setInternalMood('idle'), 2000)
        },
        () => {
          setInternalMood('tea_time')
          showBubble('来喝杯茶吧~ 🍵')
          setTimeout(() => setInternalMood('idle'), 2000)
        },
        () => {
          setInternalMood('insight')
          showBubble('我好像发现了什么！🔍')
          setTimeout(() => setInternalMood('idle'), 2000)
        },
      ]
      pickRandom(actions)()
    },
    [interactive, doWave, doDance, showBubble, resetIdleTimer]
  )

  /* ============ 受控 mood 恢复 ============ */
  useEffect(() => {
    if (controlledMood === 'thinking') {
      const timer = setTimeout(() => setInternalMood('idle'), 5000)
      return () => clearTimeout(timer)
    }
  }, [controlledMood])

  /* ============ 清理 ============ */
  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
      if (commandTimerRef.current) clearTimeout(commandTimerRef.current)
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current)
    }
  }, [])

  const s = size

  // 动画类名
  const animationClass = isDancing
    ? 'animate-hermes-dance'
    : isBouncing
      ? 'animate-hermes-bounce'
      : mood === 'dizzy'
        ? 'animate-hermes-dizzy'
        : mood === 'idle' && !isWaving && !isDragging && !isBouncing
          ? 'animate-hermes-float'
          : ''

  const bodyShake = mood === 'angry' || mood === 'debate' ? 'animate-hermes-shake' : ''

  const isCheerful =
    mood === 'happy' || mood === 'dancing' || mood === 'waving' || mood === 'eureka' || mood === 'inspired'
  const isSleepy = mood === 'sleepy' || mood === 'bored'
  const isThinking = mood === 'thinking' || mood === 'confused' || mood === 'curious'

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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: s,
        height: s,
        transform: headTilt !== 0 ? `rotate(${headTilt}deg)` : undefined,
      }}
      title="点击我呀~（双击也有惊喜）"
    >
      {/* ====== 对话气泡 ====== */}
      {speechBubble && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap">
          <div className="bg-white/95 text-gray-700 text-[11px] px-3 py-1.5 rounded-xl shadow-lg border border-gray-100 animate-scale-in relative backdrop-blur-sm">
            {speechBubble}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45" />
          </div>
        </div>
      )}

      {/* ====== 纯 SVG 可爱熊猫 ====== */}
      <PandaSVG
        size={size}
        mood={mood}
        blinking={blinking}
        isWaving={isWaving}
        isDancing={isDancing}
      />

      {/* ====== 开心/跳舞/灵感时的星星 ====== */}
      {isCheerful && (
        <>
          <span className="absolute -top-1 -left-1 text-xs animate-hermes-twinkle pointer-events-none z-20">✦</span>
          <span className="absolute -top-1 -right-1 text-[10px] animate-hermes-twinkle pointer-events-none z-20" style={{ animationDelay: '0.2s' }}>★</span>
          <span className="absolute top-1/2 -right-2 text-[9px] animate-hermes-twinkle pointer-events-none z-20" style={{ animationDelay: '0.4s' }}>✨</span>
        </>
      )}

      {/* ====== 爱心飘浮 ====== */}
      {mood === 'love' && (
        <>
          <span className="absolute -top-2 -left-2 text-sm text-red-400 animate-hermes-float-heart pointer-events-none z-20">♥</span>
          <span className="absolute -top-1 -right-2 text-xs text-red-400 animate-hermes-float-heart pointer-events-none z-20" style={{ animationDelay: '0.3s' }}>♥</span>
          <span className="absolute -top-3 left-0 text-[10px] text-pink-400 animate-hermes-float-heart pointer-events-none z-20" style={{ animationDelay: '0.6s' }}>♥</span>
        </>
      )}

      {/* ====== 害羞 ====== */}
      {mood === 'shy' && (
        <>
          <span className="absolute -top-1 -left-1 text-xs text-pink-300 animate-hermes-pulse pointer-events-none z-20">💗</span>
          <span className="absolute -top-1 -right-1 text-[10px] text-pink-300 animate-hermes-pulse pointer-events-none z-20" style={{ animationDelay: '0.3s' }}>💗</span>
        </>
      )}

      {/* ====== 睡觉 Zzz ====== */}
      {isSleepy && (
        <>
          <span className="absolute -top-2 right-0 text-xs text-blue-300 animate-hermes-pulse pointer-events-none z-20">z</span>
          <span className="absolute -top-4 right-2 text-[9px] text-blue-300 animate-hermes-pulse pointer-events-none z-20" style={{ animationDelay: '0.3s' }}>z</span>
          <span className="absolute -top-6 right-4 text-[8px] text-blue-200 animate-hermes-pulse pointer-events-none z-20" style={{ animationDelay: '0.6s' }}>z</span>
        </>
      )}

      {/* ====== 无聊叹气 ====== */}
      {mood === 'bored' && (
        <span className="absolute -top-2 right-0 text-[10px] text-gray-400 animate-hermes-pulse pointer-events-none z-20">...</span>
      )}

      {/* ====== 思考问号 ====== */}
      {isThinking && (
        <>
          <span className="absolute -top-2 right-0 text-sm text-amber-500 font-bold animate-hermes-pulse pointer-events-none z-20">?</span>
          <span className="absolute -top-4 right-3 text-[10px] text-amber-400 animate-hermes-pulse pointer-events-none z-20" style={{ animationDelay: '0.2s' }}>?</span>
        </>
      )}

      {/* ====== 灵感灯泡 ====== */}
      {mood === 'inspired' && (
        <span className="absolute -top-3 right-0 text-base animate-hermes-pulse pointer-events-none z-20">💡</span>
      )}

      {/* ====== 茶壶 ====== */}
      {mood === 'tea_time' && (
        <span className="absolute -top-2 right-0 text-sm animate-hermes-bounce pointer-events-none z-20">🍵</span>
      )}

      {/* ====== 放大镜 ====== */}
      {mood === 'insight' && (
        <span className="absolute -top-2 right-0 text-sm animate-hermes-pulse pointer-events-none z-20">🔍</span>
      )}

      {/* ====== 辩论书本 ====== */}
      {mood === 'debate' && (
        <span className="absolute -top-2 right-0 text-sm animate-hermes-pulse pointer-events-none z-20">📖</span>
      )}

      {/* ====== 眩晕星星 ====== */}
      {dizzyStars && (
        <>
          <span className="absolute top-0 left-0 text-sm text-amber-400 animate-hermes-dizzy-star pointer-events-none z-20">★</span>
          <span className="absolute top-0 right-0 text-xs text-amber-400 animate-hermes-dizzy-star pointer-events-none z-20" style={{ animationDelay: '0.2s' }}>✦</span>
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-amber-400 animate-hermes-dizzy-star pointer-events-none z-20" style={{ animationDelay: '0.4s' }}>★</span>
        </>
      )}

      {/* ====== 惊喜 ====== */}
      {mood === 'surprised' && (
        <>
          <span className="absolute -top-1 -left-1 text-xs animate-hermes-pulse pointer-events-none z-20">❗</span>
          <span className="absolute -top-1 -right-1 text-[10px] animate-hermes-pulse pointer-events-none z-20" style={{ animationDelay: '0.15s' }}>❗</span>
        </>
      )}

      {/* ====== 悬浮提示 ====== */}
      {!controlledMood && !speechBubble && isHovered && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-tea-primary text-white px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none animate-scale-in">
          点击聊天~ 右键有菜单哦
        </span>
      )}
    </div>
  )
}
