#!/usr/bin/env node
/**
 * Workshop 503 错误排查脚本
 * 直接调用各层 API，定位 503 来源
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '../..')

// 读取 .env 获取环境变量
function loadEnv() {
  try {
    const envPath = join(rootDir, '.env')
    const content = readFileSync(envPath, 'utf-8')
    const env = {}
    for (const line of content.split('\n')) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (match) {
        let value = match[2].trim()
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
        env[match[1]] = value
      }
    }
    return env
  } catch {
    return {}
  }
}

const env = loadEnv()
const PROXY = env.http_proxy || env.https_proxy || env.HTTP_PROXY || env.HTTPS_PROXY || 'http://127.0.0.1:7890'

async function testWithProxy(url, options) {
  // 使用 undici 或 node-fetch 带代理
  try {
    const { ProxyAgent } = await import('undici')
    const dispatcher = new ProxyAgent(PROXY)
    return fetch(url, { ...options, dispatcher })
  } catch {
    // fallback 到普通 fetch
    return fetch(url, options)
  }
}

async function testZAI() {
  console.log('\n=== Test 1: ZAI API 直连 ===')
  const ZAI_API_KEY = env.ZAI_API_KEY
  const ZAI_BASE_URL = env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4'

  if (!ZAI_API_KEY) {
    console.log('❌ ZAI_API_KEY not configured, skipping')
    return
  }

  try {
    const res = await testWithProxy(`${ZAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ZAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-5.1',
        messages: [{ role: 'user', content: 'Hello, respond with exactly "OK".' }],
        max_tokens: 100,
        temperature: 0.1,
        stream: false,
      }),
    })

    console.log('Status:', res.status, res.statusText)
    const text = await res.text()
    console.log('Response preview:', text.slice(0, 500))

    if (res.status === 503) {
      console.log('🔴 ZAI API returned 503!')
    } else if (res.ok) {
      console.log('🟢 ZAI API OK')
    } else {
      console.log('🟡 ZAI API returned', res.status)
    }
  } catch (err) {
    console.log('❌ ZAI API fetch error:', err.message)
  }
}

async function testWorkshopChat() {
  console.log('\n=== Test 2: Workshop Chat API (via server) ===')
  const APP_URL = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'

  try {
    const res = await fetch(`${APP_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello, respond with exactly "OK".' }],
        stream: false,
      }),
    })

    console.log('Status:', res.status, res.statusText)
    const contentType = res.headers.get('content-type')
    console.log('Content-Type:', contentType)

    if (contentType?.includes('application/json')) {
      const data = await res.json()
      console.log('Response:', JSON.stringify(data, null, 2).slice(0, 500))
    } else {
      const text = await res.text()
      console.log('Response preview:', text.slice(0, 500))
    }

    if (res.status === 503) {
      console.log('🔴 Workshop API returned 503!')
    } else if (res.ok) {
      console.log('🟢 Workshop API OK')
    } else {
      console.log('🟡 Workshop API returned', res.status)
    }
  } catch (err) {
    console.log('❌ Workshop API fetch error:', err.message)
  }
}

async function testWorkshopStream() {
  console.log('\n=== Test 3: Workshop Chat API (streaming) ===')
  const APP_URL = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'

  try {
    const res = await fetch(`${APP_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Count from 1 to 5.' }],
        stream: true,
      }),
    })

    console.log('Status:', res.status, res.statusText)
    const contentType = res.headers.get('content-type')
    console.log('Content-Type:', contentType)

    if (res.status === 503) {
      console.log('🔴 Workshop stream API returned 503!')
      const text = await res.text()
      console.log('Body:', text.slice(0, 500))
      return
    }

    if (!res.ok) {
      console.log('🟡 Workshop stream API returned', res.status)
      const text = await res.text()
      console.log('Body:', text.slice(0, 500))
      return
    }

    if (!res.body) {
      console.log('❌ No response body')
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let chunkCount = 0
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      chunkCount++
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || parsed.content || ''
            if (content) fullText += content
          } catch {}
        }
      }
      if (chunkCount > 100) break
    }

    console.log(`🟢 Stream OK, ${chunkCount} chunks, content: "${fullText.slice(0, 100)}..."`)
  } catch (err) {
    console.log('❌ Workshop stream API error:', err.message)
  }
}

async function testHermesGateway() {
  console.log('\n=== Test 4: Hermes Gateway ===')
  const HERMES_API_URL = env.HERMES_API_URL || 'http://127.0.0.1:8642/v1/chat/completions'
  const API_SERVER_KEY = env.API_SERVER_KEY

  try {
    const res = await fetch(HERMES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_SERVER_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'hermes-agent',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 100,
        temperature: 0.7,
        stream: false,
      }),
    })

    console.log('Status:', res.status, res.statusText)
    const text = await res.text()
    console.log('Response preview:', text.slice(0, 500))

    if (res.status === 503) {
      console.log('🔴 Hermes Gateway returned 503!')
    } else if (res.ok) {
      console.log('🟢 Hermes Gateway OK')
    } else {
      console.log('🟡 Hermes Gateway returned', res.status)
    }
  } catch (err) {
    console.log('❌ Hermes Gateway error:', err.message)
  }
}

async function main() {
  console.log('Workshop 503 Debug')
  console.log('Proxy:', PROXY)
  console.log('ZAI_BASE_URL:', env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4')

  await testZAI()
  await testWorkshopChat()
  await testWorkshopStream()
  await testHermesGateway()

  console.log('\n=== Done ===')
}

main().catch(console.error)
