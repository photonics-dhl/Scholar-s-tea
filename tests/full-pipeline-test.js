#!/usr/bin/env node
/**
 * 全链路端到端测试：PDF 公式修复 Pipeline
 *
 * 测试流程：
 * 1. 用 pdfjs-dist 提取 PDF 文本（模拟前端）
 * 2. 运行检测逻辑，找出 badPages（模拟前端）
 * 3. 调用 extract-pdf API（模拟前端上传）
 * 4. 验证返回结果是否还有乱码
 * 5. 如果有 pageResults，模拟前端合并
 * 6. 最终验证合并后的文本质量
 */

const fs = require('fs')
const path = require('path')

// 需要先安装 pdfjs-dist
// npm install pdfjs-dist

const PDF_PATH = process.argv[2] || path.join(__dirname, 'test-math-pdf.pdf')
const API_URL = process.argv[3] || 'http://localhost:3000/api/v1/knowledge/extract-pdf'

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

function hasRepeatedCharPattern(text) {
  if (text.includes('\uFFFD')) return true

  const upperMatches = text.match(/\b([A-Z])\1{1,}\b/g)
  if (upperMatches) {
    const badMatches = upperMatches.filter((m) => !NORMAL_PATTERNS.has(m))
    if (badMatches.length > 0) return true
  }

  if (/([\u03B1-\u03C9\u0391-\u03A9])\1{1,}/.test(text)) return true
  if (/([\u2200-\u22FF\u2A00-\u2AFF])\1{1,}/.test(text)) return true
  if (/\b([A-Z])\1\b\s*[=+\-*/]\s*\b([A-Z])\2\b/.test(text)) return true

  const funcMatches = text.match(/\b([A-Z])\1\s*\(/g)
  if (funcMatches) {
    const badFuncMatches = funcMatches.filter((m) => {
      const matchResult = m.match(/([A-Z])\1/)
      if (!matchResult) return false
      return !NORMAL_PATTERNS.has(matchResult[0])
    })
    if (badFuncMatches.length > 0) return true
  }

  if (/[=+\-*·\u2202\u2207\u222B\u2211\u220F\u221A]\s*([a-z])\1{1,}/.test(text)) return true
  return false
}

function isCorruptedChar(char) {
  const code = char.charCodeAt(0)
  return (
    code === 0xFFFD ||
    code === 0x0000 ||
    (code >= 0x0001 && code <= 0x001F) ||
    (code >= 0x007F && code <= 0x009F) ||
    code === 0x200B ||
    code === 0xFEFF
  )
}

function analyzePageQuality(text) {
  let corruptedCount = 0
  let total = 0
  for (const char of text) {
    if (/\s/.test(char)) continue
    total++
    if (isCorruptedChar(char)) corruptedCount++
  }
  const corruptedCharRatio = total > 0 ? corruptedCount / total : 0
  const hasRepeatPattern = hasRepeatedCharPattern(text)

  let grade = 'good'
  if (corruptedCharRatio > 0.008 || text.includes('\uFFFD') || (hasRepeatPattern && corruptedCharRatio > 0)) {
    grade = 'poor'
  } else if (corruptedCharRatio > 0.003 || hasRepeatPattern) {
    grade = 'fair'
  }

  const hasFormulaWarning = corruptedCharRatio > 0.005 || text.includes('\uFFFD') || hasRepeatPattern

  return { grade, hasFormulaWarning, corruptedCharRatio, hasRepeatPattern }
}

async function extractWithPdfJs(pdfPath) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = ''

  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const pdf = await pdfjs.getDocument({ data }).promise

  const pages = []
  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim()
    const quality = analyzePageQuality(pageText)

    pages.push({ pageNum: i, text: pageText, quality })
    fullText += pageText + '\n\n'
  }

  return { pages, fullText: fullText.trim(), pageCount: pdf.numPages }
}

async function callApi(filePath, originalText, badPages, pageCount) {
  const FormData = (await import('form-data')).default
  const form = new FormData()
  form.append('file', fs.createReadStream(filePath))
  form.append('originalText', originalText)
  form.append('badPages', JSON.stringify(badPages))
  form.append('pageCount', String(pageCount))

  const fetch = (await import('node-fetch')).default

  console.log(`\n[API] Calling ${API_URL}`)
  console.log(`[API] badPages: ${JSON.stringify(badPages)}`)
  console.log(`[API] pageCount: ${pageCount}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000000) // 50 min

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await res.json()
    return { status: res.status, data }
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

function verifyNoCorruption(text, label) {
  const hasCorruption = hasRepeatedCharPattern(text)
  const hasFFFD = text.includes('\uFFFD')
  const result = !hasCorruption && !hasFFFD

  console.log(`\n[Verify] ${label}`)
  console.log(`[Verify]   hasRepeatedCharPattern: ${hasCorruption}`)
  console.log(`[Verify]   hasReplacementChar: ${hasFFFD}`)
  console.log(`[Verify]   PASS: ${result}`)

  if (!result) {
    // 显示发现的乱码样本
    const upperMatches = text.match(/\b([A-Z])\1{1,}\b/g)
    if (upperMatches) {
      const bad = upperMatches.filter(m => !NORMAL_PATTERNS.has(m))
      if (bad.length > 0) console.log(`[Verify]   Bad patterns found: ${bad.slice(0, 10).join(', ')}`)
    }
    const greekMatches = text.match(/([\u03B1-\u03C9\u0391-\u03A9])\1{1,}/g)
    if (greekMatches) console.log(`[Verify]   Greek repeats: ${greekMatches.slice(0, 5).join(', ')}`)
  }

  return result
}

async function main() {
  console.log('=== Full Pipeline E2E Test ===')
  console.log(`PDF: ${PDF_PATH}`)
  console.log(`API: ${API_URL}`)

  if (!fs.existsSync(PDF_PATH)) {
    console.error(`PDF not found: ${PDF_PATH}`)
    process.exit(1)
  }

  // Step 1: Extract with pdf.js (simulate frontend)
  console.log('\n--- Step 1: Extract with pdf.js ---')
  const extractResult = await extractWithPdfJs(PDF_PATH)
  console.log(`Pages: ${extractResult.pageCount}`)
  console.log(`Total chars: ${extractResult.fullText.length}`)

  // Step 2: Detect bad pages (simulate frontend)
  console.log('\n--- Step 2: Detect bad pages ---')
  const badPages = extractResult.pages
    .filter(p => p.quality.grade === 'poor' || (p.quality.grade === 'fair' && p.quality.hasFormulaWarning))
    .map(p => p.pageNum)

  console.log(`Bad pages detected: ${JSON.stringify(badPages)}`)
  for (const p of extractResult.pages) {
    const flag = badPages.includes(p.pageNum) ? 'BAD' : 'OK '
    console.log(`  Page ${p.pageNum}: grade=${p.quality.grade} warning=${p.quality.hasFormulaWarning} corrRatio=${p.quality.corruptedCharRatio.toFixed(4)} ${flag}`)
  }

  // Verify original text quality
  const originalPass = verifyNoCorruption(extractResult.fullText, 'Original pdf.js text')

  if (badPages.length === 0) {
    console.log('\n[Result] No bad pages detected. Original text quality:', originalPass ? 'PASS' : 'FAIL')
    process.exit(originalPass ? 0 : 1)
  }

  // Step 3: Call API
  console.log('\n--- Step 3: Call extract-pdf API ---')
  const apiResult = await callApi(PDF_PATH, extractResult.fullText, badPages, extractResult.pageCount)

  console.log(`\n[API] Status: ${apiResult.status}`)
  console.log(`[API] Source: ${apiResult.data?.data?.source || 'N/A'}`)
  console.log(`[API] Success: ${apiResult.data?.success}`)

  if (!apiResult.data?.success) {
    console.error('[API] Error:', apiResult.data?.error?.message || 'Unknown error')
    process.exit(1)
  }

  const data = apiResult.data.data

  // Step 4: Merge results (simulate frontend)
  console.log('\n--- Step 4: Merge results (simulate frontend) ---')
  let mergedText = ''

  if (data.source === 'marker-selective' && data.pageResults) {
    for (let i = 1; i <= extractResult.pageCount; i++) {
      if (data.pageResults[String(i)]) {
        mergedText += data.pageResults[String(i)] + '\n\n'
      } else if (extractResult.pages[i - 1]) {
        mergedText += extractResult.pages[i - 1].text + '\n\n'
      }
    }
    console.log(`Merged from marker-selective, enhanced pages: ${JSON.stringify(data.enhancedPages)}`)
  } else if (data.text) {
    mergedText = data.text
    console.log(`Merged from ${data.source}`)
  }

  mergedText = mergedText.trim()
  console.log(`Merged text length: ${mergedText.length}`)

  // Step 5: Final verification
  console.log('\n--- Step 5: Final quality verification ---')
  const finalPass = verifyNoCorruption(mergedText, 'Final merged text')

  // Show snippets
  console.log('\n--- Snippets comparison ---')
  for (const bp of badPages.slice(0, 3)) {
    const original = extractResult.pages[bp - 1]?.text || ''
    const enhanced = data.pageResults?.[String(bp)] || '(no enhanced version)'
    console.log(`\nPage ${bp}:`)
    console.log(`  Original (first 200 chars): ${original.substring(0, 200)}`)
    console.log(`  Enhanced (first 200 chars): ${enhanced.substring(0, 200)}`)
  }

  console.log('\n=== TEST RESULT ===')
  console.log(`Original quality: ${originalPass ? 'PASS' : 'FAIL'}`)
  console.log(`Final quality:    ${finalPass ? 'PASS' : 'FAIL'}`)
  console.log(`API source:       ${data.source}`)

  process.exit(finalPass ? 0 : 1)
}

main().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
