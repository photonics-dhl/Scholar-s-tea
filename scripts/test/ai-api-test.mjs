/**
 * AI API 直连测试（纯 Node.js，不依赖 TypeScript 编译器）
 * 测试：ZCHAT / MiniMax API 连通性、响应格式、论文 prompts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 加载 .env
function loadEnv() {
  const envPath = path.resolve(__dirname, '../../.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim()
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) process.env[key] = value
      }
    }
  }
}
loadEnv()

// Proxy
let agent = undefined
const proxyUrl = process.env.http_proxy || process.env.https_proxy || process.env.HTTP_PROXY || process.env.HTTPS_PROXY
if (proxyUrl) {
  try {
    const { HttpsProxyAgent } = await import('https-proxy-agent')
    agent = new HttpsProxyAgent(proxyUrl)
  } catch { /* no proxy */ }
}

// =============================================================================
// 配置
// =============================================================================

const ZCHAT_KEY = process.env.ZCHAT_API_KEY
const ZCHAT_URL = process.env.ZCHAT_BASE_URL || 'https://api.zchat.tech/v1'
const ZCHAT_MODEL = process.env.ZCHAT_VISION_MODEL || 'claude-sonnet-4-5'

const MINIMAX_KEY = process.env.MINIMAX_API_KEY || process.env.ANTHROPIC_API_KEY
const MINIMAX_URL = process.env.MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'https://api.minimax.chat/v1'

// =============================================================================
// 辅助
// =============================================================================

function logSection(t) { console.log(`\n${'='.repeat(60)}\n  ${t}\n${'='.repeat(60)}`) }

async function callAPI(name, url, body, apiKey) {
  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      agent,
    })
    const latency = Date.now() - start
    if (!res.ok) {
      const text = await res.text()
      console.log(`❌ ${name}: HTTP ${res.status} (${latency}ms) — ${text.slice(0, 200)}`)
      return { error: `HTTP ${res.status}: ${text.slice(0, 200)}` }
    }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ''
    console.log(`✅ ${name}: OK (${latency}ms) — ${content.slice(0, 120).replace(/\n/g, ' ')}...`)
    return { content, data }
  } catch (err) {
    console.log(`❌ ${name}: 异常 — ${err.message}`)
    return { error: err.message }
  }
}

async function callStreamAPI(name, url, body, apiKey) {
  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ ...body, stream: true }),
      agent,
    })
    if (!res.ok) {
      const text = await res.text()
      console.log(`❌ ${name}: HTTP ${res.status} — ${text.slice(0, 200)}`)
      return { error: `HTTP ${res.status}` }
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let chunkCount = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunkCount++
      const text = decoder.decode(value, { stream: true })
      for (const line of text.split('\n')) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6)
          if (jsonStr === '[DONE]') continue
          try {
            const parsed = JSON.parse(jsonStr)
            const delta = parsed.choices?.[0]?.delta?.content || ''
            fullText += delta
          } catch { /* skip */ }
        }
      }
    }

    const latency = Date.now() - start
    console.log(`✅ ${name}: OK (${latency}ms, ${chunkCount} chunks) — ${fullText.slice(0, 120).replace(/\n/g, ' ')}...`)
    return { content: fullText }
  } catch (err) {
    console.log(`❌ ${name}: 异常 — ${err.message}`)
    return { error: err.message }
  }
}

// =============================================================================
// Prompts（从 paper-generation-prompts.ts 提取的精华）
// =============================================================================

const PAPER_SYSTEM = `你是顶级学术期刊的资深编辑和写作顾问，拥有20年学术论文指导经验。

## 写作风格（严格遵循）
1. **IMRAD 结构**：Introduction → Methods → Results → And Discussion
2. **段落结构**：每段必须有主题句 + 支撑论据 + 过渡句
3. **术语规范**：首次出现缩写必须全称
4. **数据驱动**：所有结论必须有数据或引用支撑
5. **学术语气**：避免口语化、绝对化表述

## 引用规范
- 关键论点必须标注引用占位符 [REF-N]
- 每个主要章节至少3-5个引用占位符
- 无法验证的引用标注 [CITATION NEEDED]`

const PROPOSAL_PROMPT = (topic) => `请为以下研究主题撰写开题报告框架，要求包含：
1. 研究背景与意义（从宏观到微观）
2. 核心科学问题（2-3个具体问题，以Q1/Q2格式）
3. 创新点（3点，每点需有量化或具体支撑）
4. 技术路线概述
5. 预期成果

研究主题：${topic}

【自检要求】输出完成后，请在文末添加：
□ 背景是否由宏观到微观？ □ 问题是否具体可研究？ □ 创新点是否有量化支撑？`

const WRITING_PROMPT = (topic, section) => `请撰写学术论文的"${section}"部分。

研究主题：${topic}

【写作要求】
1. 使用学术英语或中文（根据主题判断）
2. 每段包含：主题句 → 支撑论据（数据/引用） → 过渡句
3. 标注引用占位符 [REF-1], [REF-2] 等
4. 避免口语化，使用被动语态（方法部分）和主动语态（其余部分）
5. 字数：约500字

【自检】
□ 主题句明确？ □ 过渡自然？ □ 引用标注？ □ 无口语化？`

// =============================================================================
// 测试用例
// =============================================================================

async function testZCHATText() {
  logSection('测试 1: ZCHAT 纯文本调用')
  return callAPI('ZCHAT text', `${ZCHAT_URL}/chat/completions`, {
    model: ZCHAT_MODEL,
    messages: [
      { role: 'system', content: '你是学术助手，用中文回答。' },
      { role: 'user', content: '请用一句话解释什么是联邦学习。' }
    ],
    max_tokens: 200,
    temperature: 0.7,
  }, ZCHAT_KEY)
}

async function testMiniMaxText() {
  logSection('测试 2: MiniMax 纯文本调用')
  return callAPI('MiniMax text', `${MINIMAX_URL}/chat/completions`, {
    model: 'MiniMax-M2.7',
    messages: [
      { role: 'system', content: '你是学术助手，用中文回答。' },
      { role: 'user', content: '请用一句话解释什么是联邦学习。' }
    ],
    max_tokens: 200,
    temperature: 0.7,
  }, MINIMAX_KEY)
}

async function testZCHATVision() {
  logSection('测试 3: ZCHAT 图片识别（多模态）')
  // 创建一个 1x1 的红色 PNG base64
  const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  return callAPI('ZCHAT vision', `${ZCHAT_URL}/chat/completions`, {
    model: ZCHAT_MODEL,
    messages: [
      { role: 'system', content: '你是图像识别助手，用中文描述图片内容。' },
      { role: 'user', content: [
        { type: 'text', text: '请描述这张图片的颜色。' },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${tinyPngBase64}` } }
      ]}
    ],
    max_tokens: 200,
    temperature: 0.7,
  }, ZCHAT_KEY)
}

async function testZCHATStream() {
  logSection('测试 4: ZCHAT 流式输出')
  return callStreamAPI('ZCHAT stream', `${ZCHAT_URL}/chat/completions`, {
    model: ZCHAT_MODEL,
    messages: [
      { role: 'system', content: '你是学术助手，用中文回答。' },
      { role: 'user', content: '联邦学习的主要挑战有哪些？请简要列举。' }
    ],
    max_tokens: 300,
    temperature: 0.7,
  }, ZCHAT_KEY)
}

async function testMiniMaxStream() {
  logSection('测试 5: MiniMax 流式输出')
  return callStreamAPI('MiniMax stream', `${MINIMAX_URL}/chat/completions`, {
    model: 'MiniMax-M2.7',
    messages: [
      { role: 'system', content: '你是学术助手，用中文回答。' },
      { role: 'user', content: '联邦学习的主要挑战有哪些？请简要列举。' }
    ],
    max_tokens: 300,
    temperature: 0.7,
  }, MINIMAX_KEY)
}

async function testPaperProposal() {
  logSection('测试 6: 论文生成 — 选题立项 Prompt')
  return callAPI('Paper proposal', `${MINIMAX_URL}/chat/completions`, {
    model: 'MiniMax-M2.7',
    messages: [
      { role: 'system', content: PAPER_SYSTEM },
      { role: 'user', content: PROPOSAL_PROMPT('基于深度学习的联邦学习隐私保护机制研究') }
    ],
    max_tokens: 2048,
    temperature: 0.7,
  }, MINIMAX_KEY)
}

async function testPaperWriting() {
  logSection('测试 7: 论文生成 — 正文写作 Prompt')
  return callAPI('Paper writing', `${MINIMAX_URL}/chat/completions`, {
    model: 'MiniMax-M2.7',
    messages: [
      { role: 'system', content: PAPER_SYSTEM },
      { role: 'user', content: WRITING_PROMPT('基于深度学习的联邦学习隐私保护机制研究', '引言') }
    ],
    max_tokens: 2048,
    temperature: 0.6,
  }, MINIMAX_KEY)
}

async function testZCHATWithLongPrompt() {
  logSection('测试 8: ZCHAT 长 Prompt 兼容性')
  const longPrompt = PAPER_SYSTEM + '\n\n' + PROPOSAL_PROMPT('基于图神经网络的社交网络异常检测') + '\n\n' + '请详细展开每个部分，确保论证充分、引用规范。'
  return callAPI('ZCHAT long prompt', `${ZCHAT_URL}/chat/completions`, {
    model: ZCHAT_MODEL,
    messages: [
      { role: 'user', content: longPrompt }
    ],
    max_tokens: 2048,
    temperature: 0.7,
  }, ZCHAT_KEY)
}

// =============================================================================
// 主函数
// =============================================================================

async function main() {
  console.log("🧪 Scholar's Tea AI API 直连测试")
  console.log(`时间: ${new Date().toISOString()}`)
  console.log(`\n环境:`)
  console.log(`  ZCHAT_API_KEY: ${ZCHAT_KEY ? '✅ 已配置' : '❌ 未配置'}`)
  console.log(`  ZCHAT_BASE_URL: ${ZCHAT_URL}`)
  console.log(`  ZCHAT_MODEL: ${ZCHAT_MODEL}`)
  console.log(`  MINIMAX_API_KEY: ${MINIMAX_KEY ? '✅ 已配置' : '❌ 未配置'}`)
  console.log(`  MINIMAX_BASE_URL: ${MINIMAX_URL}`)
  console.log(`  Proxy: ${agent ? '✅ 已启用' : '❌ 未启用'}`)

  const results = {}

  // 基础连通性
  results.zchatText = await testZCHATText()
  results.minimaxText = await testMiniMaxText()

  // 多模态
  results.zchatVision = await testZCHATVision()

  // 流式
  results.zchatStream = await testZCHATStream()
  results.minimaxStream = await testMiniMaxStream()

  // 论文 Prompts
  results.paperProposal = await testPaperProposal()
  results.paperWriting = await testPaperWriting()

  // 兼容性
  results.zchatLong = await testZCHATWithLongPrompt()

  // 质量分析
  logSection('论文 Prompt 质量分析')
  if (results.paperProposal.content) {
    const c = results.paperProposal.content
    console.log('Proposal 输出长度:', c.length, '字符')
    console.log('包含 [REF-?', c.includes('[REF-'))
    console.log('包含 研究背景?', c.includes('研究背景'))
    console.log('包含 创新点?', c.includes('创新'))
    console.log('包含 自检?', c.includes('□'))
    console.log('\n前500字符预览:')
    console.log(c.slice(0, 500))
  }

  if (results.paperWriting.content) {
    const c = results.paperWriting.content
    console.log('\nWriting 输出长度:', c.length, '字符')
    console.log('包含 [REF-?', c.includes('[REF-'))
    console.log('前300字符预览:')
    console.log(c.slice(0, 300))
  }

  if (results.zchatVision.content) {
    console.log('\nVision 识别结果:')
    console.log(results.zchatVision.content)
  }

  // 总结
  logSection('测试总结')
  const entries = Object.entries(results)
  const passed = entries.filter(([, r]) => !r.error).length
  const failed = entries.filter(([, r]) => r.error).length
  console.log(`总计: ${entries.length} 项 | ✅ 通过: ${passed} | ❌ 失败: ${failed}`)

  if (failed > 0) {
    console.log('\n失败项:')
    for (const [name, r] of entries) {
      if (r.error) console.log(`  - ${name}: ${r.error}`)
    }
    process.exit(1)
  }

  console.log('\n🎉 所有 API 测试通过！')
}

main().catch(err => {
  console.error('测试异常:', err)
  process.exit(1)
})
