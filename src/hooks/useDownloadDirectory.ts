'use client'

import { useState, useCallback, useRef } from 'react'

export interface DownloadDirectoryState {
  /** 浏览器是否支持 File System Access API 的目录选择 */
  isSupported: boolean
  /** 用户选择的目录句柄 */
  directoryHandle: FileSystemDirectoryHandle | null
  /** 目录显示名称 */
  directoryName: string | null
  /** 是否正在选择目录 */
  isSelecting: boolean
  /** 是否正在保存文件 */
  isSaving: boolean
  /** 最近保存的文件名 */
  lastSavedFile: string | null
  /** 保存成功的文件数量 */
  savedCount: number
  /** 错误信息 */
  error: string | null
}

export interface DownloadDirectoryActions {
  /** 弹出目录选择器让用户选择保存目录 */
  selectDirectory: () => Promise<void>
  /** 将文件保存到已选目录 */
  saveFileToDirectory: (filename: string, url: string) => Promise<boolean>
  /** 清除已选目录 */
  clearDirectory: () => void
  /** 清除错误 */
  clearError: () => void
}

/**
 * 管理文献下载的本地保存目录
 *
 * 使用 File System Access API 的 showDirectoryPicker，
 * 允许用户选择本地文件夹，后续下载的 PDF 自动写入该目录。
 *
 * 支持 Chrome/Edge 86+，需要 HTTPS 和用户手势触发。
 */
export function useDownloadDirectory(): DownloadDirectoryState & DownloadDirectoryActions {
  const isSupported =
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    'showDirectoryPicker' in window &&
    'FileSystemWritableFileStream' in window

  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [directoryName, setDirectoryName] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedFile, setLastSavedFile] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Use ref to track auto-save in progress without causing re-renders
  const savingRef = useRef<Set<string>>(new Set())

  const selectDirectory = useCallback(async () => {
    if (!isSupported) {
      setError('当前浏览器不支持文件夹选择功能，请使用 Chrome/Edge 最新版')
      return
    }

    setIsSelecting(true)
    setError(null)

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads',
      })

      // Request permission explicitly
      const permission = await (handle as any).requestPermission({ mode: 'readwrite' })
      if (permission !== 'granted') {
        setError('需要写入权限才能保存文件到该目录')
        setIsSelecting(false)
        return
      }

      setDirectoryHandle(handle)
      setDirectoryName(handle.name)
      setIsSelecting(false)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled — no error
      } else {
        setError(err instanceof Error ? err.message : '选择目录失败')
      }
      setIsSelecting(false)
    }
  }, [isSupported])

  const saveFileToDirectory = useCallback(
    async (filename: string, url: string): Promise<boolean> => {
      if (!directoryHandle) {
        setError('未选择保存目录')
        return false
      }

      // Prevent duplicate saves for the same file
      if (savingRef.current.has(filename)) return false
      savingRef.current.add(filename)

      setIsSaving(true)
      setError(null)

      try {
        // Fetch file from server
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`下载失败: ${response.status}`)
        }
        const blob = await response.blob()

        // Create or get file handle in the directory
        const fileHandle = await (directoryHandle as any).getFileHandle(filename, {
          create: true,
        })

        // Write to file
        const writable = await fileHandle.createWritable()
        await writable.write(blob)
        await writable.close()

        setLastSavedFile(filename)
        setSavedCount((c) => c + 1)
        setIsSaving(false)
        savingRef.current.delete(filename)
        return true
      } catch (err: any) {
        const message = err instanceof Error ? err.message : '保存失败'
        setError(message)
        setIsSaving(false)
        savingRef.current.delete(filename)
        return false
      }
    },
    [directoryHandle]
  )

  const clearDirectory = useCallback(() => {
    setDirectoryHandle(null)
    setDirectoryName(null)
    setLastSavedFile(null)
    setSavedCount(0)
    setError(null)
    savingRef.current.clear()
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    isSupported,
    directoryHandle,
    directoryName,
    isSelecting,
    isSaving,
    lastSavedFile,
    savedCount,
    error,
    selectDirectory,
    saveFileToDirectory,
    clearDirectory,
    clearError,
  }
}
