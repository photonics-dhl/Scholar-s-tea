'use client'

import { useState, useCallback } from 'react'

export interface FileSystemAccessState {
  isSupported: boolean
  isSaving: boolean
  error: string | null
  lastSavedPath: string | null
}

function getFileHandleFromShowSaveFilePicker(
  suggestedName: string,
  fileType: string
): Promise<FileSystemFileHandle | null> {
  if (typeof window === 'undefined' || !('showSaveFilePicker' in window)) {
    return Promise.resolve(null)
  }

  const mimeMap: Record<string, { description: string; accept: Record<string, string[]> }> = {
    pdf: { description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } },
    bib: { description: 'BibTeX File', accept: { 'application/x-bibtex': ['.bib'] } },
    ris: { description: 'RIS File', accept: { 'application/x-research-info-systems': ['.ris'] } },
    txt: { description: 'Text File', accept: { 'text/plain': ['.txt'] } },
    json: { description: 'JSON File', accept: { 'application/json': ['.json'] } },
  }

  const ext = suggestedName.split('.').pop()?.toLowerCase() || 'pdf'
  const typeInfo = mimeMap[ext] || mimeMap.pdf

  return (window as any).showSaveFilePicker({
    suggestedName,
    types: [typeInfo],
  }).catch((err: Error) => {
    if (err.name === 'AbortError') return null
    throw err
  })
}

export function useFileSystemAccess(): FileSystemAccessState & {
  saveFile: (url: string, filename: string) => Promise<boolean>
  clearError: () => void
} {
  const isSupported =
    typeof window !== 'undefined' && 'showSaveFilePicker' in window && 'FileSystemWritableFileStream' in window

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSavedPath, setLastSavedPath] = useState<string | null>(null)

  const saveFile = useCallback(
    async (url: string, filename: string): Promise<boolean> => {
      if (!isSupported) {
        setError('当前浏览器不支持 File System Access API，请使用 Chrome/Edge')
        return false
      }

      setIsSaving(true)
      setError(null)

      try {
        const handle = await getFileHandleFromShowSaveFilePicker(filename, 'pdf')
        if (!handle) {
          // User cancelled
          setIsSaving(false)
          return false
        }

        // Fetch file content
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`下载失败: ${response.status}`)
        }
        const blob = await response.blob()

        // Write to file
        const writable = await (handle as any).createWritable()
        await writable.write(blob)
        await writable.close()

        setLastSavedPath((handle as any).name || filename)
        setIsSaving(false)
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : '保存失败'
        setError(message)
        setIsSaving(false)
        return false
      }
    },
    [isSupported]
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    isSupported,
    isSaving,
    error,
    lastSavedPath,
    saveFile,
    clearError,
  }
}
