const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

async function test() {
  const apiKey = process.env.ZCHAT_API_KEY
  const baseUrl = process.env.ZCHAT_BASE_URL
  const proxyUrl = process.env.http_proxy
  const query = 'Attention Is All You Need 讲了什么'

  let queryEmb = []
  const fetchOpts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
  }
  if (proxyUrl) {
    const { ProxyAgent } = require('undici')
    fetchOpts.dispatcher = new ProxyAgent(proxyUrl)
  }
  const res = await fetch(baseUrl + '/embeddings', fetchOpts)
  const data = await res.json()
  queryEmb = data.data?.[0]?.embedding || data.vectors?.[0] || []
  console.log('Query:', query)
  console.log('Embedding dim:', queryEmb.length)

  const docs = await prisma.knowledgeDocument.findMany({
    where: { AND: [{ embedding: { not: null } }, { embedding: { not: '[]' } }] },
    select: { id: true, title: true, source: true, embedding: true }
  })
  const results = docs.map(d => ({
    title: d.title, source: d.source,
    sim: cosineSimilarity(queryEmb, JSON.parse(d.embedding))
  }))
  results.sort((a, b) => b.sim - a.sim)
  results.forEach(r => console.log('  sim=' + r.sim.toFixed(4) + ' [' + r.source + '] ' + r.title.slice(0, 50)))
  await prisma.$disconnect()
}
test().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1) })
