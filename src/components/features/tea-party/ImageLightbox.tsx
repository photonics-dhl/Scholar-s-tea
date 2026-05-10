'use client'

import { useEffect, useCallback } from 'react'
import { X, Download, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ImageLightboxProps {
  src: string
  alt?: string
  isOpen: boolean
  onClose: () => void
}

export function ImageLightbox({ src, alt = '图片', isOpen, onClose }: ImageLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = alt.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') + '.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      window.open(src, '_blank')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); handleDownload() }}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          title="下载图片"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          title="关闭"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className={cn(
            'max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl',
            'animate-scale-in'
          )}
        />
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs">
        按 ESC 或点击背景关闭 · 滚轮缩放
      </div>
    </div>
  )
}
