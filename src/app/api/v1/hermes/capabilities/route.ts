import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { parse } from 'yaml'
import { join } from 'path'
import { homedir } from 'os'

// Toolset metadata for UI badges
const TOOLSET_META: Record<string, { icon: string; label: string; color: string }> = {
  web: { icon: '🔍', label: 'Web 搜索', color: 'bg-blue-100 text-blue-700' },
  browser: { icon: '🌐', label: '浏览器自动化', color: 'bg-purple-100 text-purple-700' },
  code_execution: { icon: '⚡', label: '代码执行', color: 'bg-yellow-100 text-yellow-700' },
  vision: { icon: '👁️', label: '图像分析', color: 'bg-pink-100 text-pink-700' },
  image_gen: { icon: '🎨', label: '图像生成', color: 'bg-green-100 text-green-700' },
  skills: { icon: '📚', label: 'Skills', color: 'bg-indigo-100 text-indigo-700' },
  todo: { icon: '📋', label: '任务规划', color: 'bg-orange-100 text-orange-700' },
  memory: { icon: '💾', label: '记忆', color: 'bg-cyan-100 text-cyan-700' },
  session_search: { icon: '🔎', label: '会话搜索', color: 'bg-teal-100 text-teal-700' },
  clarify: { icon: '❓', label: '澄清问题', color: 'bg-gray-100 text-gray-700' },
}

export async function GET() {
  try {
    const hermesHome = process.env.HERMES_HOME || join(homedir(), '.hermes')
    const configPath = join(hermesHome, 'config.yaml')

    const configYaml = readFileSync(configPath, 'utf-8')
    const config = parse(configYaml)

    const toolsets: string[] = config?.platform_toolsets?.api_server || []

    const capabilities = toolsets.map((ts) => ({
      id: ts,
      ...TOOLSET_META[ts],
    }))

    return NextResponse.json({
      success: true,
      data: {
        capabilities,
        raw: toolsets,
      },
    })
  } catch (error) {
    console.error('[Hermes Capabilities] Error reading config:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to load capabilities',
        },
      },
      { status: 500 }
    )
  }
}
