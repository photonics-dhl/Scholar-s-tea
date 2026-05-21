#!/usr/bin/env node
/**
 * RAG Integration Test Script
 * Run on server: cd ~/scholars && node scripts/test/rag-integration-test.mjs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  console.log('=== Scholar\'s Tea RAG Integration Test ===\n')

  // 1. KB Document Stats
  const kbStats = await prisma.$queryRaw`
    SELECT source, COUNT(*) as count
    FROM "KnowledgeDocument"
    GROUP BY source
    ORDER BY count DESC
  `
  console.log('--- KB Documents by Source ---')
  kbStats.forEach(s => console.log(`  ${s.source || '(null)'}: ${s.count}`))

  const totalKb = await prisma.knowledgeDocument.count()
  const kbRaw = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "KnowledgeDocument"
    WHERE embedding IS NOT NULL AND embedding != '[]'
  `
  const withEmb = Number(kbRaw[0]?.count || 0)
  console.log(`\nTotal KB: ${totalKb} | With embedding: ${withEmb} | Empty: ${totalKb - withEmb}`)

  // 2. ResearchMemory
  const memTotal = await prisma.researchMemory.count()
  const memRaw = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "ResearchMemory"
    WHERE embedding IS NOT NULL AND embedding != '[]'
  `
  const memWithEmb = Number(memRaw[0]?.count || 0)
  console.log(`ResearchMemory: ${memTotal} total, ${memWithEmb} with embedding`)

  // 3. User academicProfile (raw SQL because PG 9.2 lacks jsonb)
  const userRaw = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "User" WHERE "academicProfile" IS NOT NULL
  `
  const usersWithProfile = Number(userRaw[0]?.count || 0)
  console.log(`\nUsers with academicProfile: ${usersWithProfile}`)

  // 4. Recent KB docs detail
  const recentDocs = await prisma.knowledgeDocument.findMany({
    take: 8,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      source: true,
      sourceId: true,
      embedding: true,
      updatedAt: true,
    },
  })
  console.log('\n--- Recent KB Documents ---')
  recentDocs.forEach(d => {
    const embStr = d.embedding
    const embLen = embStr && embStr !== '[]' ? JSON.parse(embStr).length : 0
    console.log(
      `  [${d.source?.padEnd(12)}] emb=${String(embLen).padStart(4)} | ${d.title.slice(0, 55)}`
    )
  })

  // 5. Check if generateEmbedding would work (ZCHAT config)
  const zchatKey = process.env.ZCHAT_API_KEY
  const zchatUrl = process.env.ZCHAT_BASE_URL
  console.log(`\n--- Embedding API Config ---`)
  console.log(`  ZCHAT_API_KEY: ${zchatKey ? 'set (' + zchatKey.slice(0, 8) + '...)' : 'MISSING'}`)
  console.log(`  ZCHAT_BASE_URL: ${zchatUrl || 'MISSING'}`)

  // 6. Try a live embedding test
  if (zchatKey && zchatUrl) {
    console.log('\n--- Live Embedding Test ---')
    try {
      const res = await fetch(`${zchatUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${zchatKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: 'test query for optics research',
        }),
      })
      const data = await res.json()
      if (res.ok && (data.data?.[0]?.embedding || data.vectors?.[0])) {
        const emb = data.data?.[0]?.embedding || data.vectors?.[0]
        console.log(`  Status: OK | Embedding dim: ${emb.length}`)
      } else {
        console.log(`  Status: ${res.status} | Keys: ${Object.keys(data).join(', ')}`)
      }
    } catch (e) {
      console.log(`  ERROR: ${e.message}`)
    }
  }

  await prisma.$disconnect()
  console.log('\n=== Test Complete ===')
}

test().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
