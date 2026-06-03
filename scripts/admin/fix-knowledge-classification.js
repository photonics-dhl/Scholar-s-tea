/**
 * Knowledge Base Classification Cleanup Script
 *
 * 1. Delete junk documents
 * 2. Normalize discipline values to standard English keys
 * 3. Infer and set subDiscipline + tags for all documents
 *
 * Run on remote server:
 *   cd ~/scholars && node scripts/admin/fix-knowledge-classification.js
 */

const { Pool } = require('pg')

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'scholars_tea',
  user: 'zju321',
})

// Documents to delete (junk / test data)
const JUNK_IDS = [
  'cmp6vgxvh000211t6xw57nspu', // Playwright automation test post
  'cmp6vgudi000011t6ql0z3r6y', // Login issue - not knowledge content
]

// Discipline normalization map (Chinese / informal -> standard value)
const DISCIPLINE_MAP = {
  '物理学': 'physics',
  '计算机科学': 'computer-science',
  '机器学习': 'artificial-intelligence',
  social: 'social-sciences',
}

/**
 * Infer classification from document title and existing metadata.
 * Returns { discipline, subDiscipline, tags }
 */
function inferFromTitle(title, existingMeta = {}) {
  const t = title.toLowerCase()
  const existingTags = existingMeta.tags || []

  // ============================================
  // Optics / Photonics
  // ============================================
  if (t.includes('超表面') || t.includes('metasurface')) {
    const baseTags = ['Metasurface', 'Nanostructure', 'Original Research']
    if (t.includes('吸收') || t.includes('吸收器')) {
      baseTags.push('Optical Sensing')
    }
    if (t.includes('传感器') || t.includes('传感')) {
      baseTags.push('Optical Sensing')
    }
    if (t.includes('衍射') || t.includes('光栅') || t.includes('grating')) {
      baseTags.push('Diffraction', 'AR/VR', 'Display Technology')
    }
    if (t.includes('fano') || t.includes('共振')) {
      baseTags.push('Resonator', 'Optical Sensing')
    }
    return {
      discipline: 'optics',
      subDiscipline: 'nano-optics',
      tags: [...new Set(baseTags)],
    }
  }

  // ============================================
  // Quantum (Physics)
  // ============================================
  if (t.includes('quantum supremacy') || t.includes('quantum computing')) {
    return {
      discipline: 'physics',
      subDiscipline: 'quantum-physics',
      tags: ['Quantum Information', 'Original Research', 'Experiment Paper'],
    }
  }
  if (t.includes('量子计算') || t.includes('量子')) {
    return {
      discipline: 'physics',
      subDiscipline: 'quantum-physics',
      tags: ['Quantum Information', 'Review'],
    }
  }

  // ============================================
  // AI / Deep Learning
  // ============================================
  if (t.includes('bert')) {
    return {
      discipline: 'artificial-intelligence',
      subDiscipline: 'nlp',
      tags: ['Deep Learning', 'NLP', 'Original Research'],
    }
  }
  if (t.includes('attention is all you need')) {
    return {
      discipline: 'artificial-intelligence',
      subDiscipline: 'deep-learning',
      tags: ['Deep Learning', 'Transformer', 'Original Research', 'NLP'],
    }
  }
  if (t.includes('transformer')) {
    if (t.includes('图像') || t.includes('image') || t.includes('vision')) {
      return {
        discipline: 'artificial-intelligence',
        subDiscipline: 'computer-vision',
        tags: ['Deep Learning', 'Computer Vision', 'Transformer', 'Original Research'],
      }
    }
    return {
      discipline: 'artificial-intelligence',
      subDiscipline: 'deep-learning',
      tags: ['Deep Learning', 'Transformer', 'Review'],
    }
  }
  if (t.includes('深度学习') || t.includes('deep learning')) {
    if (t.includes('优化') || t.includes('optimization')) {
      return {
        discipline: 'artificial-intelligence',
        subDiscipline: 'deep-learning',
        tags: ['Deep Learning', 'Optimization', 'Original Research'],
      }
    }
    return {
      discipline: 'artificial-intelligence',
      subDiscipline: 'deep-learning',
      tags: ['Deep Learning', 'Review'],
    }
  }
  if (t.includes('机器学习') || t.includes('machine learning')) {
    return {
      discipline: 'artificial-intelligence',
      subDiscipline: 'machine-learning',
      tags: ['Machine Learning', 'Deep Learning', 'Review'],
    }
  }

  // ============================================
  // Materials
  // ============================================
  if (t.includes('石墨烯') || t.includes('graphene')) {
    return {
      discipline: 'materials-science',
      subDiscipline: '2d-materials',
      tags: ['2D Material', 'Optoelectronic Materials', 'Nanostructure', 'Original Research'],
    }
  }

  // ============================================
  // Social Sciences / Academic Writing
  // ============================================
  if (t.includes('写作') || t.includes('writing') || t.includes('学术')) {
    return {
      discipline: 'social-sciences',
      subDiscipline: 'academic-writing',
      tags: ['Academic Writing', 'Review'],
    }
  }

  // Fallback: keep existing if present
  return { discipline: null, subDiscipline: null, tags: existingTags }
}

async function main() {
  const client = await pool.connect()
  console.log('Connected to database.')

  try {
    await client.query('BEGIN')

    // Step 1: Delete junk documents
    for (const id of JUNK_IDS) {
      const res = await client.query('DELETE FROM "KnowledgeDocument" WHERE id = $1 RETURNING title', [id])
      if (res.rowCount > 0) {
        console.log(`Deleted junk: "${res.rows[0].title}" (${id})`)
      }
    }

    // Step 2: Fetch remaining documents
    const { rows } = await client.query(
      'SELECT id, title, discipline, metadata FROM "KnowledgeDocument" ORDER BY "createdAt" DESC'
    )
    console.log(`\nProcessing ${rows.length} documents...\n`)

    for (const row of rows) {
      const rawDiscipline = row.discipline

      // Normalize existing discipline
      let normalizedDiscipline = DISCIPLINE_MAP[rawDiscipline] || rawDiscipline

      // Parse existing metadata
      let meta = {}
      try {
        meta = JSON.parse(row.metadata || '{}')
      } catch {
        meta = {}
      }

      // Infer from title
      const inferred = inferFromTitle(row.title, meta)

      // Use inferred discipline if current is null or non-standard
      const finalDiscipline = normalizedDiscipline || inferred.discipline
      const finalSubDiscipline = inferred.subDiscipline || meta.subDiscipline || null
      const finalTags = inferred.tags.length > 0 ? inferred.tags : (meta.tags || [])

      if (!finalDiscipline) {
        console.log(`SKIP (no discipline inferred): "${row.title}"`)
        continue
      }

      // Update metadata
      meta.subDiscipline = finalSubDiscipline
      meta.tags = finalTags

      // Execute update
      await client.query(
        'UPDATE "KnowledgeDocument" SET discipline = $1, metadata = $2, "updatedAt" = NOW() WHERE id = $3',
        [finalDiscipline, JSON.stringify(meta), row.id]
      )

      console.log(
        `UPDATED: "${row.title.substring(0, 50)}"`
      )
      console.log(`  discipline: ${rawDiscipline || 'null'} -> ${finalDiscipline}`)
      console.log(`  subDiscipline: ${finalSubDiscipline || 'null'}`)
      console.log(`  tags: [${finalTags.join(', ')}]`)
      console.log()
    }

    await client.query('COMMIT')
    console.log('All changes committed.')

    // Verify final state
    const verify = await client.query(
      'SELECT discipline, COUNT(*) as count FROM "KnowledgeDocument" GROUP BY discipline ORDER BY count DESC'
    )
    console.log('\n=== Final discipline distribution ===')
    for (const r of verify.rows) {
      console.log(`  ${r.discipline || 'NULL'}: ${r.count}`)
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Transaction rolled back due to error:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
