'use client'

import { useState, useEffect } from 'react'
import { Download, Files, Zap, Lock, Globe, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export interface DownloadConfig {
  /** 单篇(false) 或 批量(true) */
  batchMode: boolean
  /** 下载策略 */
  strategy: 'fastest' | 'oa_first' | 'scihub_only' | 'legal_only'
}

const STORAGE_KEY = 'scholars-paper-download-config'

const DEFAULT_CONFIG: DownloadConfig = {
  batchMode: false,
  strategy: 'fastest',
}

const STRATEGY_OPTIONS: Array<{
  value: DownloadConfig['strategy']
  label: string
  desc: string
  icon: React.ElementType
}> = [
  { value: 'fastest', label: '自动', desc: '并行竞赛，谁快用谁', icon: Zap },
  { value: 'oa_first', label: 'OA优先', desc: '优先开放获取', icon: Globe },
  { value: 'scihub_only', label: 'Sci-Hub', desc: '仅 Sci-Hub/LibGen', icon: BookOpen },
  { value: 'legal_only', label: '合法', desc: '仅合法来源', icon: Lock },
]

function loadConfig(): DownloadConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG }
}

function saveConfig(config: DownloadConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch { /* ignore */ }
}

export function useDownloadConfig(): DownloadConfig & {
  setBatchMode: (v: boolean) => void
  setStrategy: (v: DownloadConfig['strategy']) => void
} {
  const [config, setConfig] = useState<DownloadConfig>(loadConfig)

  useEffect(() => {
    saveConfig(config)
  }, [config])

  return {
    ...config,
    setBatchMode: (v) => setConfig((prev) => ({ ...prev, batchMode: v })),
    setStrategy: (v) => setConfig((prev) => ({ ...prev, strategy: v })),
  }
}

export function DownloadConfigPanel({
  config,
  onChange,
  className,
}: {
  config: DownloadConfig
  onChange: (config: DownloadConfig) => void
  className?: string
}) {
  return (
    <div className={cn('mx-4 mt-2 p-3 rounded-lg bg-muted/40 border border-border/40', className)}>
      <div className="flex flex-col gap-3">
        {/* 下载模式 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">下载模式</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={config.batchMode ? 'ghost' : 'secondary'}
              className={cn('h-7 text-xs gap-1', !config.batchMode && 'bg-journal-primary/10 text-journal-primary hover:bg-journal-primary/20')}
              onClick={() => onChange({ ...config, batchMode: false })}
            >
              <Download className="w-3 h-3" />
              单篇下载
            </Button>
            <Button
              size="sm"
              variant={config.batchMode ? 'secondary' : 'ghost'}
              className={cn('h-7 text-xs gap-1', config.batchMode && 'bg-journal-primary/10 text-journal-primary hover:bg-journal-primary/20')}
              onClick={() => onChange({ ...config, batchMode: true })}
            >
              <Files className="w-3 h-3" />
              批量下载
            </Button>
          </div>
        </div>

        {/* 下载策略 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">下载策略</span>
          <div className="flex flex-wrap gap-1">
            {STRATEGY_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = config.strategy === opt.value
              return (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={active ? 'secondary' : 'ghost'}
                  className={cn(
                    'h-7 text-xs gap-1 px-2',
                    active && 'bg-journal-primary/10 text-journal-primary hover:bg-journal-primary/20'
                  )}
                  onClick={() => onChange({ ...config, strategy: opt.value })}
                  title={opt.desc}
                >
                  <Icon className="w-3 h-3" />
                  {opt.label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
