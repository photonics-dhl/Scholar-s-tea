#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

// Polyfill for pdfjs-dist in Node.js
global.DOMMatrix = class DOMMatrix {
  constructor(init) { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
}

const PDF_PATH = process.argv[2] || path.join(__dirname, 'corrupted-test.pdf')
const API_URL = process.argv[3] || 'http://localhost:3002/api/v1/knowledge/extract-pdf'

const NORMAL_PATTERNS = new Set([
  'II','III','IV','VI','VII','VIII','IX','XI','XII',
  'CC','BB','LL','PP','RR','SS','VV','WW','XX','YY','ZZ',
  'AA','AB','AC','AD','AE','AF','AG',
  'BA','BC','BD','BE','BF','BG',
  'CA','CB','CD','CE','CF','CG',
  'DA','DB','DC','DD','DE','DF','DG',
  'EA','EB','EC','ED','EF','EG',
  'FA','FB','FC','FD','FE','FF','FG',
  'GA','GB','GC','GD','GE','GF','GG',
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

async function extractWithPdfJs(pdfPath) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const pdf = await pdfjs.getDocument({ data }).promise

  const pages = []
  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim()
    const hasCorruption = hasRepeatedCharPattern(pageText)

    pages.push({ pageNum: i, text: pageText, hasCorruption })
    fullText += pageText + '\n\n'
  }

  return { pages, fullText: fullText.trim(), pageCount: pdf.numPages }
}

async function callApi(filePath, originalText, badPages, pageCount) {
  const FormData = require('form-data')
  const form = new FormData()
  form.append('file', fs.createReadStream(filePath))
  form.append('originalText', originalText)
  form.append('badPages', JSON.stringify(badPages))
  form.append('pageCount', String(pageCount))

  console.log('\n[API] Calling ' + API_URL)
  console.log('[API] badPages: ' + JSON.stringify(badPages))

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000000)

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

async function main() {
  console.log('=== Full Pipeline E2E Test ===')
  console.log('PDF: ' + PDF_PATH)
  console.log('API: ' + API_URL)

  if (!fs.existsSync(PDF_PATH)) {
    console.error('PDF not found: ' + PDF_PATH)
    process.exit(1)
  }

  // Step 1: Extract with pdf.js
  console.log('\n--- Step 1: Extract with pdf.js ---')
  const extractResult = await extractWithPdfJs(PDF_PATH)
  console.log('Pages: ' + extractResult.pageCount)

  const badPages = extractResult.pages.filter(p => p.hasCorruption).map(p => p.pageNum)
  console.log('Bad pages detected: ' + JSON.stringify(badPages))
  for (const p of extractResult.pages) {
    console.log('  Page ' + p.pageNum + ': corruption=' + p.hasCorruption)
    console.log('    text=' + p.text.substring(0, 200))
  }

  const originalHasCorruption = hasRepeatedCharPattern(extractResult.fullText)
  console.log('\nOriginal text has corruption: ' + originalHasCorruption)

  if (badPages.length === 0) {
    console.log('\n[Result] No bad pages detected.')
    process.exit(originalHasCorruption ? 1 : 0)
  }

  // Step 2: Call API
  console.log('\n--- Step 2: Call extract-pdf API ---')
  const apiResult = await callApi(PDF_PATH, extractResult.fullText, badPages, extractResult.pageCount)

  console.log('\n[API] Status: ' + apiResult.status)
  console.log('[API] Response source: ' + (apiResult.data?.data?.source || 'N/A'))
  console.log('[API] Response success: ' + apiResult.data?.success)
  if (apiResult.data?.data?.pageResults) {
    console.log('[API] pageResults keys: ' + Object.keys(apiResult.data.data.pageResults).join(', '))
    for (const [k, v] of Object.entries(apiResult.data.data.pageResults)) {
      console.log('[API] pageResults[' + k + '] (first 300 chars): ' + v.substring(0, 300))
    }
  }
  if (apiResult.data?.data?.text) {
    console.log('[API] text length: ' + apiResult.data.data.text.length)
  }

  if (!apiResult.data?.success) {
    console.error('[API] Error: ' + (apiResult.data?.error?.message || 'Unknown'))
    process.exit(1)
  }

  const data = apiResult.data.data

  // Step 3: Merge
  console.log('\n--- Step 3: Merge results ---')
  let mergedText = ''
  if (data.source === 'marker-selective' && data.pageResults) {
    for (let i = 1; i <= extractResult.pageCount; i++) {
      if (data.pageResults[String(i)]) {
        mergedText += data.pageResults[String(i)] + '\n\n'
      } else if (extractResult.pages[i - 1]) {
        mergedText += extractResult.pages[i - 1].text + '\n\n'
      }
    }
    console.log('Merged from marker-selective, enhanced: ' + JSON.stringify(data.enhancedPages))
  } else if (data.text) {
    mergedText = data.text
    console.log('Merged from ' + data.source)
  }
  mergedText = mergedText.trim()

  // Step 4: Final verification
  console.log('\n--- Step 4: Final verification ---')
  const finalHasCorruption = hasRepeatedCharPattern(mergedText)
  console.log('Final text has corruption: ' + finalHasCorruption)
  console.log('Final text length: ' + mergedText.length)
  console.log('Final text (first 800 chars): ' + mergedText.substring(0, 800))

  console.log('\n=== TEST RESULT ===')
  console.log('Detection: ' + (badPages.length > 0 ? 'PASS' : 'FAIL') + ' (found ' + badPages.length + ' bad pages)')
  console.log('API call:  PASS (status ' + apiResult.status + ', source: ' + data.source + ')')
  console.log('Final quality: ' + (!finalHasCorruption ? 'PASS' : 'FAIL'))

  process.exit(finalHasCorruption ? 1 : 0)
}

main().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
