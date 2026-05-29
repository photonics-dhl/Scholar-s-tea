import { NextRequest, NextResponse } from 'next/server'
import { chatWithZAI } from '@/lib/ai/zai-service'

const FIX_FORMULA_SYSTEM_PROMPT = `你是一位专业的学术文献整理专家，擅长将 PDF 提取的乱码公式修复为标准 LaTeX 格式。

任务：修复文本中的数学公式乱码（字体映射错误导致的重复字符、� 替换字符等），使用标准 LaTeX 语法。

规则：
1. 保留所有中文叙述、英文单词、段落结构不变
2. 只修复数学公式部分，将乱码转换为正确的 LaTeX
3. 行内公式用 $...$ 包裹，独立公式用 $$...$$ 包裹
4. 根据上下文推断正确的物理/数学含义
5. 不要添加原文中没有的内容
6. 下标用 _{}，上标用 ^{}，希腊字母用 \\omega、\\beta 等
7. 偏微分用 \\partial，积分用 \\int，矢量用 \\mathbf{}
8. 保持公式编号（如 (4), (5)）不变

示例修复：
输入: "EE = UU (yy, zz) · ee ii (ωω0 ∂∂ −ββββ) (4)"
输出: "$E = U(y, z) \\cdot e^{i(\\omega_0 t - \\beta z)}$ (4)"

绝对禁止输出以下内容（这些会被自动丢弃）：
- "原文："、"修正："、"分析："、"修复："等任何标注
- 思考过程、推理说明、步骤解释
- 任何非修复后正文的内容

只输出修复后的纯净文本。`

/**
 * 检测文本中是否存在明显的字体映射错误
 * 与前端的 hasRepeatedCharPattern 保持严格一致，避免检测阈值不一致导致漏检
 */
function hasCorruptedFormula(text: string): boolean {
  if (!text) return false

  const NORMAL_PATTERNS = new Set([
    'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII',
    'CC', 'BB', 'LL', 'PP', 'RR', 'SS', 'VV', 'WW', 'XX', 'YY', 'ZZ',
    'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG',
    'BA', 'BC', 'BD', 'BE', 'BF', 'BG',
    'CA', 'CB', 'CD', 'CE', 'CF', 'CG',
    'DA', 'DB', 'DC', 'DD', 'DE', 'DF', 'DG',
    'EA', 'EB', 'EC', 'ED', 'EF', 'EG',
    'FA', 'FB', 'FC', 'FD', 'FE', 'FF', 'FG',
    'GA', 'GB', 'GC', 'GD', 'GE', 'GF', 'GG',
  ])

  // 1. 替换字符（最高优先级乱码信号）
  if (text.includes('\uFFFD')) return true

  // 2. 大写 2+ 重复，过滤正常模式（与前端一致）
  const upperMatches = text.match(/\b([A-Z])\1{1,}\b/g)
  if (upperMatches) {
    const badMatches = upperMatches.filter((m) => !NORMAL_PATTERNS.has(m))
    if (badMatches.length > 0) return true
  }

  // 3. 连续 2+ 相同希腊字母
  if (/([\u03B1-\u03C9\u0391-\u03A9])\1{1,}/.test(text)) return true

  // 4. 连续 2+ 相同数学符号
  if (/([\u2200-\u22FF\u2A00-\u2AFF])\1{1,}/.test(text)) return true

  // 5. 等号附近的重复字母对
  if (/\b([A-Z])\1\b\s*[=+\-*/]\s*\b([A-Z])\2\b/.test(text)) return true

  // 6. 函数模式 XX(
  const funcMatches = text.match(/\b([A-Z])\1\s*\(/g)
  if (funcMatches) {
    const badFuncMatches = funcMatches.filter((m) => {
      const matchResult = m.match(/([A-Z])\1/)
      if (!matchResult) return false
      return !NORMAL_PATTERNS.has(matchResult[0])
    })
    if (badFuncMatches.length > 0) return true
  }

  // 7. 小写重复在数学运算符后
  if (/[=+\-*·∂∇∫∑∏√]\s*([a-z])\1{1,}/.test(text)) return true

  return false
}

/**
 * PDF 公式修复 API
 * POST /api/v1/knowledge/extract-pdf
 * Body: FormData { file: File, originalText: string, badPages: string(JSON), pageCount: string }
 *
 * 流程：
 * 1. 接收前端 pdf.js 提取的文本 + 检测到的坏页面
 * 2. 如果没有坏页面，直接返回原文
 * 3. 如果有坏页面，用 LLM 直接修复整个文本
 * 4. LLM 失败时返回原文（不做任何处理）
 */
export async function POST(request: NextRequest) {
  let tempDir: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const originalText = formData.get('originalText') as string | null
    const badPagesStr = formData.get('badPages') as string | null
    const pageCountStr = formData.get('pageCount') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: '未选择文件' } },
        { status: 400 }
      )
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: { message: '仅支持 PDF 文件' } },
        { status: 400 }
      )
    }

    const badPages = badPagesStr ? (JSON.parse(badPagesStr) as number[]) : []
    const pageCount = pageCountStr ? parseInt(pageCountStr, 10) : 0

    // 没有坏页面，直接返回
    if (badPages.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          text: originalText || '',
          filename: file.name,
          source: 'pdfjs',
        },
      })
    }

    // 有坏页面，直接用 LLM 修复
    console.log(`[extract-pdf] ${badPages.length} bad pages detected, running LLM fix...`)
    const llmResult = await runLLMFix(originalText)

    if (llmResult) {
      return NextResponse.json({
        success: true,
        data: {
          text: llmResult,
          filename: file.name,
          source: 'llm-fix',
        },
      })
    }

    // LLM 修复失败，返回原文
    console.warn('[extract-pdf] LLM fix failed, returning original text')
    return NextResponse.json({
      success: true,
      data: {
        text: originalText || '',
        filename: file.name,
        source: 'pdfjs-fallback',
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'PDF 提取失败'
    console.error('[extract-pdf] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: errorMessage || 'PDF 提取失败',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * LLM 公式修复 fallback
 */
async function runLLMFix(originalText: string | null): Promise<string | null> {
  if (!originalText || originalText.length < 50) return null

  try {
    console.log('[extract-pdf] LLM formula fix...')
    const { content, error } = await chatWithZAI(
      [
        {
          role: 'user',
          content: `请修复以下从 PDF 提取的文本中的数学公式乱码，只输出修复后的纯净文本。\n\n${originalText.slice(0, 120000)}`,
        },
      ],
      {
        systemPrompt: FIX_FORMULA_SYSTEM_PROMPT,
        model: 'glm-5.1',
        maxTokens: 8192,
        temperature: 0.1,
      }
    )

    if (error) {
      console.warn('[extract-pdf] LLM fix API error:', error)
      return null
    }

    if (!content) {
      console.warn('[extract-pdf] LLM fix returned empty content')
      return null
    }

    // 后处理：过滤 LLM 可能输出的推理痕迹
    let cleaned = content
    // 移除常见的推理标注行
    cleaned = cleaned.replace(/^\s*(原文[：:]|修正[：:]|分析[：:]|修复[：:]|思考[：:]|说明[：:]).*$/gim, '')
    // 移除 "原文：... 修正：..." 格式
    cleaned = cleaned.replace(/原文[：:]\s*[^\n]*修正[：:]/gi, '')
    cleaned = cleaned.replace(/修正[：:]\s*/gi, '')
    // 移除空行过多的情况
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    cleaned = cleaned.trim()

    if (cleaned && !hasCorruptedFormula(cleaned)) {
      console.log('[extract-pdf] LLM fix succeeded.')
      return cleaned
    }

    if (cleaned) {
      console.warn('[extract-pdf] LLM fix returned but still has corrupted formulas, returning cleaned version')
      return cleaned
    }

    console.warn('[extract-pdf] LLM fix returned empty content')
    return null
  } catch (llmErr) {
    console.warn('[extract-pdf] LLM fix exception:', llmErr)
    return null
  }
}


