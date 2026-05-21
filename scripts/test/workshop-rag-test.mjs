#!/usr/bin/env node
/**
 * Workshop RAG + API Integration Test
 */

import { getContextForQuery, generateEmbedding, searchKnowledgeBase } from '../../src/lib/ai/rag-service.ts'

// Since we're in Node.js outside Next.js, we need to manually import
// For simplicity, test via HTTP API instead

const BASE_URL = 'http://localhost:3002'

async function testRagRetrieval() {
  console.log('=== Test 1: Direct RAG Retrieval ===\n')

  // We'll test via importing the module directly
  // But since it's TS and depends on prisma, let's test via the API indirectly

  // Instead, test embedding generation
  console.log('--- Embedding API Test ---')
  const apiKey = process.env.ZCHAT_API_KEY
  const baseUrl = process.env.ZCHAT_BASE_URL

  if (!apiKey || !baseUrl) {
    console.log('SKIP: ZCHAT not configured')
    return
  }

  try {
    const res = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: 'quantum computing supremacy',
      }),
    })
    const data = await res.json()
    if (res.ok) {
      const emb = data.data?.[0]?.embedding || data.vectors?.[0]
      console.log(`  Embedding OK: dim=${emb?.length || 'unknown'}`)
    } else {
      console.log(`  Embedding FAILED: ${res.status} ${JSON.stringify(data).slice(0,200)}`)
    }
  } catch (e) {
    console.log(`  Embedding ERROR: ${e.message}`)
  }
}

async function testWorkshopChat() {
  console.log('\n=== Test 2: Workshop Chat with RAG ===\n')

  const testQueries = [
    { q: '什么是量子计算', expectRag: true },
    { q: '深度学习入门', expectRag: true },
    { q: 'Attention Is All You Need', expectRag: true },
  ]

  for (const { q, expectRag } of testQueries) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: q }],
          stream: false,
          useRag: true,
        }),
      })
      const data = await res.json()
      const hasRag = data.data?.ragContext != null && data.data.ragContext.length > 0
      const contentPreview = (data.data?.content || '').slice(0, 60).replace(/\n/g, ' ')
      console.log(`  [${hasRag ? 'RAG' : 'NO-RAG'}] "${q.slice(0,20)}..." -> ${contentPreview}...`)
      if (expectRag && !hasRag) {
        console.log(`    ⚠️  Expected RAG but got none`)
      }
    } catch (e) {
      console.log(`  [ERROR] "${q.slice(0,20)}..." -> ${e.message}`)
    }
  }
}

async function testPaperGeneration() {
  console.log('\n=== Test 3: Paper Generation ===\n')

  try {
    const res = await fetch(`${BASE_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'paper_generation',
        topic: '量子计算在密码学中的应用',
        stage: 'proposal',
        stream: false,
      }),
    })
    const data = await res.json()
    const status = data.success ? 'OK' : `FAIL(${data.error?.code})`
    const preview = (data.data?.content || '').slice(0, 60).replace(/\n/g, ' ')
    console.log(`  [${status}] Paper generation -> ${preview}...`)
  } catch (e) {
    console.log(`  [ERROR] Paper generation -> ${e.message}`)
  }
}

async function testStreamMode() {
  console.log('\n=== Test 4: Stream Mode (SSE) ===\n')

  try {
    const res = await fetch(`${BASE_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: '简要介绍Transformer' }],
        stream: true,
        useRag: false,
      }),
    })

    if (!res.ok) {
      console.log(`  [FAIL] HTTP ${res.status}`)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let chunks = 0
    let text = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      chunks++
      // Extract data lines
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            console.log(`  [OK] SSE stream complete: ${chunks} chunks, ${text.length} chars`)
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.choices?.[0]?.delta?.content) {
              text += parsed.choices[0].delta.content
            }
          } catch {
            // ignore parse errors
          }
        }
      }
      if (chunks > 50) {
        console.log(`  [OK] SSE stream received ${chunks} chunks (truncated)`)
        reader.cancel()
        return
      }
    }
  } catch (e) {
    console.log(`  [ERROR] Stream -> ${e.message}`)
  }
}

async function main() {
  await testRagRetrieval()
  await testWorkshopChat()
  await testPaperGeneration()
  await testStreamMode()
  console.log('\n=== All Tests Complete ===')
}

main().catch(console.error)
