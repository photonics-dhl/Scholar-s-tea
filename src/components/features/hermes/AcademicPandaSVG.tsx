'use client'

import { useMemo, useRef, useEffect, useState, useCallback } from 'react'

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

interface AcademicPandaSVGProps {
  mood: HermesMood
  size?: number
  interactive?: boolean
}

/* ================================================================
   增强版学术熊猫 SVG — Live2D 风格交互
   新增：眼睛跟随鼠标、自动眨眼、呼吸律动、耳朵微动
   ================================================================ */

const C = {
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: '#4A4A4A',
  blush: '#FFB6C1',
  blushDeep: '#FF9EB0',
  gold: '#D4A853',
  cap: '#2C2C2C',
  glasses: '#5C4A3A',
  glassesRim: '#8B7355',
}

/* ============ 眼睛跟随鼠标核心逻辑 ============ */
function useEyeTracking(svgRef: React.RefObject<SVGSVGElement | null>, enabled: boolean) {
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 })
  const [isBlinking, setIsBlinking] = useState(false)
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null)
  const trackingRef = useRef({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!svgRef.current || !enabled) return
    const rect = svgRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const dx = e.clientX - centerX
    const dy = e.clientY - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxOffset = 3.5 // 瞳孔最大偏移量
    const maxDistance = 400 // 影响半径

    const factor = Math.min(distance / maxDistance, 1)
    const angle = Math.atan2(dy, dx)

    trackingRef.current = {
      x: Math.cos(angle) * maxOffset * factor,
      y: Math.sin(angle) * maxOffset * factor,
    }

    setPupilOffset(trackingRef.current)
  }, [enabled, svgRef])

  // 自动眨眼
  useEffect(() => {
    if (!enabled) return

    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 4000 // 2-6秒随机间隔
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true)
        setTimeout(() => setIsBlinking(false), 120)
        scheduleBlink()
      }, delay)
    }

    scheduleBlink()
    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setPupilOffset({ x: 0, y: 0 })
      return
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [enabled, handleMouseMove])

  return { pupilOffset, isBlinking }
}

/* ============ 基础部件 ============ */

function HeadBase({ isBreathing }: { isBreathing: boolean }) {
  return (
    <g className={isBreathing ? 'animate-hermes-breathe-origin' : ''} style={{ transformOrigin: '50px 56px' }}>
      <circle cx="50" cy="56" r="32" fill={C.white} />
    </g>
  )
}

function Ears({ earWiggle }: { earWiggle: number }) {
  return (
    <g>
      {/* 左耳 */}
      <g style={{ transformOrigin: '22px 30px', transform: `rotate(${earWiggle}deg)` }}>
        <ellipse cx="22" cy="30" rx="10" ry="12" fill={C.black} />
        <ellipse cx="22" cy="32" rx="5" ry="6" fill="#333" />
      </g>
      {/* 右耳 */}
      <g style={{ transformOrigin: '78px 30px', transform: `rotate(${-earWiggle}deg)` }}>
        <ellipse cx="78" cy="30" rx="10" ry="12" fill={C.black} />
        <ellipse cx="78" cy="32" rx="5" ry="6" fill="#333" />
      </g>
    </g>
  )
}

function EyePatches() {
  return (
    <g>
      <ellipse cx="36" cy="52" rx="11" ry="13" fill={C.black} />
      <ellipse cx="64" cy="52" rx="11" ry="13" fill={C.black} />
    </g>
  )
}

/** 动态瞳孔 — 支持跟随鼠标 */
function Pupil({ cx, cy, offsetX, offsetY, isBlinking, surprised = false }: {
  cx: number; cy: number; offsetX: number; offsetY: number; isBlinking: boolean; surprised?: boolean
}) {
  const r = surprised ? 4 : 3.5
  return (
    <g>
      <circle
        cx={cx + offsetX}
        cy={cy + offsetY}
        r={r}
        fill={C.black}
        style={{
          transition: 'r 0.3s ease',
          transformOrigin: `${cx}px ${cy}px`,
          transform: isBlinking ? 'scaleY(0.05)' : 'scaleY(1)',
          transitionProperty: 'transform',
          transitionDuration: '0.08s',
        }}
      />
      {/* 高光 */}
      <circle
        cx={cx + offsetX + 1.5}
        cy={cy + offsetY - 2}
        r={1.8}
        fill={C.white}
        style={{
          opacity: isBlinking ? 0 : 1,
          transition: 'opacity 0.08s',
        }}
      />
    </g>
  )
}

function EyesNormal({ offsetX, offsetY, isBlinking }: { offsetX: number; offsetY: number; isBlinking: boolean }) {
  return (
    <g>
      {/* 左眼白 */}
      <circle cx="36" cy="52" r="6.5" fill={C.white} />
      <Pupil cx={36} cy={52} offsetX={offsetX} offsetY={offsetY} isBlinking={isBlinking} />
      {/* 右眼白 */}
      <circle cx="64" cy="52" r="6.5" fill={C.white} />
      <Pupil cx={64} cy={52} offsetX={offsetX} offsetY={offsetY} isBlinking={isBlinking} />
    </g>
  )
}

function EyesHappy() {
  return (
    <g>
      <path d="M 30 54 Q 36 48 42 54" fill="none" stroke={C.black} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 58 54 Q 64 48 70 54" fill="none" stroke={C.black} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  )
}

function EyesClosed() {
  return (
    <g>
      <path d="M 30 53 Q 36 56 42 53" fill="none" stroke={C.black} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 58 53 Q 64 56 70 53" fill="none" stroke={C.black} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  )
}

function EyesSurprised({ offsetX, offsetY, isBlinking }: { offsetX: number; offsetY: number; isBlinking: boolean }) {
  return (
    <g>
      <circle cx="36" cy="52" r="7.5" fill={C.white} />
      <Pupil cx={36} cy={52} offsetX={offsetX} offsetY={offsetY} isBlinking={isBlinking} surprised />
      <circle cx="64" cy="52" r="7.5" fill={C.white} />
      <Pupil cx={64} cy={52} offsetX={offsetX} offsetY={offsetY} isBlinking={isBlinking} surprised />
    </g>
  )
}

function EyesThinking({ offsetX, offsetY, isBlinking }: { offsetX: number; offsetY: number; isBlinking: boolean }) {
  return (
    <g>
      {/* 左眼 — 正常但往上看 */}
      <circle cx="36" cy="52" r="6.5" fill={C.white} />
      <Pupil cx={36} cy={52} offsetX={offsetX * 0.5} offsetY={offsetY - 1.5} isBlinking={isBlinking} />
      {/* 右眼 — 眯眼 */}
      <path d="M 58 53 Q 64 56 70 53" fill="none" stroke={C.black} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  )
}

function EyesLove() {
  return (
    <g>
      <path d="M 36 56 C 32 52, 30 48, 34 46 C 36 45, 36 48, 36 48 C 36 48, 36 45, 38 46 C 42 48, 40 52, 36 56Z" fill="#E85A5A" />
      <path d="M 64 56 C 60 52, 58 48, 62 46 C 64 45, 64 48, 64 48 C 64 48, 64 45, 66 46 C 70 48, 68 52, 64 56Z" fill="#E85A5A" />
    </g>
  )
}

function EyesAngry({ offsetX, offsetY, isBlinking }: { offsetX: number; offsetY: number; isBlinking: boolean }) {
  return (
    <g>
      <circle cx="36" cy="52" r="6.5" fill={C.white} />
      <Pupil cx={36} cy={52} offsetX={offsetX} offsetY={offsetY} isBlinking={isBlinking} />
      <path d="M 30 48 L 40 51" stroke={C.black} strokeWidth="2" strokeLinecap="round" />
      <circle cx="64" cy="52" r="6.5" fill={C.white} />
      <Pupil cx={64} cy={52} offsetX={offsetX} offsetY={offsetY} isBlinking={isBlinking} />
      <path d="M 70 48 L 60 51" stroke={C.black} strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

function EyesShy() {
  return (
    <g>
      <path d="M 30 52 Q 36 55 42 52" fill="none" stroke={C.black} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 58 52 Q 64 55 70 52" fill="none" stroke={C.black} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  )
}

function EyesSleepy() {
  return (
    <g>
      <path d="M 30 52 Q 36 55 42 52" fill="none" stroke={C.black} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 58 52 Q 64 55 70 52" fill="none" stroke={C.black} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  )
}

function EyesBored({ offsetX, offsetY, isBlinking }: { offsetX: number; offsetY: number; isBlinking: boolean }) {
  return (
    <g>
      <circle cx="36" cy="52" r="6.5" fill={C.white} />
      <Pupil cx={36} cy={52} offsetX={offsetX * 0.3} offsetY={offsetY} isBlinking={isBlinking} />
      <circle cx="64" cy="52" r="6.5" fill={C.white} />
      <Pupil cx={64} cy={52} offsetX={offsetX * 0.3} offsetY={offsetY} isBlinking={isBlinking} />
    </g>
  )
}

function EyesDizzy() {
  return (
    <g>
      <circle cx="36" cy="52" r="6.5" fill={C.white} />
      <path d="M 36 52 m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0" fill="none" stroke={C.black} strokeWidth="1.5" />
      <path d="M 36 52 m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0" fill="none" stroke={C.black} strokeWidth="1" />
      <circle cx="64" cy="52" r="6.5" fill={C.white} />
      <path d="M 64 52 m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0" fill="none" stroke={C.black} strokeWidth="1.5" />
      <path d="M 64 52 m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0" fill="none" stroke={C.black} strokeWidth="1" />
    </g>
  )
}

function EyesInspired({ offsetX, offsetY, isBlinking }: { offsetX: number; offsetY: number; isBlinking: boolean }) {
  return (
    <g>
      <circle cx="36" cy="52" r="7" fill={C.white} />
      <polygon points="36,47 37,50 40,50 38,52 39,55 36,53 33,55 34,52 32,50 35,50" fill="#FFD700" />
      <circle cx="64" cy="52" r="7" fill={C.white} />
      <polygon points="64,47 65,50 68,50 66,52 67,55 64,53 61,55 62,52 60,50 63,50" fill="#FFD700" />
    </g>
  )
}

function Glasses({ isThinking }: { isThinking?: boolean }) {
  return (
    <g style={{ opacity: isThinking ? 0.7 : 1, transition: 'opacity 0.3s' }}>
      <circle cx="36" cy="52" r="14" fill="none" stroke={C.glassesRim} strokeWidth="2" />
      <circle cx="36" cy="52" r="12.5" fill="none" stroke={C.glasses} strokeWidth="0.8" opacity="0.3" />
      <circle cx="64" cy="52" r="14" fill="none" stroke={C.glassesRim} strokeWidth="2" />
      <circle cx="64" cy="52" r="12.5" fill="none" stroke={C.glasses} strokeWidth="0.8" opacity="0.3" />
      <path d="M 46 54 Q 50 56 54 54" fill="none" stroke={C.glassesRim} strokeWidth="1.5" />
      <line x1="22" y1="52" x2="16" y2="48" stroke={C.glassesRim} strokeWidth="1.5" />
      <line x1="78" y1="52" x2="84" y2="48" stroke={C.glassesRim} strokeWidth="1.5" />
      <path d="M 30 44 Q 32 42 36 42" fill="none" stroke="white" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
      <path d="M 58 44 Q 60 42 64 42" fill="none" stroke="white" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
    </g>
  )
}

function Nose() {
  return <ellipse cx="50" cy="63" rx="3.5" ry="2.5" fill={C.black} />
}

function MouthSmile() {
  return <path d="M 44 68 Q 50 74 56 68" fill="none" stroke={C.black} strokeWidth="2" strokeLinecap="round" />
}

function MouthLaugh() {
  return (
    <g>
      <path d="M 43 68 Q 50 78 57 68" fill="none" stroke={C.black} strokeWidth="2" strokeLinecap="round" />
      <path d="M 46 71 Q 50 74 54 71" fill="none" stroke={C.black} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </g>
  )
}

function MouthO() {
  return <ellipse cx="50" cy="70" rx="4" ry="5" fill={C.black} />
}

function MouthFlat() {
  return <line x1="45" y1="70" x2="55" y2="70" stroke={C.black} strokeWidth="2" strokeLinecap="round" />
}

function MouthPout() {
  return <path d="M 46 70 Q 50 68 54 70" fill="none" stroke={C.black} strokeWidth="2" strokeLinecap="round" />
}

function MouthFrown() {
  return <path d="M 44 72 Q 50 68 56 72" fill="none" stroke={C.black} strokeWidth="2" strokeLinecap="round" />
}

function MouthWavy() {
  return <path d="M 44 70 Q 47 67 50 70 Q 53 73 56 70" fill="none" stroke={C.black} strokeWidth="2" strokeLinecap="round" />
}

function MouthSmallO() {
  return <ellipse cx="50" cy="70" rx="2.5" ry="3" fill={C.black} />
}

function Blush({ deep = false }: { deep?: boolean }) {
  const color = deep ? C.blushDeep : C.blush
  return (
    <g>
      <ellipse cx="27" cy="60" rx="5" ry="3" fill={color} opacity="0.6" />
      <ellipse cx="73" cy="60" rx="5" ry="3" fill={color} opacity="0.6" />
    </g>
  )
}

function GraduationCap() {
  return (
    <g>
      <ellipse cx="50" cy="18" rx="22" ry="5" fill={C.cap} />
      <ellipse cx="50" cy="17" rx="20" ry="4" fill="#3A3A3A" />
      <path d="M 32 16 L 50 4 L 68 16 L 50 12 Z" fill={C.cap} />
      <path d="M 32 16 L 50 4 L 50 12 L 32 16" fill="#3A3A3A" />
      <line x1="62" y1="8" x2="62" y2="22" stroke={C.gold} strokeWidth="1.5" />
      <circle cx="62" cy="23" r="2.5" fill={C.gold} />
      <path d="M 40 10 L 48 6" stroke="white" strokeWidth="1" opacity="0.2" strokeLinecap="round" />
    </g>
  )
}

function Body({ isBreathing }: { isBreathing: boolean }) {
  return (
    <g className={isBreathing ? 'animate-hermes-breathe-origin' : ''} style={{ transformOrigin: '50px 80px' }}>
      <ellipse cx="50" cy="86" rx="22" ry="12" fill={C.black} />
      <ellipse cx="50" cy="85" rx="14" ry="8" fill={C.white} />
    </g>
  )
}

/* ============ 手臂（新增互动部件） ============ */
function ArmLeft({ mood }: { mood: HermesMood }) {
  const isWaving = mood === 'waving'
  return (
    <g
      style={{
        transformOrigin: '28px 80px',
        transform: isWaving ? 'rotate(-25deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease',
      }}
    >
      <ellipse cx="26" cy="82" rx="7" ry="10" fill={C.black} opacity="0.9" />
      <ellipse cx="24" cy="88" rx="4" ry="5" fill={C.white} />
    </g>
  )
}

function ArmRight({ mood }: { mood: HermesMood }) {
  const isWaving = mood === 'waving'
  return (
    <g
      style={{
        transformOrigin: '72px 80px',
        transform: isWaving ? 'rotate(25deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease',
      }}
    >
      <ellipse cx="74" cy="82" rx="7" ry="10" fill={C.black} opacity="0.9" />
      <ellipse cx="76" cy="88" rx="4" ry="5" fill={C.white} />
    </g>
  )
}

/* ============ Mood → 配置映射 ============ */

interface MoodConfig {
  eyes: React.ReactNode
  mouth: React.ReactNode
  blush?: boolean
  blushDeep?: boolean
  showGlasses?: boolean
  isThinking?: boolean
  isBreathing?: boolean
}

function getMoodConfig(
  mood: HermesMood,
  pupilOffset: { x: number; y: number },
  isBlinking: boolean
): MoodConfig {
  const eyeProps = { offsetX: pupilOffset.x, offsetY: pupilOffset.y, isBlinking }

  switch (mood) {
    case 'idle':
    case 'studying':
    case 'tea_time':
    case 'tea_sipping':
      return { eyes: <EyesNormal {...eyeProps} />, mouth: <MouthSmile />, showGlasses: true, isBreathing: true }

    case 'waving':
      return { eyes: <EyesHappy />, mouth: <MouthLaugh />, blush: true, showGlasses: true }

    case 'happy':
    case 'dancing':
    case 'eureka':
      return { eyes: <EyesHappy />, mouth: <MouthLaugh />, blush: true, showGlasses: true }

    case 'thinking':
      return {
        eyes: <EyesThinking {...eyeProps} />,
        mouth: <MouthPout />,
        showGlasses: true,
        isThinking: true,
      }

    case 'insight':
    case 'curious':
    case 'confused':
      return { eyes: <EyesThinking {...eyeProps} />, mouth: <MouthPout />, showGlasses: true }

    case 'sleepy':
    case 'bored':
      return { eyes: <EyesSleepy />, mouth: <MouthSmallO />, showGlasses: true, isBreathing: true }

    case 'surprised':
      return { eyes: <EyesSurprised {...eyeProps} />, mouth: <MouthO />, showGlasses: true }

    case 'love':
      return { eyes: <EyesLove />, mouth: <MouthSmile />, blushDeep: true, showGlasses: true }

    case 'angry':
    case 'debate':
      return { eyes: <EyesAngry {...eyeProps} />, mouth: <MouthFrown />, showGlasses: true }

    case 'shy':
      return { eyes: <EyesShy />, mouth: <MouthFlat />, blushDeep: true, showGlasses: true }

    case 'dizzy':
      return { eyes: <EyesDizzy />, mouth: <MouthWavy />, showGlasses: true }

    case 'inspired':
      return { eyes: <EyesInspired {...eyeProps} />, mouth: <MouthLaugh />, blush: true, showGlasses: true }

    default:
      return { eyes: <EyesNormal {...eyeProps} />, mouth: <MouthSmile />, showGlasses: true, isBreathing: true }
  }
}

/* ================================================================ */

export function AcademicPandaSVG({ mood, size = 56, interactive = true }: AcademicPandaSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { pupilOffset, isBlinking } = useEyeTracking(svgRef, interactive)
  const [earWiggle, setEarWiggle] = useState(0)

  // 耳朵微动动画
  useEffect(() => {
    if (!interactive) return
    const interval = setInterval(() => {
      const wiggle = Math.sin(Date.now() / 800) * 3
      setEarWiggle(wiggle)
    }, 50)
    return () => clearInterval(interval)
  }, [interactive])

  const config = useMemo(() => getMoodConfig(mood, pupilOffset, isBlinking), [mood, pupilOffset, isBlinking])

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        overflow: 'visible',
      }}
    >
      <defs>
        <filter id="panda-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.15)" />
        </filter>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#panda-shadow)">
        {/* 身体 */}
        <Body isBreathing={config.isBreathing ?? false} />

        {/* 手臂 */}
        <ArmLeft mood={mood} />
        <ArmRight mood={mood} />

        {/* 头部 */}
        <HeadBase isBreathing={config.isBreathing ?? false} />

        {/* 耳朵 */}
        <Ears earWiggle={earWiggle} />

        {/* 熊猫眼圈 */}
        <EyePatches />

        {/* 眼睛 */}
        <g style={{ transition: 'opacity 0.3s ease' }}>
          {config.eyes}
        </g>

        {/* 眼镜 */}
        {config.showGlasses && <Glasses isThinking={config.isThinking} />}

        {/* 鼻子 */}
        <Nose />

        {/* 嘴巴 */}
        <g style={{ transition: 'all 0.3s ease' }}>
          {config.mouth}
        </g>

        {/* 腮红 */}
        <g style={{ transition: 'opacity 0.4s ease' }}>
          {config.blushDeep && <Blush deep />}
          {config.blush && !config.blushDeep && <Blush />}
        </g>

        {/* 学士帽 */}
        <GraduationCap />
      </g>
    </svg>
  )
}
