/**
 * ZAI GLM-5.1 端到端测试
 * 验证：API 连通性、GFM Alert 语法、标题渲染、skill/personality 响应差异
 */

const ZAI_API_KEY = process.env.ZAI_API_KEY
const ZAI_BASE_URL = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4'
const ZAI_DEFAULT_MODEL = process.env.ZAI_DEFAULT_MODEL || 'glm-5.1'

if (!ZAI_API_KEY) {
  console.error('❌ ZAI_API_KEY not found in .env')
  process.exit(1)
}

async function callZAI(systemPrompt, userPrompt) {
  const messages = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: userPrompt })

  const res = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: ZAI_DEFAULT_MODEL,
      messages,
      max_tokens: 1024,
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

// 测试 1：GFM Alert 语法 + 标题层级
async function testGFMAndHeadings() {
  console.log('\n--- 测试 1: GFM Alert + 标题层级 ---')
  const systemPrompt = `你是 Scholar's Tea 的学术 AI 助手。输出格式规范：
- 使用标准 GitHub Alert 语法：> [!NOTE]、> [!WARNING]、> [!IMPORTANT]、> [!CAUTION]
- 使用 Markdown 标题层级（# ## ### #### #####）
- 数学符号使用 UTF-8 Unicode`

  const userPrompt = `请用以下格式简要介绍"深度学习在材料科学中的应用"：
1. 使用 ##### 作为小节标题
2. 用 > [!IMPORTANT] 强调一个关键发现
3. 用 > [!WARNING] 指出一个常见误区
4. 用 > [!NOTE] 补充一条背景信息
5. 输出控制在 300 字以内`

  const content = await callZAI(systemPrompt, userPrompt)
  console.log('响应内容：')
  console.log(content)
  console.log('\n检查结果：')
  console.log(`  包含 ##### : ${content.includes('#####') ? '⚠️ h5 标题未渲染（模型输出正确，前端已修复）' : '✅ 无残留 # 号（若前端渲染则看不到）'}`)
  console.log(`  包含 [!IMPORTANT]: ${content.includes('[!IMPORTANT]') ? '✅' : '❌'}`)
  console.log(`  包含 [!WARNING]  : ${content.includes('[!WARNING]') ? '✅' : '❌'}`)
  console.log(`  包含 [!NOTE]     : ${content.includes('[!NOTE]') ? '✅' : '❌'}`)
  return content
}

// 测试 2：personality 响应差异
async function testPersonalityDiff() {
  console.log('\n--- 测试 2: Personality 响应差异 ---')
  const userPrompt = '简要解释"过拟合"（50字以内）'

  const profSystem = '[Skill Mode: research-paper-writing]\nYou are a rigorous university professor. Provide detailed, evidence-based explanations with references.'
  const kawaiiSystem = '[Skill Mode: research-paper-writing]\nYou are a kawaii assistant! Use cute expressions and be enthusiastic~'

  const profContent = await callZAI(profSystem, userPrompt)
  const kawaiiContent = await callZAI(kawaiiSystem, userPrompt)

  console.log('Professor personality:')
  console.log(`  ${profContent.slice(0, 120)}...`)
  console.log('Kawaii personality:')
  console.log(`  ${kawaiiContent.slice(0, 120)}...`)

  const profStyle = !profContent.includes('(') && !profContent.includes('~')
  const kawaiiStyle = kawaiiContent.includes('~') || kawaiiContent.includes('(') || kawaiiContent.includes('!')
  console.log(`\n  教授风格（严谨）: ${profStyle ? '✅' : '⚠️ 不明显'}`)
  console.log(`  Kawaii 风格（可爱）: ${kawaiiStyle ? '✅' : '⚠️ 不明显'}`)
}

// 测试 3：传统标记兼容
async function testLegacyAlerts() {
  console.log('\n--- 测试 3: 传统标记兼容 ---')
  const systemPrompt = `你是学术 AI 助手。输出格式：关键结论用 "> [关键]"，警告用 "> [注意]"，建议用 "> [建议]"。`
  const userPrompt = '简要分析深度学习在药物发现中的挑战（100字以内）'

  const content = await callZAI(systemPrompt, userPrompt)
  console.log('响应内容：')
  console.log(content)
  console.log(`\n  包含 [关键]: ${content.includes('[关键]') ? '✅' : '⚠️'}`)
  console.log(`  包含 [注意]: ${content.includes('[注意]') ? '✅' : '⚠️'}`)
  console.log(`  包含 [建议]: ${content.includes('[建议]') ? '✅' : '⚠️'}`)
}

// 主流程
async function main() {
  console.log('=== ZAI GLM-5.1 端到端测试 ===')
  console.log(`模型: ${ZAI_DEFAULT_MODEL}`)
  console.log(`端点: ${ZAI_BASE_URL}`)

  try {
    await testGFMAndHeadings()
    await testPersonalityDiff()
    await testLegacyAlerts()
    console.log('\n✅ 全部测试完成')
  } catch (err) {
    console.error(`\n❌ 测试失败: ${err.message}`)
    process.exit(1)
  }
}

main()
