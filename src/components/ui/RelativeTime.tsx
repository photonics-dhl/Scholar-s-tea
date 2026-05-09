'use client'

import { useState, useEffect } from 'react'

interface RelativeTimeProps {
  date: string | Date
  className?: string
  variant?: 'relative' | 'full' | 'short'
}

function computeRelative(date: Date, variant: RelativeTimeProps['variant']): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (variant === 'full') {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (variant === 'short') {
    if (diffDays < 1) return '今天'
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN')
  }

  // relative (default)
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

/**
 * SSR-safe relative time display.
 * Renders a static placeholder during SSR, then updates to the actual relative time on mount.
 */
export function RelativeTime({ date, className, variant = 'relative' }: RelativeTimeProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const [text, setText] = useState(() => {
    // SSR: render a stable fallback (just the date part, no "X minutes ago")
    if (variant === 'full') {
      return dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    if (variant === 'short') {
      return dateObj.toLocaleDateString('zh-CN')
    }
    return dateObj.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  })

  useEffect(() => {
    setText(computeRelative(dateObj, variant))
  }, [dateObj, variant])

  return <span className={className}>{text}</span>
}
