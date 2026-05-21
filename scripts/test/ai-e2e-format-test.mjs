/**
 * AI 格式端到端测试
 * 测试多个 provider 对 system prompt + GFM Alert + 标题的响应质量
 */

const PROVIDERS = [
  {
    name: 'MiniMax',
    baseUrl: process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1',
    apiKey: process.env.MINIMAX_API_KEY,
    model: 'MiniMax-M2.7',
    format: 'openai',
  },
  {
    name: 'ZCHAT',
    baseUrl: process.env.ZCHAT_BASE_URL || 'https://api.zchat.tech/v1',
    apiKey: process.env.ZCHAT_API_KEY,
    model: 'gpt-5',
    format: 'openai',
  },
]

async function callOpenAI(provider, systemPrompt, userPrompt) {
  const messages = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: userPrompt })

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      max_tokens: 512,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

function analyzeResponse(content) {
  return {
    hasH5: content.includes('#####'),
    hasH6: content.includes('######'),
    hasGFM_NOTE: content.includes('[!NOTE]'),
    hasGFM_WARNING: content.includes('[!WARNING]'),
    hasGFM_IMPORTANT: content.includes('[!IMPORTANT]'),
    hasGFM_CAUTION: content.includes('[!CAUTION]'),
    hasGFM_TIP: content.includes('[!TIP]'),
    hasLegacyKey: content.includes('[关键]'),
    hasLegacyNote: content.includes('[注意]'),
    hasLegacySuggest: content.includes('[建议]'),
    hasTable: content.includes('|') && content.includes('---'),
    hasDetails: content.includes('<details'),
    hasCodeBlock: content.includes('```'),
    hasInlineCode: content.includes('`'),
    length: content.length,
  }
}

async function testProvider(provider) {
  if (!provider.apiKey) {
    console.log(`\n--- ${provider.name} ---`)
    console.log('  ⏭️  skipped (no API key)')
    return null
  }

  console.log(`\n--- ${provider.name} (${provider.model}) ---`)

  const systemPrompt = `你是 Scholar's Tea 的学术 AI 助手。输出格式规范：
- 使用标准 GitHub Alert 语法：> [!NOTE]、> [!WARNING]、> [!IMPORTANT]、> [!CAUTION]、> [!TIP]
- 使用 Markdown 标题层级（## ### #### #####）
- 数学符号使用 UTF-8 Unicode
[Skill Mode: research-paper-writing]
You are a rigorous university professor. Provide detailed, evidence-based explanations with references.`

  const userPrompt = `请用以下格式简要介绍"Transformer 架构的核心原理"（200字以内）：
1. 使用 ##### 作为小节标题
2. 用 > [!IMPORTANT] 强调一个关键发现
3. 用 > [!WARNING] 指出一个常见误区
4. 用 > [!NOTE] 补充一条背景信息
5. 用一个 Markdown 表格对比 Transformer 与 RNN 的优缺点`

  try {
    const content = await callOpenAI(provider, systemPrompt, userPrompt)
    const analysis = analyzeResponse(content)

    console.log('响应内容：')
    console.log(content)
    console.log('\n格式分析：')
    console.log(`  h5 (#####)  : ${analysis.hasH5 ? '⚠️ 残留（前端已修复）' : '✅ 已渲染'}`)
    console.log(`  GFM NOTE    : ${analysis.hasGFM_NOTE ? '✅' : '❌'}`)
    console.log(`  GFM WARNING : ${analysis.hasGFM_WARNING ? '✅' : '❌'}`)
    console.log(`  GFM IMPORTANT: ${analysis.hasGFM_IMPORTANT ? '✅' : '❌'}`)
    console.log(`  GFM CAUTION : ${analysis.hasGFM_CAUTION ? '⚠️ 未使用' : '➖'}`)
    console.log(`  GFM TIP     : ${analysis.hasGFM_TIP ? '⚠️ 未使用' : '➖'}`)
    console.log(`  传统 [关键] : ${analysis.hasLegacyKey ? '⚠️ 未请求但出现' : '➖'}`)
    console.log(`  表格        : ${analysis.hasTable ? '✅' : '❌'}`)
    console.log(`  代码块      : ${analysis.hasCodeBlock ? '✅' : '➖'}`)
    console.log(`  折叠区块    : ${analysis.hasDetails ? '✅' : '➖'}`)
    console.log(`  总长度      : ${analysis.length} 字符`)

    return { provider: provider.name, content, analysis }
  } catch (err) {
    console.log(`  ❌ 调用失败: ${err.message}`)
    return { provider: provider.name, error: err.message }
  }
}

async function main() {
  console.log('=== AI 格式端到端测试 ===')
  console.log('测试目标：验证 system prompt 中的格式规范是否被模型正确遵循')

  const results = []
  for (const provider of PROVIDERS) {
    const result = await testProvider(provider)
    if (result) results.push(result)
  }

  console.log('\n=== 测试总结 ===')
  const successCount = results.filter(r => !r.error).length
  console.log(`通过: ${successCount}/${results.length}`)

  for (const r of results) {
    if (r.error) {
      console.log(`  ${r.provider}: ❌ ${r.error}`)
    } else {
      const a = r.analysis
      const score = [
        !a.hasH5, a.hasGFM_NOTE, a.hasGFM_WARNING, a.hasGFM_IMPORTANT, a.hasTable
      ].filter(Boolean).length
      console.log(`  ${r.provider}: ${score}/5 格式项达标`)
    }
  }
}

main().catch(err => {
  console.error(`\n全局错误: ${err.message}`)
  process.exit(1)
})
