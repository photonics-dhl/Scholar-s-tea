/**
 * 端到端测试：模拟前端上传包含乱码的 PDF，验证 API 响应
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function buildMultipartBody(fields, fileFieldName, filePath, fileMimeType) {
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2)
  const fileBuffer = fs.readFileSync(filePath)
  const fileName = path.basename(filePath)

  let body = Buffer.alloc(0)

  // Add fields
  for (const [key, value] of Object.entries(fields)) {
    const part = `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
    body = Buffer.concat([body, Buffer.from(part)])
  }

  // Add file
  const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="${fileFieldName}"; filename="${fileName}"\r\nContent-Type: ${fileMimeType}\r\n\r\n`
  body = Buffer.concat([body, Buffer.from(fileHeader), fileBuffer, Buffer.from(`\r\n--${boundary}--\r\n`)])

  return { body, boundary }
}

async function testExtractPdf() {
  const pdfPath = path.join(__dirname, 'test-math-pdf.pdf')

  if (!fs.existsSync(pdfPath)) {
    console.error('测试 PDF 不存在，请先下载：')
    console.error('curl -L -o tests/test-math-pdf.pdf https://arxiv.org/pdf/1706.03762.pdf')
    process.exit(1)
  }

  const simulatedOriginalText = `
Page 1: Abstract
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.

Page 2: Introduction
Recurrent neural networks, long short-term memory and gated recurrent neural networks have been firmly established as state of the art approaches.

Page 3: Model Architecture (FORMULA CORRUPTED)
EE = UU (yy, zz) · ee ii (ωω0 ∂∂ −ββββ) (4)
The attention function can be described as mapping a query and a set of key-value pairs to an output.

Page 4: Experiments
We trained our models on the WMT 2014 English-German dataset.
`.trim()

  const fields = {
    originalText: simulatedOriginalText,
    badPages: JSON.stringify([3]),
    pageCount: '4',
  }

  const { body, boundary } = buildMultipartBody(fields, 'file', pdfPath, 'application/pdf')

  console.log('Testing extract-pdf API...')
  console.log('PDF size:', (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(2), 'MB')
  console.log('Bad pages:', [3])
  console.log('Timeout: 40 minutes')
  console.log('')

  const startTime = Date.now()

  const options = {
    hostname: '10.72.212.33',
    port: 3002,
    path: '/api/v1/knowledge/extract-pdf',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    },
    timeout: 2400000, // 40 min
  }

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const elapsed = Date.now() - startTime
        console.log(`Response: ${res.statusCode} in ${(elapsed / 1000).toFixed(1)}s`)

        try {
          const json = JSON.parse(data)
          if (res.statusCode !== 200) {
            console.error('API Error:', json)
            reject(new Error(`HTTP ${res.statusCode}`))
            return
          }

          console.log('Success:', json.success)
          console.log('Source:', json.data?.source)

          if (json.data?.pageResults) {
            const pages = Object.keys(json.data.pageResults)
            console.log('Enhanced pages:', pages)
            for (const page of pages) {
              const text = json.data.pageResults[page]
              console.log(`\n--- Page ${page} (first 500 chars) ---`)
              console.log(text.slice(0, 500))
            }
          } else if (json.data?.text) {
            console.log('\n--- Result text (first 1000 chars) ---')
            console.log(json.data.text.slice(0, 1000))
          }

          console.log('\n✅ E2E test completed')
          resolve(json)
        } catch (e) {
          console.error('Parse error:', data.slice(0, 500))
          reject(e)
        }
      })
    })

    req.on('error', (err) => {
      const elapsed = Date.now() - startTime
      console.error(`❌ Request failed after ${(elapsed / 1000).toFixed(1)}s:`, err.message)
      reject(err)
    })

    req.on('timeout', () => {
      req.destroy()
      const elapsed = Date.now() - startTime
      console.error(`❌ Request timeout after ${(elapsed / 1000).toFixed(1)}s`)
      reject(new Error('Timeout'))
    })

    req.write(body)
    req.end()
  })
}

testExtractPdf().catch((err) => {
  console.error('Test failed:', err.message)
  process.exit(1)
})
