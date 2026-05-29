'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { PersonalDocumentMeta, LocalDocument, UploadResult } from '@/lib/personal-kb'
import {
  saveLocalDocument,
  getLocalDocument,
  deleteLocalDocument,
  getAllLocalDocIds,
  getStorageUsage,
} from '@/lib/personal-kb/storage'
import { chunkText, estimateTokens } from '@/lib/personal-kb/chunker'
import { extractTextFromFile } from '@/lib/personal-kb/pdf-extractor'

export type UploadStage =
  | 'idle'
  | 'extracting'
  | 'enhancing'
  | 'chunking'
  | 'saving'
  | 'error'

export interface UsePersonalKBReturn {
  docs: PersonalDocumentMeta[]
  loading: boolean
  uploading: boolean
  uploadStage: UploadStage
  uploadStageMessage: string
  error: string | null
  storageUsage: { docCount: number; estimatedBytes: number } | null
  fetchDocs: () => Promise<void>
  uploadDocument: (file: File) => Promise<UploadResult>
  deleteDocument: (docId: string) => Promise<void>
  updateMeta: (docId: string, updates: Partial<PersonalDocumentMeta>) => Promise<void>
  getLocalDoc: (docId: string) => Promise<LocalDocument | null>
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB 总限制

export function usePersonalKB(): UsePersonalKBReturn {
  const [docs, setDocs] = useState<PersonalDocumentMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadStageMessage, setUploadStageMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [storageUsage, setStorageUsage] = useState<{ docCount: number; estimatedBytes: number } | null>(null)
  const fetchedRef = useRef(false)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/personal-kb')
      const data = await res.json()
      if (data.success) {
        setDocs(data.data || [])
      } else {
        setError(data.error?.message || '获取文献列表失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchDocs()
    getStorageUsage().then(setStorageUsage).catch(() => {})
  }, [fetchDocs])

  const setStage = useCallback((stage: UploadStage, message: string) => {
    setUploadStage(stage)
    setUploadStageMessage(message)
  }, [])

  const uploadDocument = useCallback(async (file: File): Promise<UploadResult> => {
    setUploading(true)
    setError(null)
    setStage('extracting', '正在提取文本...')

    try {
      // 0. 文件大小校验
      if (file.size > MAX_FILE_SIZE) {
        const msg = `文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，请上传不超过 10MB 的文件`
        setError(msg)
        setStage('error', msg)
        return { success: false, error: msg }
      }

      // 1. Extract text
      const extractResult = await extractTextFromFile(file)
      if (extractResult.error) {
        const msg = extractResult.error
        setError(msg)
        setStage('error', msg)
        return { success: false, error: msg }
      }
      if (extractResult.isScanned) {
        const msg = '此 PDF 为扫描版，无法自动提取文本。请使用 OCR 工具处理后重新上传，或手动粘贴文本。'
        setError(msg)
        setStage('error', msg)
        return { success: false, error: msg }
      }

      let fullText = extractResult.text

      // 逐页质量评估，传坏页面信息给后端做 LLM 修复
      const badPages = extractResult.pages
        ?.filter((p) => p.quality.grade === 'poor' || (p.quality.grade === 'fair' && p.quality.hasFormulaWarning))
        .map((p) => p.pageNum) || []

      console.log('[PersonalKB] Detection result:', {
        badPages,
        pageCount: extractResult.pageCount,
        pages: extractResult.pages?.map(p => ({ pageNum: p.pageNum, grade: p.quality.grade, hasFormulaWarning: p.quality.hasFormulaWarning })),
      })

      if (badPages.length > 0) {
        setStage('enhancing', `检测到 ${badPages.length} 页公式乱码，正在用 AI 修复...`)
        try {
          const fixForm = new FormData()
          fixForm.append('file', file)
          fixForm.append('originalText', fullText)
          fixForm.append('badPages', JSON.stringify(badPages))
          fixForm.append('pageCount', String(extractResult.pageCount))

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 分钟超时

          const fixRes = await fetch('/api/v1/knowledge/extract-pdf', {
            method: 'POST',
            body: fixForm,
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          if (fixRes.ok) {
            const fixData = await fixRes.json()
            if (fixData.success && fixData.data?.text) {
              fullText = fixData.data.text
              console.log('[PersonalKB] Enhanced via', fixData.data.source || 'unknown')

              // 增强成功，更新 quality 标记
              if (extractResult.quality) {
                extractResult.quality = {
                  ...extractResult.quality,
                  grade: 'good',
                  hasFormulaWarning: false,
                }
              }
            }
          } else {
            const errData = await fixRes.json().catch(() => ({}))
            console.warn('[PersonalKB] Enhancement API error:', fixRes.status, errData)
            setUploadStageMessage(`公式修复服务暂时不可用 (${fixRes.status})，已保存原始文本。如公式显示乱码，请稍后重试或手动粘贴。`)
          }
        } catch (fixErr) {
          console.warn('[PersonalKB] Enhancement failed:', fixErr)
          const errMsg = fixErr instanceof Error ? fixErr.message : String(fixErr)
          if (errMsg.includes('aborted') || errMsg.includes('AbortError') || errMsg.includes('timeout')) {
            setUploadStageMessage('公式修复超时，已保存原始文本。此 PDF 的公式可能显示乱码，建议手动粘贴 LaTeX/Markdown 文本替代。')
          } else {
            setUploadStageMessage(`公式修复失败（${errMsg.slice(0, 100)}），已保存原始文本。如公式显示乱码，请稍后重试或手动粘贴。`)
          }
        }
      }

      setStage('chunking', '正在分块处理...')

      if (fullText.length < 100) {
        const msg = '提取的文本过短，请检查文件内容或尝试其他文件。'
        setError(msg)
        setStage('error', msg)
        return { success: false, error: msg }
      }

      // 2. Chunk text
      const chunks = chunkText(fullText)

      setStage('saving', '正在保存...')

      // 3. Create server-side metadata
      const metaRes = await fetch('/api/v1/personal-kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.name.replace(/\.[^/.]+$/, ''),
          fileSize: file.size,
          pageCount: extractResult.pageCount,
          chunkCount: chunks.length,
          sourceType: file.name.endsWith('.pdf') ? 'pdf' : 'txt',
        }),
      })

      const metaData = await metaRes.json()
      if (!metaData.success) {
        return { success: false, error: metaData.error?.message || '创建文献元数据失败' }
      }

      const meta: PersonalDocumentMeta = metaData.data

      // 4. Save to IndexedDB (without embeddings first)
      const localDoc: LocalDocument = {
        docId: meta.id,
        fullText,
        chunks,
        extractedAt: Date.now(),
        version: 1,
        quality: extractResult.quality,
      }
      await saveLocalDocument(localDoc)

      // 5. Update local state
      setDocs((prev) => [
        {
          id: meta.id,
          userId: '', // will be filled by server
          title: file.name.replace(/\.[^/.]+$/, ''),
          fileSize: file.size,
          pageCount: extractResult.pageCount,
          chunkCount: chunks.length,
          sourceType: file.name.endsWith('.pdf') ? 'pdf' : 'txt',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as PersonalDocumentMeta,
        ...prev,
      ])

      // 6. Auto-generate embeddings in background
      // Don't block the upload flow; fire-and-forget
      setTimeout(() => {
        import('@/lib/personal-kb/search').then(({ embedDocumentChunks }) => {
          embedDocumentChunks(meta.id).catch((err) => {
            console.warn('[PersonalKB] Background embedding failed:', err)
          })
        })
      }, 0)

      // Refresh storage stats
      getStorageUsage().then(setStorageUsage).catch(() => {})
      setStage('idle', '')

      return { success: true, meta, localDoc }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '上传失败'
      setError(msg)
      setStage('error', msg)
      return { success: false, error: msg }
    } finally {
      setUploading(false)
      setStage('idle', '')
    }
  }, [setStage])

  const deleteDocument = useCallback(async (docId: string) => {
    setError(null)
    try {
      // 1. Delete local data first
      await deleteLocalDocument(docId)

      // 2. Delete server metadata
      const res = await fetch(`/api/v1/personal-kb/${docId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) {
        console.warn('[PersonalKB] Server delete failed:', data.error)
      }

      // 3. Update local state
      setDocs((prev) => prev.filter((d) => d.id !== docId))
      getStorageUsage().then(setStorageUsage).catch(() => {})
    } catch (err) {
      const msg = err instanceof Error ? err.message : '删除失败'
      setError(msg)
    }
  }, [])

  const updateMeta = useCallback(async (docId: string, updates: Partial<PersonalDocumentMeta>) => {
    setError(null)
    try {
      const res = await fetch(`/api/v1/personal-kb/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error?.message || '更新失败')
        return
      }

      // Update local state
      setDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, ...updates } : d))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    }
  }, [])

  const getLocalDoc = useCallback(async (docId: string): Promise<LocalDocument | null> => {
    return getLocalDocument(docId)
  }, [])

  return {
    docs,
    loading,
    uploading,
    uploadStage,
    uploadStageMessage,
    error,
    storageUsage,
    fetchDocs,
    uploadDocument,
    deleteDocument,
    updateMeta,
    getLocalDoc,
  }
}
