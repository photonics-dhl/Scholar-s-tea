/**
 * 带代理支持的 fetch 包装器
 *
 * 服务器环境（如 10.72.212.33）需要通过本地代理访问外部网络。
 * 此工具自动检测 http_proxy / https_proxy 环境变量，并使用 HttpsProxyAgent。
 */

import nodeFetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'

let _fetch: typeof fetch = fetch
let _agent: HttpsProxyAgent<string> | undefined = undefined

if (typeof window === 'undefined') {
  const proxyUrl =
    process.env.http_proxy ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.HTTPS_PROXY

  if (proxyUrl) {
    _fetch = (nodeFetch as any).default || nodeFetch
    _agent = new HttpsProxyAgent(proxyUrl)
  }
}

/**
 * 使用代理（如配置）的 fetch 函数
 */
export async function fetchWithProxy(
  url: string,
  init?: RequestInit & { agent?: any }
): Promise<Response> {
  if (_agent) {
    return _fetch(url, { ...init, agent: _agent } as any)
  }
  return _fetch(url, init as any)
}

/**
 * 带超时的 fetch（自动使用代理）
 */
export async function fetchWithProxyAndTimeout(
  url: string,
  init?: RequestInit & { agent?: any },
  timeoutMs: number = 15000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchWithProxy(url, {
      ...init,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}
