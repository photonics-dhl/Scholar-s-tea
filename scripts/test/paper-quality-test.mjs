/**
 * 论文生成质量测试 — 捕获完整输出用于分析
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

const MINIMAX_KEY = process.env.MINIMAX_API_KEY || process.env.ANTHROPIC_API_KEY
const MINIMAX_URL = process.env.MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'https://api.minimax.chat/v1'

let agent = undefined
const proxyUrl = process.env.http_proxy || process.env.https_proxy || process.env.HTTP_PROXY || process.env.HTTPS_PROXY
if (proxyUrl) {
  try {
    const { HttpsProxyAgent } = await import('https-proxy-agent')
    agent = new HttpsProxyAgent(proxyUrl)
  } catch { }
}

async function callAPI(system, user, maxTokens = 2048, temp = 0.7) {
  const res = await fetch(`${MINIMAX_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MINIMAX_KEY}` },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      max_tokens: maxTokens,
      temperature: temp,
    }),
    agent,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// Prompts
const SYSTEM_V1 = `你是顶级学术期刊的资深编辑和写作顾问，拥有20年学术论文指导经验。

## 写作风格
1. IMRAD 结构
2. 段落结构：主题句 + 支撑论据 + 过渡句
3. 术语规范
4. 数据驱动
5. 学术语气

## 引用规范
- 关键论点标注 [REF-N]
- 每个主要章节至少3-5个引用占位符
- 无法验证的引用标注 [CITATION NEEDED]`

const SYSTEM_V2 = `你是一位资深学术写作专家，拥有20年顶刊编辑经验。你的任务是为研究者撰写高质量的学术文本。

## 输出规则（严格遵循）
1. 直接输出正文，禁止输出思考过程、分析步骤或元评论
2. 禁止使用 <think>、思考：、备注：等标记
3. 所有内容必须是可直接用于论文的学术文本

## 写作标准
- IMRAD 结构
- 每段：主题句 → 论据 → 过渡
- 引用格式：[REF-N]
- 学术语气，禁止口语化`

const PROPOSAL_PROMPT = (topic) => `为"${topic}"撰写开题报告框架：

1. 研究背景与意义（宏观→微观）
2. 核心科学问题（Q1/Q2格式）
3. 创新点（3点，需量化支撑）
4. 技术路线概述
5. 预期成果

【自检清单】□背景由宏观到微观 □问题具体可研究 □创新点有量化支撑`

const WRITING_PROMPT = (topic, section) => `撰写"${topic}"的"${section}"部分（约500字）。

要求：
- 每段：主题句 → 支撑论据（数据/引用） → 过渡句
- 标注引用 [REF-1], [REF-2] 等
- 方法部分用被动语态，其余用主动语态
- 禁止口语化、绝对化表述

直接输出正文，不要分析或解释。`

// 测试
const TOPIC = '基于深度学习的联邦学习隐私保护机制研究'

console.log('开始论文质量测试...\n')

// Test V1 system prompt
console.log('=== 测试 V1: 原始 System Prompt ===')
const t1 = Date.now()
const v1Proposal = await callAPI(SYSTEM_V1, PROPOSAL_PROMPT(TOPIC), 2048, 0.7)
console.log(`耗时: ${Date.now() - t1}ms, 长度: ${v1Proposal.length}`)
console.log('前800字符:')
console.log(v1Proposal.slice(0, 800))
console.log('\n')

// Test V2 system prompt (no think tags)
console.log('=== 测试 V2: 强化 System Prompt（禁止思考标签）===')
const t2 = Date.now()
const v2Proposal = await callAPI(SYSTEM_V2, PROPOSAL_PROMPT(TOPIC), 2048, 0.7)
console.log(`耗时: ${Date.now() - t2}ms, 长度: ${v2Proposal.length}`)
console.log('前800字符:')
console.log(v2Proposal.slice(0, 800))
console.log('\n')

// Test writing
console.log('=== 测试 V2: 正文写作 ===')
const t3 = Date.now()
const v2Writing = await callAPI(SYSTEM_V2, WRITING_PROMPT(TOPIC, '引言'), 2048, 0.6)
console.log(`耗时: ${Date.now() - t3}ms, 长度: ${v2Writing.length}`)
console.log('完整内容:')
console.log(v2Writing)

// 保存结果
const outDir = path.resolve(__dirname, '../../tests/logs')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'paper-v1-proposal.md'), `# V1 Proposal (${v1Proposal.length} chars)\n\n${v1Proposal}`)
fs.writeFileSync(path.join(outDir, 'paper-v2-proposal.md'), `# V2 Proposal (${v2Proposal.length} chars)\n\n${v2Proposal}`)
fs.writeFileSync(path.join(outDir, 'paper-v2-writing.md'), `# V2 Writing (${v2Writing.length} chars)\n\n${v2Writing}`)

console.log(`\n结果已保存到 tests/logs/`)

// 质量统计
function analyze(text, label) {
  const hasThink = text.includes('<think>')
  const hasRef = /\[REF-\d+\]/.test(text)
  const hasCitationNeeded = text.includes('[CITATION NEEDED]')
  const wordCount = text.length
  const lineCount = text.split('\n').length
  console.log(`\n[${label}]`)
  console.log(`  含<think>: ${hasThink ? '❌ 是' : '✅ 否'}`)
  console.log(`  含[REF-N]: ${hasRef ? '✅ 是' : '⚠️ 否'}`)
  console.log(`  含[CITATION NEEDED]: ${hasCitationNeeded ? '✅ 是' : '⚠️ 否'}`)
  console.log(`  字符数: ${wordCount}`)
  console.log(`  行数: ${lineCount}`)
}

analyze(v1Proposal, 'V1 Proposal')
analyze(v2Proposal, 'V2 Proposal')
analyze(v2Writing, 'V2 Writing')
