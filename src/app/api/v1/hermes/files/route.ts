import { NextResponse } from 'next/server'
import { readdirSync, statSync } from 'fs'
import { resolve, join } from 'path'

const BASE_DIRS = [
  '/data/home/zju321/scholars/tmp/sci-pdf',
  '/data/home/zju321/.hermes/scansci-pdf/papers',
]

interface FileInfo {
  name: string
  size: number
  modifiedAt: string
  url: string
  downloadUrl: string
}

export async function GET() {
  try {
    const fileMap = new Map<string, FileInfo>()

    for (const dir of BASE_DIRS) {
      try {
        const entries = readdirSync(dir)
        for (const name of entries) {
          if (fileMap.has(name)) continue // 去重，优先前面的目录
          const fullPath = join(dir, name)
          try {
            const stats = statSync(fullPath)
            if (!stats.isFile()) continue
            fileMap.set(name, {
              name,
              size: stats.size,
              modifiedAt: stats.mtime.toISOString(),
              url: `/api/v1/hermes/download?file=${encodeURIComponent(name)}`,
              downloadUrl: `/api/v1/hermes/download?file=${encodeURIComponent(name)}&download=1`,
            })
          } catch {
            // skip
          }
        }
      } catch {
        // Directory doesn't exist or is empty
      }
    }

    const files = Array.from(fileMap.values())
    // Sort by modification time descending
    files.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())

    return NextResponse.json({
      success: true,
      data: {
        files,
        baseDirs: BASE_DIRS,
      },
    })
  } catch (error) {
    console.error('[HermesFiles] Error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
