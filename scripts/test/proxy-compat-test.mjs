#!/usr/bin/env node
async function test() {
  try {
    const nf = await import('node-fetch')
    const hpa = await import('https-proxy-agent')
    console.log('node-fetch default:', typeof nf.default)
    console.log('node-fetch keys:', Object.keys(nf))
    console.log('hpa keys:', Object.keys(hpa))
    console.log('hpa.default:', typeof hpa.default)
    console.log('hpa.HttpsProxyAgent:', typeof hpa.HttpsProxyAgent)

    const fetch = nf.default
    const HttpsProxyAgent = hpa.HttpsProxyAgent || hpa.default
    const agent = new HttpsProxyAgent('http://127.0.0.1:7890')
    console.log('agent created:', !!agent)

    const apiKey = process.env.ZCHAT_API_KEY
    const baseUrl = process.env.ZCHAT_BASE_URL
    const res = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: 'test' }),
      agent,
    })
    console.log('status:', res.status)
    const data = await res.json()
    const emb = data.data?.[0]?.embedding || data.vectors?.[0]
    console.log('embedding dim:', emb?.length)
  } catch (e) {
    console.error('ERROR:', e.message, e.stack?.split('\n')[0])
  }
}
test()
