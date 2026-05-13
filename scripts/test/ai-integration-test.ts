/**
 * AI 集成测试脚本
 * 测试目标：
 * 1. ZCHAT 纯文本调用
 * 2. MiniMax 纯文本调用
 * 3. 论文生成（Skill + Prompts）
 * 4. 流式输出（SSE 格式解析）
 */

import fs from 'fs'
import path from 'path'

// 手动加载 .env 文件（无需 dotenv 依赖）
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
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

import {
  chatWithZCHAT,
  chatWithZCHATStream,
  chatWithAI,
  chatWithAIStream,
  hasVisionContent,
  generatePaper,
} from '../../src/lib/ai/claude-service'
import { executeSkillStage } from '../../src/lib/ai/skills'
import { preparePaperEnhancement } from '../../src/lib/ai/paper-enhancement'

const TEST_TOPIC = '基于深度学习的联邦学习隐私保护机制研究'

// ============================================================================
// 辅助函数
// ============================================================================

function logSection(title: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('='.repeat(60))
}

function logResult(label: string, result: any) {
  if (result.error) {
    console.log(`❌ ${label}: ERROR — ${result.error}`)
  } else {
    const preview = result.content
      ? result.content.slice(0, 200).replace(/\n/g, ' ')
      : JSON.stringify(result).slice(0, 200)
    console.log(`✅ ${label}: OK — ${preview}...`)
  }
}

async function consumeStream(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let chunkCount = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunkCount++
    const text = decoder.decode(value, { stream: true })
    const lines = text.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6)
        if (jsonStr === '[DONE]') continue
        try {
          const parsed = JSON.parse(jsonStr)
          const content = parsed.choices?.[0]?.delta?.content || ''
          fullText += content
        } catch {
          fullText += jsonStr
        }
      }
    }
  }

  console.log(`   → 收到 ${chunkCount} 个 chunks, 总长度 ${fullText.length} chars`)
  return fullText
}

// ============================================================================
// 测试用例
// ============================================================================

async function testZCHATText() {
  logSection('测试 1: ZCHAT 纯文本调用')
  const result = await chatWithZCHAT([
    { role: 'user', content: '请用一句话解释什么是联邦学习。' },
  ])
  logResult('ZCHAT 纯文本', result)
  return result
}

async function testMiniMaxText() {
  logSection('测试 2: MiniMax 纯文本调用')
  const result = await chatWithAI([
    { role: 'user', content: '请用一句话解释什么是联邦学习。' },
  ])
  logResult('MiniMax 纯文本', result)
  return result
}

async function testZCHATStream() {
  logSection('测试 3: ZCHAT 流式输出')
  const streamResult = await chatWithZCHATStream([
    { role: 'user', content: '请用50字以内介绍联邦学习的三个主要挑战。' },
  ])

  if ('error' in streamResult) {
    console.log(`❌ ZCHAT Stream: ERROR — ${streamResult.error}`)
    return { error: streamResult.error }
  }

  const text = await consumeStream(streamResult)
  console.log(`✅ ZCHAT Stream: OK`)
  console.log(`   内容预览: ${text.slice(0, 150)}...`)
  return { content: text }
}

async function testMiniMaxStream() {
  logSection('测试 4: MiniMax 流式输出')
  const streamResult = await chatWithAIStream([
    { role: 'user', content: '请用50字以内介绍联邦学习的三个主要挑战。' },
  ])

  if ('error' in streamResult) {
    console.log(`❌ MiniMax Stream: ERROR — ${streamResult.error}`)
    return { error: streamResult.error }
  }

  const text = await consumeStream(streamResult)
  console.log(`✅ MiniMax Stream: OK`)
  console.log(`   内容预览: ${text.slice(0, 150)}...`)
  return { content: text }
}

async function testPaperGenerationProposal() {
  logSection('测试 5: 论文生成 — 选题立项 (proposal)')
  const result = await generatePaper('proposal', {
    topic: TEST_TOPIC,
    enableRAG: false,
    enableCitationVerify: false,
  })
  logResult('论文 proposal', result)

  if (!result.error && result.content) {
    const checks = [
      { name: '包含"研究背景"', pass: result.content.includes('研究背景') },
      { name: '包含"科学问题"', pass: result.content.includes('科学问题') || result.content.includes('问题') },
      { name: '包含"创新点"', pass: result.content.includes('创新') },
      { name: '包含引用占位符[REF-', pass: /\[REF-\d+\]/.test(result.content) },
      { name: '字数>200', pass: result.content.length > 200 },
    ]
    console.log('\n   质量检查:')
    for (const c of checks) {
      console.log(`   ${c.pass ? '✅' : '⚠️'} ${c.name}`)
    }
  }

  return result
}

async function testPaperGenerationWriting() {
  logSection('测试 6: 论文生成 — 正文写作 (writing)')
  const result = await generatePaper('writing', {
    topic: TEST_TOPIC,
    section: '引言',
    wordCount: 500,
    enableRAG: false,
    enableCitationVerify: false,
  })
  logResult('论文 writing', result)

  if (!result.error && result.content) {
    const checks = [
      { name: '包含引用占位符[REF-', pass: /\[REF-\d+\]/.test(result.content) },
      { name: '字数>200', pass: result.content.length > 200 },
    ]
    console.log('\n   质量检查:')
    for (const c of checks) {
      console.log(`   ${c.pass ? '✅' : '⚠️'} ${c.name}`)
    }
  }

  return result
}

async function testSkillEngine() {
  logSection('测试 7: Skill 引擎执行')
  try {
    const result = await executeSkillStage(
      'paper-generation',
      'proposal',
      { topic: '基于图神经网络的药物分子性质预测' },
      undefined,
      { useVision: false }
    )
    logResult('Skill 引擎', result)
    return result
  } catch (err: any) {
    console.log(`❌ Skill 引擎: ERROR — ${err.message}`)
    return { error: err.message }
  }
}

async function testVisionDetection() {
  logSection('测试 8: 图片内容检测')
  const textOnly = [{ role: 'user' as const, content: 'hello' }]
  const withImage = [
    {
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: 'describe this' },
        { type: 'image_url' as const, image_url: { url: 'data:image/png;base64,abc' } },
      ],
    },
  ]

  console.log(`   纯文本消息: hasVision = ${hasVisionContent(textOnly)} (期望: false)`)
  console.log(`   含图片消息: hasVision = ${hasVisionContent(withImage)} (期望: true)`)
}

async function testRAGEnhancement() {
  logSection('测试 9: RAG 增强（可能无数据）')
  try {
    const enhancement = await preparePaperEnhancement(TEST_TOPIC, { discipline: 'CS' })
    console.log(`   RAG 检索到 ${enhancement.ragContext.papers.length} 篇相关文献`)
    if (enhancement.ragContext.papers.length > 0) {
      console.log(`   首篇: ${enhancement.ragContext.papers[0].title}`)
    }
    console.log(`   ragPrefix 长度: ${enhancement.ragPrefix.length} chars`)
    return enhancement
  } catch (err: any) {
    console.log(`⚠️ RAG 增强失败（可能数据库无数据）: ${err.message}`)
    return null
  }
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  console.log("🧪 Scholar's Tea AI 集成测试")
  console.log(`时间: ${new Date().toISOString()}`)
  console.log(`\n环境检查:`)
  console.log(`  ZCHAT_API_KEY: ${process.env.ZCHAT_API_KEY ? '✅ 已配置' : '❌ 未配置'}`)
  console.log(`  ZCHAT_BASE_URL: ${process.env.ZCHAT_BASE_URL || '使用默认值'}`)
  console.log(`  MINIMAX_API_KEY: ${process.env.MINIMAX_API_KEY ? '✅ 已配置' : '❌ 未配置'}`)
  console.log(`  MINIMAX_BASE_URL: ${process.env.MINIMAX_BASE_URL || '使用默认值'}`)

  const results: Record<string, any> = {}

  results.zchatText = await testZCHATText()
  results.minimaxText = await testMiniMaxText()
  results.zchatStream = await testZCHATStream()
  results.minimaxStream = await testMiniMaxStream()
  results.proposal = await testPaperGenerationProposal()
  results.writing = await testPaperGenerationWriting()
  results.skill = await testSkillEngine()
  await testVisionDetection()
  results.rag = await testRAGEnhancement()

  logSection('测试总结')
  const allTests = Object.entries(results)
  const passed = allTests.filter(([, r]) => !r?.error).length
  const failed = allTests.filter(([, r]) => r?.error).length
  console.log(`总计: ${allTests.length} 项 | ✅ 通过: ${passed} | ❌ 失败: ${failed}`)

  if (failed > 0) {
    console.log('\n失败项详情:')
    for (const [name, result] of allTests) {
      if (result?.error) {
        console.log(`  - ${name}: ${result.error}`)
      }
    }
    process.exit(1)
  }

  console.log('\n🎉 所有测试通过！')
}

main().catch((err) => {
  console.error('测试脚本异常:', err)
  process.exit(1)
})
