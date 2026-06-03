import { NextRequest, NextResponse } from 'next/server'
import { statSync, readdirSync } from 'fs'
import { resolve, basename } from 'path'
// archiver is externalized in webpack (CommonJS); use require for compatibility
// eslint-disable-next-line
const archiver = require('archiver') as any

const ALLOWED_BASE_DIRS = [
  resolve('/data/home/zju321/scholars/tmp/sci-pdf'),
  resolve('/data/home/zju321/.hermes/scansci-pdf/papers'),
  resolve('/data/home/zju321/.hermes/papers'),
]

function isWithinAllowedDir(targetPath: string): boolean {
  const resolved = resolve(targetPath)
  return ALLOWED_BASE_DIRS.some((dir) => resolved.startsWith(dir))
}

function sanitizeFilename(filename: string): string {
  return basename(filename).replace(/[<>:"|?*\x00-\x1f]/g, '_')
}

/** 模糊匹配：在目录中搜索包含 query 的文件名 */
function fuzzyFindFile(dir: string, query: string): string | null {
  try {
    const entries = readdirSync(dir)
    const lowerQuery = query.toLowerCase()

    for (const name of entries) {
      if (name.toLowerCase().includes(lowerQuery)) {
        const candidate = resolve(dir, name)
        try {
          const stats = statSync(candidate)
          if (stats.isFile()) return candidate
        } catch { /* ignore */ }
      }
    }

    const normalizedQuery = lowerQuery.replace(/[\/\.]/g, '_')
    for (const name of entries) {
      const normalizedName = name.toLowerCase().replace(/[\/\.]/g, '_')
      if (normalizedName.includes(normalizedQuery)) {
        const candidate = resolve(dir, name)
        try {
          const stats = statSync(candidate)
          if (stats.isFile()) return candidate
        } catch { /* ignore */ }
      }
    }

    if (lowerQuery.endsWith('.pdf')) {
      const baseQuery = lowerQuery.slice(0, -4)
      for (const name of entries) {
        const nameBase = name.toLowerCase().replace(/\.pdf$/i, '')
        if (nameBase.includes(baseQuery) || baseQuery.includes(nameBase)) {
          const candidate = resolve(dir, name)
          try {
            const stats = statSync(candidate)
            if (stats.isFile()) return candidate
          } catch { /* ignore */ }
        }
      }
    }
  } catch { /* directory not readable */ }
  return null
}

function findFile(safeName: string): string | null {
  for (const dir of ALLOWED_BASE_DIRS) {
    const candidate = resolve(dir, safeName)
    if (isWithinAllowedDir(candidate)) {
      try {
        const stats = statSync(candidate)
        if (stats.isFile()) return candidate
      } catch { /* ignore */ }
    }
  }
  for (const dir of ALLOWED_BASE_DIRS) {
    const matched = fuzzyFindFile(dir, safeName)
    if (matched && isWithinAllowedDir(matched)) return matched
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const files: string[] = Array.isArray(body.files) ? body.files : []

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'files array is required' } },
        { status: 400 }
      )
    }

    const foundFiles: { path: string; name: string }[] = []
    const notFound: string[] = []

    for (const file of files) {
      const safeName = sanitizeFilename(file)
      const filePath = findFile(safeName)
      if (filePath) {
        foundFiles.push({ path: filePath, name: basename(filePath) })
      } else {
        notFound.push(safeName)
      }
    }

    if (foundFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'No files found', notFound } },
        { status: 404 }
      )
    }

    const archive = archiver('zip', { zlib: { level: 6 } })

    for (const { path, name } of foundFiles) {
      archive.file(path, { name })
    }

    archive.finalize()

    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set(
      'Content-Disposition',
      `attachment; filename="papers_${Date.now()}.zip"`
    )

    return new Response(archive as any, { headers })
  } catch (error) {
    console.error('[BatchZip] Error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
