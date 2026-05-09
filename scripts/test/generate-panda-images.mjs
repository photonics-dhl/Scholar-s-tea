import https from 'https'
import fs from 'fs'

const API_KEY = process.env.MINIMAX_API_KEY || 'sk-cp-qE86-XcYk4b079O0NoNQKwcJ5wvaMlRrXE8ew1y6ovXxuMCuZ0tEv7JjoLck2Ub7VXJKmUZtR5O39Coct_dDYytXGul8BuWoty_dyzvmTnGQQsx8VCTkNBU'

const moods = [
  { name: 'happy', desc: 'big happy smile, eyes squinting with joy, cheerful and excited expression' },
  { name: 'thinking', desc: 'one hand on chin, thoughtful expression, looking up slightly, curious' },
  { name: 'surprised', desc: 'wide open eyes and mouth, shocked expression, eyebrows raised' },
  { name: 'sleepy', desc: 'eyes half closed, drowsy, yawning slightly, peaceful expression' }
]

function generateImage(mood) {
  const prompt = `A cute fluffy giant panda wearing round golden-rimmed glasses and a dark brown academic graduation cap with blue tassel, holding an open ancient Chinese book with glowing golden text. ${mood.desc}. Warm scholarly atmosphere, soft lighting, 3D rendered Pixar-style, ultra detailed fur texture, cozy study room background with wooden bookshelves and teapots, front-facing portrait, high quality`

  const data = JSON.stringify({
    model: 'image-01',
    prompt,
    aspect_ratio: '1:1',
    n: 1,
    prompt_optimizer: true
  })

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.minimax.chat',
      path: '/v1/image_generation',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 120000
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(body)
          if (json.data?.image_urls?.[0]) {
            console.log(`${mood.name}: ${json.data.image_urls[0]}`)
            resolve({ mood: mood.name, url: json.data.image_urls[0] })
          } else {
            reject(new Error(`${mood.name} failed: ${JSON.stringify(json)}`))
          }
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location, (res2) => {
          const file = fs.createWriteStream(filename)
          res2.pipe(file)
          file.on('finish', () => { file.close(); resolve() })
        }).on('error', reject)
      } else {
        const file = fs.createWriteStream(filename)
        res.pipe(file)
        file.on('finish', () => { file.close(); resolve() })
      }
    }).on('error', reject)
  })
}

async function main() {
  const results = []
  for (const mood of moods) {
    try {
      const result = await generateImage(mood)
      results.push(result)
      await new Promise(r => setTimeout(r, 3000))
    } catch (e) {
      console.error(`Error generating ${mood.name}:`, e.message)
    }
  }

  console.log('\n--- Downloading images ---')
  for (const r of results) {
    const filename = `public/hermes/panda_academic_${r.mood}.jpeg`
    try {
      await downloadImage(r.url, filename)
      console.log(`Downloaded: ${filename}`)
    } catch (e) {
      console.error(`Failed to download ${r.mood}:`, e.message)
    }
  }
}

main()
