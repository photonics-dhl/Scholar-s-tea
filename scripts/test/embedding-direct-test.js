#!/usr/bin/env node
/**
 * Direct embedding + similarity test (no TS transpiler needed)
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

async function test() {
  const apiKey = process.env.ZCHAT_API_KEY
  const baseUrl = process.env.ZCHAT_BASE_URL
  console.log('ZCHAT_API_KEY present:', !!apiKey)
  console.log('ZCHAT_BASE_URL:', baseUrl)

  if (!apiKey || !baseUrl) {
    console.log('SKIP: missing config')
    await prisma.$disconnect()
    return
  }

  // 1. Call embedding API directly
  console.log('\n--- Calling ZCHAT embedding API ---')
  let queryEmb = []
  try {
    const proxyUrl = process.env.http_proxy || process.env.https_proxy
    const fetchOpts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: 'Attention Is All You Need',
      }),
    }
    if (proxyUrl) {
      const { ProxyAgent } = require('undici')
      fetchOpts.dispatcher = new ProxyAgent(proxyUrl)
      console.log('Using proxy:', proxyUrl)
    }
    const res = await fetch(`${baseUrl}/embeddings`, fetchOpts)
    const data = await res.json()
    if (res.ok) {
      queryEmb = data.data?.[0]?.embedding || data.vectors?.[0] || []
      console.log('Embedding OK, dim:', queryEmb.length)
    } else {
      console.log('Embedding API error:', res.status, JSON.stringify(data).slice(0, 200))
    }
  } catch (e) {
    console.log('Embedding fetch error:', e.message)
  }

  // 2. Compare with KB docs
  console.log('\n--- Comparing with KB documents ---')
  const docs = await prisma.knowledgeDocument.findMany({
    where: {
      AND: [
        { embedding: { not: null } },
        { embedding: { not: '[]' } },
      ],
    },
    select: { id: true, title: true, source: true, embedding: true },
  })
  console.log('Docs with embedding:', docs.length)

  const results = []
  for (const doc of docs) {
    const emb = JSON.parse(doc.embedding)
    const sim = cosineSimilarity(queryEmb, emb)
    results.push({ title: doc.title, source: doc.source, sim })
  }
  results.sort((a, b) => b.sim - a.sim)
  results.forEach(r => {
    console.log(`  sim=${r.sim.toFixed(4)} [${r.source}] ${r.title.slice(0, 55)}`)
  })

  await prisma.$disconnect()
}

test().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
