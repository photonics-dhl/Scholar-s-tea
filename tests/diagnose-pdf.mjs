import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'

const pdfPath = process.argv[2]
if (!pdfPath) {
  console.error('Usage: node diagnose-pdf.mjs <pdf-path>')
  process.exit(1)
}

// Copy detection logic from pdf-extractor.ts
const NORMAL_PATTERNS = new Set([
  'II','III','IV','VI','VII','VIII','IX','XI','XII',
  'CC','BB','LL','PP','RR','SS','VV','WW','XX','YY','ZZ',
  'AA','AB','AC','AD','AE','AF','AG','BA','BC','BD','BE',
  'BF','BG','CA','CB','CD','CE','CF','CG','DA','DB','DC',
  'DD','DE','DF','DG','EA','EB','EC','ED','EF','EG','FA',
  'FB','FC','FD','FE','FF','FG','GA','GB','GC','GD','GE','GF','GG',
])

function hasRepeatedCharPattern(text) {
  if (text.includes('\uFFFD')) return true
  const upperMatches = text.match(/\b([A-Z])\1{1,}\b/g)
  if (upperMatches?.some(m => !NORMAL_PATTERNS.has(m))) return true
  if (/([\u03B1-\u03C9\u0391-\u03A9])\1{1,}/.test(text)) return true
  if (/([\u2200-\u22FF\u2A00-\u2AFF])\1{1,}/.test(text)) return true
  if (/\b([A-Z])\1\b\s*[=+\-*/]\s*\b([A-Z])\2\b/.test(text)) return true
  const funcMatches = text.match(/\b([A-Z])\1\s*\(/g)
  if (funcMatches?.some(m => !NORMAL_PATTERNS.has(m.match(/([A-Z])\1/)[0]))) return true
  if (/[=+\-*·∂∇∫∑∏√]\s*([a-z])\1{1,}/.test(text)) return true
  return false
}

async function diagnose() {
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const doc = await pdfjsLib.getDocument({ data }).promise
  console.log(`Total pages: ${doc.numPages}`)

  let badPageCount = 0
  let totalTextLen = 0

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const textContent = await page.getTextContent()
    const text = textContent.items.map(item => item.str).join(' ')
    totalTextLen += text.length

    const hasCorruption = hasRepeatedCharPattern(text)
    const hasUnicodeError = text.includes('\uFFFD')

    if (hasCorruption || hasUnicodeError) {
      badPageCount++
      console.log(`\n[PAGE ${i}] BAD - corruption=${hasCorruption}, unicodeError=${hasUnicodeError}`)
      console.log(`  Text sample: ${text.slice(0, 300)}`)
      console.log(`  Text length: ${text.length}`)
    } else if (i <= 3 || i > doc.numPages - 2) {
      console.log(`\n[PAGE ${i}] OK - len=${text.length}`)
      console.log(`  Sample: ${text.slice(0, 200)}`)
    }
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Total pages: ${doc.numPages}`)
  console.log(`Bad pages: ${badPageCount}`)
  console.log(`Total text length: ${totalTextLen}`)
  console.log(`Would trigger enhancement: ${badPageCount > 0 ? 'YES' : 'NO'}`)
}

diagnose().catch(console.error)
