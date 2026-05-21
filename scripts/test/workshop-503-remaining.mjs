#!/usr/bin/env node
const APP_URL = process.env.APP_URL || 'http://localhost:3002'

async function testAPI(path, body, label) {
  console.log(`\n=== ${label} ===`)
  try {
    const res = await fetch(`${APP_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    console.log('Status:', res.status, res.statusText)
    const contentType = res.headers.get('content-type')

    if (res.status === 503) {
      const text = await res.text()
      console.log('🔴 503 BODY:', text.slice(0, 2000))
      return { status: 503 }
    }

    if (contentType?.includes('application/json')) {
      const data = await res.json()
      console.log('JSON:', JSON.stringify(data, null, 2).slice(0, 500))
      return { status: res.status, data }
    }

    const text = await res.text()
    console.log('Text:', text.slice(0, 500))
    return { status: res.status, text }
  } catch (err) {
    console.log('❌ Fetch error:', err.message)
    return { error: true, message: err.message }
  }
}

async function testStreamRaw(label, body) {
  console.log(`\n=== ${label} ===`)
  try {
    const res = await fetch(`${APP_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    console.log('Status:', res.status)
    if (!res.ok) {
      const text = await res.text()
      console.log('Body:', text.slice(0, 500))
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
      if (Date.now() - start > 15000) break
    }
    console.log(`Chunks: ${chunks}, Raw length: ${raw.length}`)
    console.log('Raw SSE preview:', raw.slice(0, 2000))
  } catch (err) {
    console.log('❌ Error:', err.message)
  }
}

async function main() {
  // 继续超时前的测试
  await testAPI('/api/v1/ai/chat', {
    action: 'grant', topic: 'NSF quantum', stream: false,
  }, 'Test: grant (non-stream)')

  await testAPI('/api/v1/ai/chat', {
    action: 'survey', topic: 'LLM research', stream: false,
  }, 'Test: survey (non-stream)')

  await testAPI('/api/v1/ai/chat', {
    action: 'analyze', content: 'Test paper abstract.', stream: false,
  }, 'Test: analyze (non-stream)')

  // 长 prompt
  await testAPI('/api/v1/ai/chat', {
    messages: [{ role: 'user', content: 'Summarize:\n\n' + 'A'.repeat(30000) }],
    stream: false,
  }, 'Test: long prompt 30K (non-stream)')

  await testAPI('/api/v1/ai/chat', {
    messages: [{ role: 'user', content: 'Summarize:\n\n' + 'A'.repeat(50000) }],
    stream: false,
  }, 'Test: long prompt 50K (non-stream)')

  // 查看原始 SSE
  await testStreamRaw('Raw SSE: normal chat', {
    messages: [{ role: 'user', content: 'Say "OK".' }],
    stream: true,
  })

  await testStreamRaw('Raw SSE: paper gen stream', {
    action: 'paper_generation',
    topic: 'Test',
    stage: 'proposal',
    stream: true,
  })

  console.log('\n=== Done ===')
}

main().catch(console.error)
