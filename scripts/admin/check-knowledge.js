const { Pool } = require('pg')
const pool = new Pool({ host: '127.0.0.1', port: 5432, database: 'scholars_tea', user: 'zju321' })

async function main() {
  const { rows } = await pool.query('SELECT id, title, discipline, metadata FROM "KnowledgeDocument"')
  for (const r of rows) {
    const meta = JSON.parse(r.metadata || '{}')
    const sub = meta.subDiscipline || 'null'
    console.log(r.id.substring(0, 22) + ' | ' + (r.discipline || 'null').padEnd(22) + ' | ' + sub.padEnd(22) + ' | ' + r.title.substring(0, 45))
  }
  await pool.end()
}
main().catch(console.error)
