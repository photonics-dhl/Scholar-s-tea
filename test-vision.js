const fs = require('fs')
const path = require('path')

async function test() {
  const imgPath = path.join(process.cwd(), 'public', 'uploads', '622971cf-9ccc-43fe-b769-6a6e59cbbf0d.png')
  const buffer = fs.readFileSync(imgPath)
  const base64 = buffer.toString('base64')
  const dataUrl = 'data:image/png;base64,' + base64

  const apiKey = process.env.MINIMAX_API_KEY || process.env.ANTHROPIC_API_KEY
  const baseUrl = process.env.MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL

  console.log('API Key exists:', !!apiKey)
  console.log('Base URL:', baseUrl)
  console.log('Image size:', buffer.length, 'bytes')

  const response = await fetch(baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: [
          { type: 'text', text: 'What is in this image? Describe it briefly in Chinese.' },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]}
      ],
      max_tokens: 500,
    }),
  })

  const data = await response.json()
  console.log('Status:', response.status)
  console.log('Response:', JSON.stringify(data, null, 2).slice(0, 1000))
}

test().catch(console.error)
