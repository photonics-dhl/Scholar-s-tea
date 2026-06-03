/**
 * Test BGE-M3 embedding search quality after reindex
 * Usage: npx tsx scripts/test-bge3-search.ts
 */

import { searchKnowledgeBase } from '../src/lib/ai/rag-service'

const TEST_QUERIES = [
  'reinforcement learning',
  'photonic metasurfaces',
  'quantum optics',
  'deep learning',
  'climate change',
]

async function main() {
  for (const query of TEST_QUERIES) {
    const { results, error } = await searchKnowledgeBase(query, { limit: 5, threshold: 0.5 })
    console.log(`\nQuery: "${query}"`)
    if (error) {
      console.log(`  ERROR: ${error}`)
      continue
    }
    if (results.length === 0) {
      console.log('  No results above threshold 0.5')
      continue
    }
    results.forEach((r, i) => {
      console.log(`  [${i + 1}] sim=${r.similarity.toFixed(4)} | ${r.discipline || 'n/a'} | "${r.title.slice(0, 60)}..."`)
    })
  }
}

main().catch(console.error)
