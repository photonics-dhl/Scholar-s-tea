'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  emoji?: string
  rotation: number
  rotationSpeed: number
}

interface PandaParticlesProps {
  originX: number
  originY: number
  trigger: number // 变化时触发
  type?: 'hearts' | 'stars' | 'sparkles' | 'mixed'
  count?: number
}

const COLORS = {
  hearts: ['#FF6B8A', '#FF8FA3', '#FFB3C1', '#FFD6E0'],
  stars: ['#FFD700', '#FFA500', '#FFEC8B', '#FFE4B5'],
  sparkles: ['#A0E7E5', '#B4F8C8', '#FBE7C6', '#FFAEBC'],
  mixed: ['#FF6B8A', '#FFD700', '#A0E7E5', '#B4F8C8', '#FFAEBC', '#CDB4DB'],
}

const EMOJIS = {
  hearts: ['♥', '💗', '💖'],
  stars: ['★', '✦', '✨'],
  sparkles: ['✨', '·', '◆'],
  mixed: ['♥', '★', '✨', '💗', '✦'],
}

export function PandaParticles({ originX, originY, trigger, type = 'mixed', count = 8 }: PandaParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const idRef = useRef(0)
  const frameRef = useRef<number>(0)

  const spawnParticles = useCallback(() => {
    const colors = COLORS[type]
    const emojis = EMOJIS[type]
    const newParticles: Particle[] = []

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const speed = 1.5 + Math.random() * 2.5
      newParticles.push({
        id: idRef.current++,
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // 略微向上
        life: 0,
        maxLife: 40 + Math.random() * 30,
        size: 8 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      })
    }

    setParticles(prev => [...prev, ...newParticles])
  }, [originX, originY, type, count])

  useEffect(() => {
    if (trigger > 0) {
      spawnParticles()
    }
  }, [trigger, spawnParticles])

  // 动画循环
  useEffect(() => {
    const animate = () => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.08, // 重力
            life: p.life + 1,
            rotation: p.rotation + p.rotationSpeed,
          }))
          .filter(p => p.life < p.maxLife)

        return updated
      })
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map(p => {
        const progress = p.life / p.maxLife
        const opacity = 1 - Math.pow(progress, 2)
        const scale = 1 - progress * 0.5

        return (
          <span
            key={p.id}
            className="absolute select-none"
            style={{
              left: p.x,
              top: p.y,
              fontSize: p.size,
              color: p.color,
              opacity,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${p.rotation}deg)`,
              textShadow: `0 0 6px ${p.color}60`,
              filter: `drop-shadow(0 0 3px ${p.color})`,
            }}
          >
            {p.emoji}
          </span>
        )
      })}
    </div>
  )
}
