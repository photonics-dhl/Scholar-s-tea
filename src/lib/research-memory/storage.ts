/**
 * 研究记忆 IndexedDB 存储层
 * 复用 personal-kb 的数据库（DB_NAME: scholars-tea-personal-kb, DB_VERSION: 2）
 */

import type { ResearchMemory } from './types'

const DB_NAME = 'scholars-tea-personal-kb'
const DB_VERSION = 2
const MEMORY_STORE = 'memories'

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
      // memories store 由 personal-kb/storage.ts 的升级逻辑统一创建
      // 这里仅做防御性检查
      if (!db.objectStoreNames.contains(MEMORY_STORE)) {
        db.createObjectStore(MEMORY_STORE, { keyPath: 'id' })
      }
    }
  })
}

// ===== CRUD =====

export async function saveMemory(memory: ResearchMemory): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEMORY_STORE, 'readwrite')
    const store = tx.objectStore(MEMORY_STORE)
    const request = store.put(memory)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getMemory(id: string): Promise<ResearchMemory | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEMORY_STORE, 'readonly')
    const store = tx.objectStore(MEMORY_STORE)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteMemory(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEMORY_STORE, 'readwrite')
    const store = tx.objectStore(MEMORY_STORE)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getAllMemories(): Promise<ResearchMemory[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEMORY_STORE, 'readonly')
    const store = tx.objectStore(MEMORY_STORE)
    const request = store.getAll()
    request.onsuccess = () => resolve((request.result as ResearchMemory[]) || [])
    request.onerror = () => reject(request.error)
  })
}

export async function clearAllMemories(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEMORY_STORE, 'readwrite')
    const store = tx.objectStore(MEMORY_STORE)
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
