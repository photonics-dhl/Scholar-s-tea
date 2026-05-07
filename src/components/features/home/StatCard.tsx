'use client'

import { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface StatCardProps {
  value: number
  label: string
  color: string
  borderColor: string
  trend?: number // positive/negative change
  delay?: number // animation delay in ms
}

/**
 * 带动画的统计卡片
 * 数字从 0 滚动到目标值，带趋势指示
 */
export function StatCard({
  value,
  label,
  color,
  borderColor,
  trend,
  delay = 0,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          setTimeout(() => {
            const duration = 1200
            const steps = 30
            const increment = value / steps
            let current = 0
            const timer = setInterval(() => {
              current += increment
              if (current >= value) {
                setDisplayValue(value)
                clearInterval(timer)
              } else {
                setDisplayValue(Math.floor(current))
              }
            }, duration / steps)
          }, delay)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, delay, hasAnimated])

  const TrendIcon =
    trend === undefined
      ? Minus
      : trend > 0
        ? TrendingUp
        : TrendingDown

  return (
    <Card
      ref={ref}
      className={cn(
        'bg-gradient-to-br from-card to-card/50 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        borderColor
      )}
    >
      <CardContent className="p-4 md:p-6 text-center">
        <div
          className={cn(
            'text-3xl md:text-4xl font-bold tabular-nums transition-colors',
            color
          )}
        >
          {displayValue.toLocaleString('zh-CN')}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          {trend !== undefined && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
