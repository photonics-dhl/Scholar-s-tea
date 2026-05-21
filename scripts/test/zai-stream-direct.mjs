import https from 'https'
import { URL } from 'url'

const ZAI_API_KEY = process.env.ZAI_API_KEY
const ZAI_BASE_URL = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4'

function fetchViaProxy(url, options) {
  return new Promise((resolve, reject) => {
    const proxyUrl = new URL(process.env.http_proxy || 'http://127.0.0.1:7890')
    const target = new URL(url)
    const req = https.request({
      hostname: proxyUrl.hostname,
      port: proxyUrl.port || 443,
      method: 'CONNECT',
      path: `${target.hostname}:443`,
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Proxy CONNECT failed: ${res.statusCode}`))
        return
      }
      const sock = res.socket
      const inner = https.request({
        hostname: target.hostname,
        path: target.pathname + target.search,
        method: options.method || 'GET',
        headers: options.headers,
        socket: sock,
        agent: false,
      }, (innerRes) => {
        resolve({
          status: innerRes.statusCode,
          statusText: innerRes.statusMessage,
          body: innerRes,
          text: () => new Promise((r, e) => {
            let d = ''
            innerRes.on('data', c => d += c)
            innerRes.on('end', () => r(d))
            innerRes.on('error', e)
          }),
          json: async function() { return JSON.parse(await this.text()) },
        })
      })
      inner.on('error', reject)
      if (options.body) inner.write(options.body)
      inner.end()
    })
    req.on('error', reject)
    req.end()
  })
}

async function testZAIStream() {
  console.log('ZAI_BASE_URL:', ZAI_BASE_URL)
  console.log('API Key exists:', !!ZAI_API_KEY)
  try {
    const res = await fetchViaProxy(`${ZAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ZAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-5.1',
        messages: [{ role: 'user', content: 'Say exactly "OK".' }],
        max_tokens: 4096,
        temperature: 0.1,
        stream: true,
      }),
    })
    console.log('HTTP Status:', res.status)
    if (res.status !== 200) {
      console.log('Error:', (await res.text()).slice(0, 500))
      return
    }
    let raw = ''
    res.body.on('data', chunk => { raw += chunk })
    await new Promise((resolve, reject) => {
      res.body.on('end', resolve)
      res.body.on('error', reject)
      setTimeout(() => reject(new Error('timeout')), 15000)
    })
    console.log(`Bytes: ${raw.length}`)
    console.log('--- RAW SSE ---')
    console.log(raw)
    console.log('--- END ---')
  } catch (err) {
    console.log('Error:', err.message)
  }
}

async function testZAINonStream() {
  console.log('\n=== Non-stream test ===')
  try {
    const res = await fetchViaProxy(`${ZAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ZAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-5.1',
        messages: [{ role: 'user', content: 'Say exactly "OK".' }],
        max_tokens: 4096,
        temperature: 0.1,
        stream: false,
      }),
    })
    console.log('HTTP Status:', res.status)
    const data = await res.json()
    console.log('Content:', JSON.stringify(data.choices?.[0]?.message?.content))
    console.log('Reasoning:', JSON.stringify(data.choices?.[0]?.message?.reasoning_content)?.slice(0, 200))
    console.log('Finish reason:', data.choices?.[0]?.finish_reason)
  } catch (err) {
    console.log('Error:', err.message)
  }
}

testZAIStream().then(() => testZAINonStream())
