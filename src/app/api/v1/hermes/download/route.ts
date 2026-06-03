import { NextRequest, NextResponse } from 'next/server'
import { createReadStream, statSync, readdirSync } from 'fs'
import { resolve, basename, extname } from 'path'

const ALLOWED_BASE_DIRS = [
  resolve('/data/home/zju321/scholars/tmp/sci-pdf'),
  resolve('/data/home/zju321/.hermes/scansci-pdf/papers'),
  resolve('/data/home/zju321/.hermes/papers'),
]

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.bib': 'application/x-bibtex',
  '.ris': 'application/x-research-info-systems',
  '.txt': 'text/plain',
  '.json': 'application/json',
}

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

    // 1. 包含完整 query
    for (const name of entries) {
      if (name.toLowerCase().includes(lowerQuery)) {
        const candidate = resolve(dir, name)
        try {
          const stats = statSync(candidate)
          if (stats.isFile()) return candidate
        } catch { /* ignore */ }
      }
    }

    // 2. 如果 query 是 DOI 格式（如 10.1103/PhysRevLett.119.113601），
    //    尝试匹配去掉斜杠/点后的变体
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

    // 3. 如果 query 以 .pdf 结尾，去掉后缀再试
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
  } catch {
    // directory not readable
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const file = searchParams.get('file')
    const download = searchParams.get('download') === '1'

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: 'file parameter is required' } },
        { status: 400 }
      )
    }

    const safeName = sanitizeFilename(file)

    // 1. 精确匹配
    let filePath: string | null = null
    for (const dir of ALLOWED_BASE_DIRS) {
      const candidate = resolve(dir, safeName)
      if (isWithinAllowedDir(candidate)) {
        try {
          const stats = statSync(candidate)
          if (stats.isFile()) {
            filePath = candidate
            break
          }
        } catch {
          // file not in this dir, try next
        }
      }
    }

    // 2. 模糊匹配（AI 生成的文件名可能和实际文件名不完全一致）
    if (!filePath) {
      for (const dir of ALLOWED_BASE_DIRS) {
        const matched = fuzzyFindFile(dir, safeName)
        if (matched && isWithinAllowedDir(matched)) {
          filePath = matched
          break
        }
      }
    }

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: { message: 'File not found' } },
        { status: 404 }
      )
    }

    const actualName = basename(filePath)
    const ext = extname(actualName).toLowerCase()
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'

    const stream = createReadStream(filePath)
    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${actualName}"`)

    return new Response(stream as any, { headers })
  } catch (error) {
    console.error('[HermesDownload] Error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
