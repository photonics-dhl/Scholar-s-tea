/**
 * Batch reindex knowledge documents without embeddings.
 * Usage: npx tsx scripts/admin/reindex-knowledge.ts [--dry-run] [--batch-size=10] [--delay=500]
 */

import { prisma } from '../../src/lib/db/prisma'
import { generateEmbedding } from '../../src/lib/ai/rag-service'

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10)
const DELAY_MS = parseInt(process.env.DELAY_MS || '500', 10)
const DRY_RUN = process.argv.includes('--dry-run')
const ALL = process.argv.includes('--all')

async function main() {
  let docs: Array<{ id: string; title: string; content: string; source: string | null; discipline: string | null }> = []

  if (ALL) {
    docs = await prisma.knowledgeDocument.findMany({
      select: { id: true, title: true, content: true, source: true, discipline: true },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    docs = await prisma.$queryRawUnsafe<
      Array<{ id: string; title: string; content: string; source: string | null; discipline: string | null }>
    >('SELECT id, title, content, source, discipline FROM KnowledgeDocument WHERE embedding IS NULL ORDER BY createdAt DESC')
  }

  console.log(`[Reindex] Found ${docs.length} documents without embedding`)
  console.log(`[Reindex] Batch size: ${BATCH_SIZE}, Delay: ${DELAY_MS}ms, Dry run: ${DRY_RUN}`)
  console.log('')

  if (docs.length === 0) {
    console.log('Nothing to reindex. Exiting.')
    await prisma.$disconnect()
    return
  }

  let success = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i]
    const num = i + 1
    const text = `${doc.title}\n\n${doc.content}`.slice(0, 8000)

    console.log(
      `[${num}/${docs.length}] ${doc.id} | ${doc.source || 'unknown'} | ${doc.discipline || 'n/a'} | "${doc.title.slice(0, 60)}${doc.title.length > 60 ? '...' : ''}"`
    )

    if (DRY_RUN) {
      skipped++
      continue
    }

    try {
      const result = await generateEmbedding(text)

      if (result.error || !result.embedding || result.embedding.length === 0) {
        console.error(`  -> FAILED: ${result.error || 'empty embedding'}`)
        failed++
        continue
      }

      const embStr = '[' + result.embedding.join(',') + ']'
      await prisma.$executeRaw`
        UPDATE "KnowledgeDocument"
        SET embedding = ${embStr}::vector
        WHERE id = ${doc.id}
      `

      success++
      console.log(`  -> OK: dim=${result.embedding.length}`)

      // Rate limit protection
      if (i < docs.length - 1 && DELAY_MS > 0) {
        await new Promise((r) => setTimeout(r, DELAY_MS))
      }
    } catch (err) {
      console.error(`  -> ERROR: ${err instanceof Error ? err.message : String(err)}`)
      failed++
    }
  }

  console.log('')
  console.log('========================================')
  console.log(`Total:    ${docs.length}`)
  console.log(`Success:  ${success}`)
  console.log(`Failed:   ${failed}`)
  console.log(`Skipped:  ${skipped}`)
  console.log('========================================')

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('Fatal error:', err)
  await prisma.$disconnect()
  process.exit(1)
})
