/**
 * Scholar's Tea — 全局循环与递归防护工具
 *
 * 用途：防止 AI 服务、Agent 调用、长任务陷入无限循环或无限思考。
 * 不修改默认配置、模型或 effort，仅在代码层面添加硬边界。
 *
 * 并发安全：使用 AsyncLocalStorage 隔离不同请求/调用链的深度计数器，
 * 避免并发请求共享全局计数器导致误报。
 */

import { AsyncLocalStorage } from 'async_hooks'

/** 每个异步调用链独立的深度计数器存储 */
const _depthStorage = new AsyncLocalStorage<Map<string, number>>()

/** 递归/重入深度计数器（按 key 隔离）—— 仅用于同步版本 */
const _syncDepthMap = new Map<string, number>()

/** 默认最大递归深度 */
const DEFAULT_MAX_DEPTH = 3

/** 默认最大重试次数 */
const DEFAULT_MAX_RETRIES = 3

/**
 * 获取当前异步上下文的深度 Map（不存在则创建）。
 * 使用 AsyncLocalStorage 确保并发请求之间互不干扰。
 */
function _getDepthMap(): Map<string, number> {
  let store = _depthStorage.getStore()
  if (!store) {
    store = new Map<string, number>()
  }
  return store
}

/**
 * 在指定 key 的作用域内执行函数，并限制递归深度。
 * 超过深度时立即抛出错误，阻止无限递归。
 *
 * 并发安全：每个顶层调用链通过 AsyncLocalStorage 拥有独立的计数器。
 *
 * @example
 * await guardDepth('paper-generation', () => generatePaper(params))
 */
export async function guardDepth<T>(
  key: string,
  fn: () => Promise<T>,
  maxDepth: number = DEFAULT_MAX_DEPTH
): Promise<T> {
  const store = _depthStorage.getStore()
  const depthMap = _getDepthMap()
  const current = (depthMap.get(key) || 0) + 1

  if (current > maxDepth) {
    throw new Error(`[LoopGuard] Depth limit exceeded for "${key}" (max=${maxDepth})`)
  }

  depthMap.set(key, current)

  const execute = async (): Promise<T> => {
    try {
      return await fn()
    } finally {
      depthMap.set(key, current - 1)
    }
  }

  // 如果已经在 AsyncLocalStorage 上下文中，直接执行
  // 否则创建一个新的存储上下文
  if (store) {
    return execute()
  }
  return _depthStorage.run(depthMap, execute)
}

/**
 * 同步版本深度防护
 *
 * ⚠️ 同步版本使用全局 Map，在并发场景下可能产生误报。
 * 仅在已知单线程、非并发场景下使用。
 */
export function guardDepthSync<T>(
  key: string,
  fn: () => T,
  maxDepth: number = DEFAULT_MAX_DEPTH
): T {
  const current = (_syncDepthMap.get(key) || 0) + 1
  if (current > maxDepth) {
    throw new Error(`[LoopGuard] Depth limit exceeded for "${key}" (max=${maxDepth})`)
  }
  _syncDepthMap.set(key, current)
  try {
    return fn()
  } finally {
    _syncDepthMap.set(key, current - 1)
  }
}

/**
 * 带重试限制的异步包装器。
 * 超过最大重试次数后抛出错误，防止无限重试循环。
 *
 * @example
 * await withRetryLimit(() => fetchData(), { maxRetries: 3, label: 'fetchData' })
 */
export async function withRetryLimit<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    label?: string
    delayMs?: number
  } = {}
): Promise<T> {
  const { maxRetries = DEFAULT_MAX_RETRIES, label = 'operation', delayMs = 0 } = options
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt >= maxRetries) {
        throw new Error(
          `[LoopGuard] Retry limit exceeded for "${label}" after ${maxRetries} retries. Last error: ${lastError.message}`
        )
      }
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError || new Error(`[LoopGuard] Unexpected end of retry loop for "${label}"`)
}

/**
 * 带时间上限的异步包装器。
 * 超时后抛出错误，防止任务无限挂起。
 *
 * @example
 * await withTimeLimit(() => longRunningTask(), 30000, 'longRunningTask')
 */
export async function withTimeLimit<T>(
  fn: () => Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`[LoopGuard] Time limit exceeded for "${label}" after ${ms}ms`)), ms)
    ),
  ])
}

/**
 * 计数器工厂：用于限制迭代次数（如 while、forEach、递归遍历）。
 *
 * @example
 * const counter = iterationCounter('file-search', 100)
 * while (hasMore) {
 *   counter.check()
 *   // ...
 * }
 */
export function iterationCounter(key: string, maxIterations: number) {
  let count = 0
  return {
    check(): void {
      count++
      if (count > maxIterations) {
        throw new Error(`[LoopGuard] Iteration limit exceeded for "${key}" (max=${maxIterations})`)
      }
    },
    get count(): number {
      return count
    },
  }
}

/**
 * 重置指定 key 的深度计数（用于测试或异常恢复）。
 * 同时清理异步存储和同步 Map 中的计数器。
 */
export function resetDepth(key?: string): void {
  if (key) {
    _syncDepthMap.delete(key)
    const store = _depthStorage.getStore()
    if (store) {
      store.delete(key)
    }
  } else {
    _syncDepthMap.clear()
  }
}
