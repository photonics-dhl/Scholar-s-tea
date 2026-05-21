#!/usr/bin/env node
/**
 * Workshop 503 深度排查 — 测试特殊 action 和边界场景
 */

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
      console.log('🔴 503 BODY:', text.slice(0, 1000))
      return { status: 503, error: true }
    }

    if (contentType?.includes('text/event-stream')) {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let chunks = 0
      let content = ''
      const start = Date.now()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks++
        const txt = decoder.decode(value, { stream: true })
        for (const line of txt.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const p = JSON.parse(data)
              const c = p.choices?.[0]?.delta?.content || p.content || ''
              if (c) content += c
            } catch {}
          }
        }
        if (Date.now() - start > 30000) {
          console.log('⏱️ Stream timeout after 30s')
          break
        }
      }
      console.log(`🟢 Stream: ${chunks} chunks, ${content.length} chars`)
      return { status: res.status, stream: true, content }
    }

    if (contentType?.includes('application/json')) {
      const data = await res.json()
      if (!res.ok) {
        console.log('🟡 Error:', JSON.stringify(data, null, 2).slice(0, 500))
        return { status: res.status, error: true, data }
      }
      console.log('🟢 OK:', JSON.stringify(data, null, 2).slice(0, 300))
      return { status: res.status, data }
    }

    const text = await res.text()
    console.log('Body:', text.slice(0, 500))
    return { status: res.status, text }
  } catch (err) {
    console.log('❌ Fetch error:', err.message)
    return { error: true, message: err.message }
  }
}

async function main() {
  // 1. 普通聊天（已验证 OK）
  // 2. 论文生成（默认走 Hermes，会 fallback）
  await testAPI('/api/v1/ai/chat', {
    action: 'paper_generation',
    topic: 'Test paper generation',
    stage: 'proposal',
    stream: false,
  }, 'Test 1: paper_generation (non-stream)')

  // 3. 论文生成流式
  await testAPI('/api/v1/ai/chat', {
    action: 'paper_generation',
    topic: 'Test paper generation stream',
    stage: 'proposal',
    stream: true,
  }, 'Test 2: paper_generation (stream)')

  // 4. 同行评审
  await testAPI('/api/v1/ai/chat', {
    action: 'peer_review',
    content: 'This is a test paper abstract. The method is novel.',
    stream: false,
  }, 'Test 3: peer_review (non-stream)')

  // 5. 同行评审流式
  await testAPI('/api/v1/ai/chat', {
    action: 'peer_review',
    content: 'This is a test paper abstract. The method is novel.',
    stream: true,
  }, 'Test 4: peer_review (stream)')

  // 6. 基金申请
  await testAPI('/api/v1/ai/chat', {
    action: 'grant',
    topic: 'NSF proposal on quantum computing',
    stream: false,
  }, 'Test 5: grant (non-stream)')

  // 7. 文献综述
  await testAPI('/api/v1/ai/chat', {
    action: 'survey',
    topic: 'Large language models in scientific research',
    stream: false,
  }, 'Test 6: survey (non-stream)')

  // 8. 分析论文
  await testAPI('/api/v1/ai/chat', {
    action: 'analyze',
    content: 'This paper proposes a new optimization algorithm.',
    stream: false,
  }, 'Test 7: analyze (non-stream)')

  // 9. 带长文本的普通聊天（模拟 PDF 注入后的大 prompt）
  await testAPI('/api/v1/ai/chat', {
    messages: [
      { role: 'user', content: 'Summarize the following text:\n\n' + 'A'.repeat(30000) }
    ],
    stream: false,
  }, 'Test 8: long prompt (30K chars, non-stream)')

  // 10. 带长文本的流式聊天
  await testAPI('/api/v1/ai/chat', {
    messages: [
      { role: 'user', content: 'Summarize:\n\n' + 'A'.repeat(30000) }
    ],
    stream: true,
  }, 'Test 9: long prompt (30K chars, stream)')

  console.log('\n=== All tests done ===')
}

main().catch(console.error)
