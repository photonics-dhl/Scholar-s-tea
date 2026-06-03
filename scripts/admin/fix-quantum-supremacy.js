const { Pool } = require('pg')
const pool = new Pool({ host: '127.0.0.1', port: 5432, database: 'scholars_tea', user: 'zju321' })

async function main() {
  const meta = JSON.stringify({
    tags: ['Quantum Information', 'Original Research', 'Experiment Paper'],
    subDiscipline: 'quantum-physics',
    citationCount: 3000,
    year: 2019,
    doi: '10.1038/s41586-019-1666-5',
  })
  await pool.query(
    'UPDATE "KnowledgeDocument" SET metadata = $1, "updatedAt" = NOW() WHERE title = $2',
    [meta, 'Quantum Supremacy Using a Programmable Superconducting Processor']
  )
  console.log('Fixed Quantum Supremacy metadata')
  await pool.end()
}
main().catch(console.error)
