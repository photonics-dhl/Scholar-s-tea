/**
 * Hermes Gateway Adapter 测试
 * 验证 buildSystemPrompt 是否正确注入 skill/personality 指令
 */

// 复制 hermes-gateway-adapter.ts 中的 buildSystemPrompt 逻辑
function buildSystemPrompt(personality, skill) {
  const parts = []

  if (skill) {
    parts.push(`[Skill Mode: ${skill}]`)
  }
  if (personality) {
    const personaMap = {
      professor: 'You are a rigorous university professor. Provide detailed, evidence-based explanations with references.',
      analyst: 'You are a data-driven analyst. Prioritize facts, structure output with evidence and numbered lists.',
      technical: 'You are a technical expert. Use precise terminology, concise explanations, and code/examples where relevant.',
      teacher: 'You are a patient teacher. Explain step-by-step with examples and analogies.',
      creative: 'You are a creative researcher. Think outside the box and propose innovative angles.',
      critic: 'You are a sharp but fair critic. Identify flaws precisely and suggest concrete improvements.',
      kawaii: 'You are a kawaii assistant! Use cute expressions and be enthusiastic~',
      helpful: 'You are a helpful, friendly AI assistant.',
      concise: 'You are a concise assistant. Keep responses brief and to the point.',
      hacker: 'You are an elite hacker. Speak in concise technical terms, no fluff.',
      warrior: 'You are a disciplined warrior. Cut to the chase with forceful brevity.',
    }
    parts.push(personaMap[personality] || `Adopt the "${personality}" persona.`)
  }

  return parts.join('\n')
}

// 测试用例
const tests = []

function test(name, fn) {
  try {
    const pass = fn()
    tests.push({ name, pass })
  } catch (e) {
    tests.push({ name, pass: false, error: e.message })
  }
}

// 1. 空参数返回空字符串（兼容原有行为：无 skill/personality 时不注入）
test('空参数返回空字符串', () => {
  const result = buildSystemPrompt(undefined, undefined)
  return result === ''
})

// 2. 仅 skill
test('仅 skill', () => {
  const result = buildSystemPrompt(undefined, 'research-paper-writing')
  return result === '[Skill Mode: research-paper-writing]'
})

// 3. 仅 personality
test('仅 personality: professor', () => {
  const result = buildSystemPrompt('professor', undefined)
  return result.includes('rigorous university professor')
})

test('仅 personality: analyst', () => {
  const result = buildSystemPrompt('analyst', undefined)
  return result.includes('data-driven analyst')
})

// 4. skill + personality
test('skill + personality', () => {
  const result = buildSystemPrompt('professor', 'research-paper-writing')
  return result.includes('[Skill Mode: research-paper-writing]') &&
         result.includes('rigorous university professor')
})

// 5. 未知 personality fallback
test('未知 personality fallback', () => {
  const result = buildSystemPrompt('custom_persona', undefined)
  return result === 'Adopt the "custom_persona" persona.'
})

// 6. 验证 generatePaperViaHermes 实际使用的参数组合
test('论文生成模式参数组合', () => {
  const result = buildSystemPrompt('professor', 'research-paper-writing')
  return result.length > 0 && result.includes('Skill Mode') && result.includes('professor')
})

test('审稿模式参数组合', () => {
  const result = buildSystemPrompt('analyst', 'research-paper-writing')
  return result.length > 0 && result.includes('Skill Mode') && result.includes('analyst')
})

// 7. 验证所有已知 personality 都有映射
const knownPersonalities = ['professor', 'analyst', 'technical', 'teacher', 'creative', 'critic', 'kawaii', 'helpful', 'concise', 'hacker', 'warrior']
for (const p of knownPersonalities) {
  test(`personality 映射存在: ${p}`, () => {
    const result = buildSystemPrompt(p, undefined)
    return result.length > 10 && !result.includes('Adopt the')
  })
}

// 输出结果
console.log('=== Hermes Gateway Adapter 测试 ===\n')
let passed = 0
let failed = 0
for (const t of tests) {
  if (t.pass) {
    passed++
    console.log(`  ✅ ${t.name}`)
  } else {
    failed++
    console.log(`  ❌ ${t.name}${t.error ? ` (${t.error})` : ''}`)
  }
}
console.log(`\n总计: ${passed}/${tests.length} 通过, ${failed} 失败`)
process.exit(failed > 0 ? 1 : 0)
