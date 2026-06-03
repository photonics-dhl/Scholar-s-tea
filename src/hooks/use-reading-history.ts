import { useState, useEffect, useCallback } from 'react'

interface ReadRecord {
  visitedAt: string
}

const STORAGE_KEY = 'knowledge-reading-history'

function getStorage(): Record<string, ReadRecord> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setStorage(data: Record<string, ReadRecord>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function useReadingHistory() {
  const [history, setHistory] = useState<Record<string, ReadRecord>>({})

  useEffect(() => {
    setHistory(getStorage())
  }, [])

  const markVisited = useCallback((docId: string) => {
    setHistory((prev) => {
      const next = { ...prev, [docId]: { visitedAt: new Date().toISOString() } }
      setStorage(next)
      return next
    })
  }, [])

  const isVisited = useCallback(
    (docId: string) => !!history[docId],
    [history]
  )

  const getVisitedAt = useCallback(
    (docId: string): Date | null => {
      const rec = history[docId]
      return rec ? new Date(rec.visitedAt) : null
    },
    [history]
  )

  return { history, markVisited, isVisited, getVisitedAt }
}
