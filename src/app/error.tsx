'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error boundary caught:', error)
  }, [error])

  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            页面出现错误
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            抱歉，页面加载时遇到了问题。请尝试刷新或返回首页。
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-6 overflow-auto max-h-40">
              <p className="text-xs font-mono text-red-600">{error.message}</p>
              {error.digest && (
                <p className="text-xs font-mono text-gray-400 mt-1">
                  digest: {error.digest}
                </p>
              )}
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={reset} variant="outline" className="gap-2">
              <RefreshCcw className="w-4 h-4" />
              重试
            </Button>
            <Button asChild className="gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                返回首页
              </Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
