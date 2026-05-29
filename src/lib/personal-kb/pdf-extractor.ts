/**
 * 浏览器端 PDF 文本提取
 * 使用 pdf.js（pdfjs-dist）在浏览器内提取文本
 */

export interface PageQualityInfo {
  pageNum: number
  text: string
  quality: PdfQualityReport
}

export interface PdfExtractResult {
  text: string
  pages: PageQualityInfo[]
  pageCount: number
  charCount: number
  isScanned: boolean
  error?: string
  quality?: PdfQualityReport
}

export interface PdfQualityReport {
  /** 数学字符占总字符的比例 (0-1) */
  mathCharRatio: number
  /** 乱码/替换字符占总字符的比例 (0-1) */
  corruptedCharRatio: number
  /** 是否检测到可能需要特殊处理的公式 */
  hasFormulaWarning: boolean
  /** 检测到的字体列表 */
  fontNames: string[]
  /** 检测到的数学字体列表 */
  mathFonts: string[]
  /** 质量评分：good / fair / poor */
  grade: 'good' | 'fair' | 'poor'
}

// 数学字体名称模式
const MATH_FONT_PATTERNS = [
  /CMMI/i, /CMSY/i, /CMEX/i, /CMR/i, /CMB/i, /CMTT/i,
  /Math/i, /Symbol/i, /STIX/i, /LatinModernMath/i,
  /AsanaMath/i, /XITS/i, /LibertinusMath/i, /Euler/i,
  /MTSYN/i, /MTEXT/i, /Rmath/i, /CambriaMath/i,
]

// Unicode 数学字符范围
function isMathChar(char: string): boolean {
  const code = char.charCodeAt(0)
  return (
    (code >= 0x2200 && code <= 0x22FF) || // Mathematical Operators
    (code >= 0x2A00 && code <= 0x2AFF) || // Supplemental Mathematical Operators
    (code >= 0x2100 && code <= 0x214F) || // Letterlike Symbols
    (code >= 0x1D400 && code <= 0x1D7FF) || // Mathematical Alphanumeric Symbols
    (code >= 0x03B1 && code <= 0x03C9) || // Greek lowercase
    (code >= 0x0391 && code <= 0x03A9) || // Greek uppercase
    (code >= 0x2200 && code <= 0x221E) // Common math symbols
  )
}

// 检测替换字符/乱码/控制字符
function isCorruptedChar(char: string): boolean {
  const code = char.charCodeAt(0)
  return (
    code === 0xFFFD || // Replacement Character (�)
    code === 0x0000 || // Null
    (code >= 0x0001 && code <= 0x001F) || // C0 Control
    (code >= 0x007F && code <= 0x009F) || // C1 Control
    code === 0x200B || // Zero Width Space (often inserted by bad mapping)
    code === 0xFEFF // BOM
  )
}

/**
 * 检测是否存在字体映射错误导致的重复字符模式（如 EE, UU, ωω, ββββ）
 *
 * 策略：检测 2+ 重复（捕获真正的乱码），但过滤已知的正常模式（避免误报）。
 * 乱码通常密集出现，正常模式通常孤立出现。
 */
function hasRepeatedCharPattern(text: string): boolean {
  const NORMAL_PATTERNS = new Set([
    // 罗马数字
    'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII',
    // 常见缩写（会议、期刊、机构等）
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

  // 处理 pdf.js textItem 之间插入空格导致的重复字符被分隔
  // 例如：['E', 'E'] → .join(' ') → 'E E'，检测前先去空格恢复 'EE'
  const normalized = text.replace(/\s+/g, '')

  // 2. 大写 2+ 重复，过滤正常模式（罗马数字、常见缩写）
  const upperMatches = normalized.match(/\b([A-Z])\1{1,}\b/g)
  if (upperMatches) {
    const badMatches = upperMatches.filter((m) => !NORMAL_PATTERNS.has(m))
    if (badMatches.length > 0) return true
  }

  // 3. 连续 2+ 相同希腊字母（如 ωω, ββββ）—— 正常文本中极少出现
  if (/([\u03B1-\u03C9\u0391-\u03A9])\1{1,}/.test(normalized)) return true

  // 4. 连续 2+ 相同数学符号（如 ∂∂, ∇∇, ∫∫）—— 正常文本中极少出现
  if (/([\u2200-\u22FF\u2A00-\u2AFF])\1{1,}/.test(normalized)) return true

  // 5. 等号附近的重复字母对（如 "EE = UU" "XX = YY"）—— 极强的乱码信号
  if (/\b([A-Z])\1\b[=+\-*/]\b([A-Z])\2\b/.test(normalized)) return true

  // 6. 形如 "XX(" 的函数模式（大写双字母+括号）—— 如 "EE(", "UU(" 等
  const funcMatches = normalized.match(/\b([A-Z])\1\(/g)
  if (funcMatches) {
    const badFuncMatches = funcMatches.filter((m) => {
      const matchResult = m.match(/([A-Z])\1/)
      if (!matchResult) return false
      return !NORMAL_PATTERNS.has(matchResult[0])
    })
    if (badFuncMatches.length > 0) return true
  }

  // 7. 小写重复字母在数学运算符后（如 "= ee", "· ii"）
  if (/[=+\-*·∂∇∫∑∏√]([a-z])\1{1,}/.test(normalized)) return true

  return false
}

/** 检测文本中是否存在替换字符（�） */
function hasReplacementChar(text: string): boolean {
  return text.includes('\uFFFD')
}

function isMathFont(fontName: string): boolean {
  return MATH_FONT_PATTERNS.some((p) => p.test(fontName))
}

function analyzeTextQuality(text: string, fontNames: string[]): PdfQualityReport {
  let mathCharCount = 0
  let corruptedCount = 0
  let total = 0

  for (const char of text) {
    if (/\s/.test(char)) continue
    total++
    if (isMathChar(char)) mathCharCount++
    if (isCorruptedChar(char)) corruptedCount++
  }

  const mathFonts = fontNames.filter(isMathFont)
  const mathCharRatio = total > 0 ? mathCharCount / total : 0
  const corruptedCharRatio = total > 0 ? corruptedCount / total : 0

  // 判定质量等级 —— 只基于真正的乱码信号，公式多≠乱码
  const hasReplaceChar = hasReplacementChar(text)
  const hasRepeatPattern = hasRepeatedCharPattern(text)

  let grade: PdfQualityReport['grade'] = 'good'
  if (corruptedCharRatio > 0.008 || hasReplaceChar || (hasRepeatPattern && corruptedCharRatio > 0)) {
    grade = 'poor'
  } else if (corruptedCharRatio > 0.003 || hasRepeatPattern) {
    grade = 'fair'
  }

  // hasFormulaWarning：只在检测到实际乱码信号时触发，数学字体/公式多≠乱码
  const hasFormulaWarning =
    corruptedCharRatio > 0.005 ||
    hasReplaceChar ||
    hasRepeatPattern

  return {
    mathCharRatio,
    corruptedCharRatio,
    hasFormulaWarning,
    fontNames: Array.from(new Set(fontNames)),
    mathFonts: Array.from(new Set(mathFonts)),
    grade,
  }
}

// 懒加载 pdf.js，避免 SSR 问题
let pdfjsLib: typeof import('pdfjs-dist') | null = null
let workerInitialized = false

async function getPdfjs(): Promise<typeof import('pdfjs-dist')> {
  if (pdfjsLib) return pdfjsLib

  const pdfjs = await import('pdfjs-dist')

  // 使用本地 worker 文件（构建时从 node_modules 复制到 public/pdfjs/）
  if (!workerInitialized) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
    workerInitialized = true
  }

  pdfjsLib = pdfjs
  return pdfjs
}

/**
 * 从 File/Blob 提取 PDF 文本（逐页）
 * 改进版：支持公式检测、文本质量评估、逐页质量报告
 */
export async function extractTextFromPdf(
  file: File | Blob,
  maxPages?: number
): Promise<PdfExtractResult> {
  try {
    const pdfjs = await getPdfjs()
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

    const pageCount = pdf.numPages
    const limit = maxPages ? Math.min(maxPages, pageCount) : pageCount

    let fullText = ''
    const allFontNames: string[] = []
    const pages: PageQualityInfo[] = []

    for (let i = 1; i <= limit; i++) {
      const page = await pdf.getPage(i)
      // includeMarkedContent 可以获取更丰富的结构信息
      const content = await page.getTextContent({ includeMarkedContent: true })

      const pageFontNames: string[] = []
      const pageTextParts: string[] = []

      for (const item of content.items) {
        if (!item || typeof item !== 'object') continue
        // TextItem has 'str' and 'fontName'
        if ('str' in item && typeof (item as any).str === 'string') {
          const textItem = item as any
          pageTextParts.push(textItem.str)
          if (textItem.fontName) {
            pageFontNames.push(String(textItem.fontName))
          }
        }
      }

      const pageText = pageTextParts
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      const pageQuality = analyzeTextQuality(pageText, pageFontNames)

      console.log(`[PDF-Extractor] Page ${i}: grade=${pageQuality.grade}, hasFormulaWarning=${pageQuality.hasFormulaWarning}, corrupted=${pageQuality.corruptedCharRatio.toFixed(4)}, math=${pageQuality.mathCharRatio.toFixed(4)}, textLen=${pageText.length}`)
      if (pageQuality.grade !== 'good' || pageQuality.hasFormulaWarning) {
        console.log(`[PDF-Extractor] Page ${i} sample:`, pageText.slice(0, 200))
      }

      pages.push({
        pageNum: i,
        text: pageText,
        quality: pageQuality,
      })

      if (pageText) {
        fullText += pageText + '\n\n'
        allFontNames.push(...pageFontNames)
      }
    }

    // 清理
    fullText = fullText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim()

    const charCount = fullText.length
    const isScanned = charCount < 500 && pageCount > 2

    const quality = analyzeTextQuality(fullText, allFontNames)

    return {
      text: fullText,
      pages,
      pageCount,
      charCount,
      isScanned,
      quality,
    }
  } catch (err) {
    return {
      text: '',
      pages: [],
      pageCount: 0,
      charCount: 0,
      isScanned: false,
      error: err instanceof Error ? err.message : 'PDF 解析失败',
    }
  }
}

/**
 * 从 TXT 文件提取文本
 */
export async function extractTextFromTxt(file: File | Blob): Promise<PdfExtractResult> {
  try {
    const text = await file.text()
    return {
      text: text.trim(),
      pages: [{ pageNum: 1, text: text.trim(), quality: analyzeTextQuality(text.trim(), []) }],
      pageCount: 1,
      charCount: text.length,
      isScanned: false,
    }
  } catch (err) {
    return {
      text: '',
      pages: [],
      pageCount: 0,
      charCount: 0,
      isScanned: false,
      error: err instanceof Error ? err.message : '文本读取失败',
    }
  }
}

/**
 * 通用文件提取入口
 */
export async function extractTextFromFile(file: File): Promise<PdfExtractResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    return extractTextFromPdf(file)
  }
  if (ext === 'txt' || ext === 'md') {
    return extractTextFromTxt(file)
  }

  return {
    text: '',
    pages: [],
    pageCount: 0,
    charCount: 0,
    isScanned: false,
    error: `不支持的文件格式: .${ext}，请上传 PDF 或 TXT 文件`,
  }
}
