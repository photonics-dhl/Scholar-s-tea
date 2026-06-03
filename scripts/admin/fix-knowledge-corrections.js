/**
 * Targeted corrections for knowledge base classification
 */
const { Pool } = require('pg')
const pool = new Pool({ host: '127.0.0.1', port: 5432, database: 'scholars_tea', user: 'zju321' })

const CORRECTIONS = [
  // Metasurface papers -> optics
  {
    id: 'cmphwatii0000h9d41ee6pzai',
    discipline: 'optics',
    subDiscipline: 'nano-optics',
    tags: ['Metasurface', 'Nanostructure', 'Original Research', 'Diffraction', 'AR/VR', 'Display Technology'],
  },
  {
    id: 'cmphwauo90001h9d4dq7ocp7g',
    discipline: 'optics',
    subDiscipline: 'nano-optics',
    tags: ['Metasurface', 'Nanostructure', 'Original Research', 'Optical Sensing', 'Resonator'],
  },
  {
    id: 'cmphwaw070002h9d4djnsv930',
    discipline: 'optics',
    subDiscipline: 'nano-optics',
    tags: ['Metasurface', 'Nanostructure', 'Original Research', 'Optical Sensing'],
  },
  // AI papers currently under computer-science -> artificial-intelligence
  {
    id: 'cmp6vgzni000311t6rmshkkko',
    discipline: 'artificial-intelligence',
    subDiscipline: 'computer-vision',
    tags: ['Deep Learning', 'Computer Vision', 'Transformer', 'Original Research'],
  },
  {
    id: 'cmozfbtpz000213jmqxc5xv06',
    discipline: 'artificial-intelligence',
    subDiscipline: 'deep-learning',
    tags: ['Deep Learning', 'Optimization', 'Original Research'],
  },
  {
    id: 'cmozfbtpz000013jmdpxgkvjf',
    discipline: 'artificial-intelligence',
    subDiscipline: 'deep-learning',
    tags: ['Deep Learning', 'Transformer', 'Review'],
  },
  // Graphene -> materials-science
  {
    id: 'cmozfbtpz000413jm019geprg',
    discipline: 'materials-science',
    subDiscipline: '2d-materials',
    tags: ['2D Material', 'Optoelectronic Materials', 'Nanostructure', 'Original Research'],
  },
]

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const corr of CORRECTIONS) {
      const { rows } = await client.query(
        'SELECT title, metadata FROM "KnowledgeDocument" WHERE id = $1',
        [corr.id]
      )
      if (rows.length === 0) {
        console.log('NOT FOUND:', corr.id)
        continue
      }

      let meta = {}
      try {
        meta = JSON.parse(rows[0].metadata || '{}')
      } catch {}

      meta.subDiscipline = corr.subDiscipline
      meta.tags = corr.tags

      await client.query(
        'UPDATE "KnowledgeDocument" SET discipline = $1, metadata = $2, "updatedAt" = NOW() WHERE id = $3',
        [corr.discipline, JSON.stringify(meta), corr.id]
      )

      console.log('FIXED:', rows[0].title.substring(0, 45))
      console.log('  ->', corr.discipline, '/', corr.subDiscipline)
    }

    await client.query('COMMIT')

    // Verify
    const { rows } = await client.query(
      'SELECT discipline, COUNT(*) as count FROM "KnowledgeDocument" GROUP BY discipline ORDER BY count DESC'
    )
    console.log('\n=== Final distribution ===')
    for (const r of rows) {
      console.log(' ', (r.discipline || 'NULL').padEnd(25), r.count)
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
