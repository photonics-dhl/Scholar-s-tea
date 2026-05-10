'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * React 类组件错误边界
 * 用于包裹可能崩溃的组件，防止单点故障影响全站
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">组件加载失败</span>
          </div>
          <p className="text-xs text-red-600 mb-3">
            {this.state.error?.message || '未知错误'}
          </p>
          <Button variant="outline" size="sm" onClick={this.handleReset}>
            重试
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
