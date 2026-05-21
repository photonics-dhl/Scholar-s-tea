#!/usr/bin/env node
const APP_URL = process.env.APP_URL || 'http://localhost:3002'

async function dumpSSE(body) {
  const res = await fetch(`${APP_URL}/api/v1/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  console.log('HTTP Status:', res.status)
  if (!res.ok) {
    console.log('Body:', (await res.text()).slice(0, 500))
    return
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let raw = ''
  let chunks = 0
  const start = Date.now()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks++
    raw += decoder.decode(value, { stream: true })
    if (Date.now() - start > 10000) break
  }
  console.log(`Chunks: ${chunks}, Total bytes: ${raw.length}`)
  console.log('--- RAW SSE ---')
  console.log(raw)
  console.log('--- END ---')
}

// 普通聊天流式
dumpSSE({ messages: [{ role: 'user', content: 'Say exactly OK.' }], stream: true })
  .catch(console.error)
