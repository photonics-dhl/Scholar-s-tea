const { Pool } = require('pg')
const pool = new Pool({ host: '127.0.0.1', port: 5432, database: 'scholars_tea', user: 'zju321' })

const FIXES = [
  {
    id: 'cmphwatii0000h9d41ee6pzai',
    tags: ['Metasurface', 'Nanostructure', 'Original Research', 'Diffraction', 'AR/VR', 'Display Technology'],
    subDiscipline: 'nano-optics',
  },
  {
    id: 'cmphwauo90001h9d4dq7ocp7g',
    tags: ['Metasurface', 'Nanostructure', 'Original Research', 'Optical Sensing', 'Resonator'],
    subDiscipline: 'nano-optics',
  },
  {
    id: 'cmphwaw070002h9d4djnsv930',
    tags: ['Metasurface', 'Nanostructure', 'Original Research', 'Optical Sensing'],
    subDiscipline: 'nano-optics',
  },
]

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const fix of FIXES) {
      const { rows } = await client.query('SELECT metadata FROM "KnowledgeDocument" WHERE id = $1', [fix.id])
      if (rows.length === 0) continue

      let meta = rows[0].metadata

      // Handle double-encoded JSON: unwrap one level if needed
      if (typeof meta === 'string' && meta.startsWith('"') && meta.endsWith('"')) {
        try {
          meta = JSON.parse(meta)
        } catch {}
      }

      // Now parse to object
      let metaObj = {}
      try {
        metaObj = JSON.parse(meta)
      } catch {
        metaObj = {}
      }

      metaObj.tags = fix.tags
      metaObj.subDiscipline = fix.subDiscipline

      await client.query(
        'UPDATE "KnowledgeDocument" SET metadata = $1, "updatedAt" = NOW() WHERE id = $2',
        [JSON.stringify(metaObj), fix.id]
      )

      console.log('Fixed double-encoded metadata:', fix.id)
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(console.error)
