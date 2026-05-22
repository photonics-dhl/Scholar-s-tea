import { readFile } from 'fs/promises'
import { join } from 'path'

export interface PdfParseResult {
  text: string
  numpages: number
  info: Record<string, unknown>
  totalLength?: number
  wasTruncated?: boolean
  error?: string
}

/**
 * 使用 pdf2json 解析 PDF Buffer 为文本
 */
function parsePdfBuffer(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      // 动态导入 pdf2json（webpack external，避免打包）
      const { default: PDFParser } = await import('pdf2json')
      const parser = new PDFParser()

      parser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          const numpages = pdfData.Pages?.length || 0
          let text = ''
          for (const page of pdfData.Pages || []) {
            const pageTexts = (page.Texts || []).map((t: any) => {
              return (t.R || []).map((r: any) => {
                const raw = r.T || ''
                try {
                  return decodeURIComponent(raw)
                } catch {
                  // 某些 PDF 包含不规范的 % 转义序列，直接返回原始文本
                  return raw
                }
              }).join('')
            })
            text += pageTexts.join(' ') + '\n\n'
          }
          resolve({ text: text.trim(), numpages })
        } catch (err) {
          reject(err)
        }
      })

      parser.on('pdfParser_dataError', (err: any) => {
        reject(new Error(err.parserError || 'PDF parse error'))
      })

      parser.parseBuffer(buffer)
    } catch (err) {
      console.error('[pdf-parser] parsePdfBuffer error:', err)
      reject(err)
    }
  })
}

/**
 * 智能截断：保留论文的开头（标题/摘要/引言/方法）和结尾（讨论/结论/参考文献），
 * 中间部分标注省略。比简单硬截断更利于 AI 理解全文结构。
 *
 * @param text 完整文本
 * @param maxLength 最大返回字符数（包含省略提示本身）
 * @returns { text: 截断后的文本, wasTruncated: 是否发生了截断 }
 */
function smartTruncate(text: string, maxLength: number): { text: string; wasTruncated: boolean } {
  if (text.length <= maxLength) {
    return { text, wasTruncated: false }
  }

  // 为省略提示预留空间（约 120 字符）
  const reservedForEllipsis = 120
  const available = maxLength - reservedForEllipsis

  // 开头 55% + 结尾 40%，留 5% 缓冲
  const headRatio = 0.55
  const tailRatio = 0.40
  const headSize = Math.floor(available * headRatio)
  const tailSize = Math.floor(available * tailRatio)

  const head = text.slice(0, headSize)
  const tail = text.slice(-tailSize)
  const skipped = text.length - headSize - tailSize

  const truncated =
    head +
    `\n\n... [此处省略 ${skipped.toLocaleString()} 字符的中间内容（策略：保留开头 ${headSize.toLocaleString()} 字符 + 结尾 ${tailSize.toLocaleString()} 字符）] ...\n\n` +
    tail

  return { text: truncated, wasTruncated: true }
}

/**
 * 从本地文件路径提取 PDF 文本内容
 * @param filePath 本地绝对路径或相对于项目根目录的路径
 * @param maxLength 最大返回字符数（默认 50000，约 1.5-2 万 token）
 */
export async function extractTextFromPdf(
  filePath: string,
  maxLength = 30000
): Promise<PdfParseResult> {
  try {
    const resolvedPath = filePath.startsWith('/')
      ? filePath
      : join(process.cwd(), filePath)

    const buffer = await readFile(resolvedPath)

    const { text, numpages } = await parsePdfBuffer(buffer)

    const cleanText = text.replace(/\n{3,}/g, '\n\n').trim()
    const totalLength = cleanText.length

    const { text: truncatedText, wasTruncated } = smartTruncate(cleanText, maxLength)

    return {
      text: truncatedText,
      numpages,
      totalLength,
      wasTruncated,
      info: {},
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    console.error('[pdf-parser] extractTextFromPdf error:', message)
    return {
      text: '',
      numpages: 0,
      info: {},
      error: `PDF 解析失败: ${message}`,
    }
  }
}

/**
 * 从 Buffer 提取 PDF 文本内容（用于前端直传，避免磁盘 I/O）
 * @param buffer PDF 文件 Buffer
 * @param maxLength 最大返回字符数（默认 50000）
 */
export async function extractTextFromPdfBuffer(
  buffer: Buffer,
  maxLength = 30000
): Promise<PdfParseResult> {
  try {
    const { text, numpages } = await parsePdfBuffer(buffer)
    const cleanText = text.replace(/\n{3,}/g, '\n\n').trim()
    const totalLength = cleanText.length

    const { text: truncatedText, wasTruncated } = smartTruncate(cleanText, maxLength)

    return {
      text: truncatedText,
      numpages,
      totalLength,
      wasTruncated,
      info: {},
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    return {
      text: '',
      numpages: 0,
      info: {},
      error: `PDF 解析失败: ${message}`,
    }
  }
}

/**
 * 判断附件是否为 PDF
 */
export function isPdfAttachment(name: string): boolean {
  return name.toLowerCase().endsWith('.pdf')
}
