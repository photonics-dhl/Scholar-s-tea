const { Pool } = require('pg')
const pool = new Pool({ host: '127.0.0.1', port: 5432, database: 'scholars_tea', user: 'zju321' })

async function main() {
  const { rows } = await pool.query('SELECT id, title, metadata FROM "KnowledgeDocument" WHERE title LIKE $1', ['%超表面%'])
  for (const r of rows) {
    console.log('ID:', r.id)
    console.log('META:', r.metadata)
    console.log('---')
  }
  await pool.end()
}
main().catch(console.error)
