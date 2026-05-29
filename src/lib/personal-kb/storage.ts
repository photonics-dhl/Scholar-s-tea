/**
 * 个人知识库 IndexedDB 存储层
 * 管理文献全文、chunks、embeddings 和设置配置
 */

import type { LocalDocument, DocumentChunk, EmbeddingConfig } from './types'

const DB_NAME = 'scholars-tea-personal-kb'
const DB_VERSION = 1

const STORES = {
  documents: 'documents',
  settings: 'settings',
} as const

let _db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      _db = request.result
      resolve(_db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORES.documents)) {
        db.createObjectStore(STORES.documents, { keyPath: 'docId' })
      }
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' })
      }
    }
  })
}

// ===== Documents =====

export async function saveLocalDocument(doc: LocalDocument): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.documents, 'readwrite')
    const store = tx.objectStore(STORES.documents)
    const request = store.put(doc)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getLocalDocument(docId: string): Promise<LocalDocument | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.documents, 'readonly')
    const store = tx.objectStore(STORES.documents)
    const request = store.get(docId)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteLocalDocument(docId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.documents, 'readwrite')
    const store = tx.objectStore(STORES.documents)
    const request = store.delete(docId)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getAllLocalDocIds(): Promise<string[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.documents, 'readonly')
    const store = tx.objectStore(STORES.documents)
    const request = store.getAllKeys()
    request.onsuccess = () => resolve(request.result as string[])
    request.onerror = () => reject(request.error)
  })
}

export async function getAllLocalDocuments(): Promise<LocalDocument[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.documents, 'readonly')
    const store = tx.objectStore(STORES.documents)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result as LocalDocument[])
    request.onerror = () => reject(request.error)
  })
}

export async function updateLocalDocumentChunks(
  docId: string,
  chunks: DocumentChunk[]
): Promise<void> {
  const doc = await getLocalDocument(docId)
  if (!doc) throw new Error(`Document ${docId} not found in local storage`)
  doc.chunks = chunks
  await saveLocalDocument(doc)
}

// ===== Settings / Embedding Config =====

const EMBEDDING_CONFIG_KEY = 'embeddingConfig'

export async function saveEmbeddingConfig(config: EmbeddingConfig): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.settings, 'readwrite')
    const store = tx.objectStore(STORES.settings)
    const request = store.put({ key: EMBEDDING_CONFIG_KEY, value: config })
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getEmbeddingConfig(): Promise<EmbeddingConfig | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.settings, 'readonly')
    const store = tx.objectStore(STORES.settings)
    const request = store.get(EMBEDDING_CONFIG_KEY)
    request.onsuccess = () => {
      const result = request.result
      resolve(result ? (result.value as EmbeddingConfig) : null)
    }
    request.onerror = () => reject(request.error)
  })
}

// ===== Storage Stats =====

export async function getStorageUsage(): Promise<{
  docCount: number
  estimatedBytes: number
}> {
  const docs = await getAllLocalDocuments()
  let estimatedBytes = 0
  for (const doc of docs) {
    estimatedBytes += new Blob([doc.fullText]).size
    for (const chunk of doc.chunks) {
      estimatedBytes += new Blob([chunk.text]).size
      if (chunk.embedding) {
        estimatedBytes += chunk.embedding.length * 4 // float32 ≈ 4 bytes
      }
    }
  }
  return { docCount: docs.length, estimatedBytes }
}

export async function clearAllLocalData(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.documents, STORES.settings], 'readwrite')
    tx.objectStore(STORES.documents).clear()
    tx.objectStore(STORES.settings).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
