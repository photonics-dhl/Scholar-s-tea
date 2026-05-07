'use client'

import { useState, useEffect } from 'react'

interface StreamTextProps {
  content: string
  speed?: number
  onComplete?: () => void
}

/**
 * 流式文字渲染组件
 * 以打字机效果逐字显示文本，提升 AI 回复的感知速度
 */
export function StreamText({ content, speed = 8, onComplete }: StreamTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index < content.length) {
      const timer = setTimeout(() => {
        setDisplayed(content.slice(0, index + 1))
        setIndex((prev) => prev + 1)
      }, speed)
      return () => clearTimeout(timer)
    } else {
      onComplete?.()
    }
  }, [index, content, speed, onComplete])

  // Reset when content changes significantly (new message)
  useEffect(() => {
    if (content.length < displayed.length) {
      setDisplayed(content)
      setIndex(content.length)
    }
  }, [content, displayed.length])

  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {displayed}
      {index < content.length && (
        <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  )
}
