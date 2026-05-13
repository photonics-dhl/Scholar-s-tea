'use client'

import { useState, useEffect } from 'react'

export interface HermesCapability {
  id: string
  icon: string
  label: string
  color: string
}

export interface HermesCapabilities {
  capabilities: HermesCapability[]
  raw: string[]
  model: string
  personalities: string[]
}

export function useHermesCapabilities() {
  const [capabilities, setCapabilities] = useState<HermesCapabilities | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/v1/hermes/capabilities')
        const data = await res.json()
        if (!cancelled) {
          if (data.success && data.data) {
            setCapabilities(data.data)
          } else {
            setError(data.error?.message || '加载失败')
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '网络错误')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { capabilities, loading, error }
}
