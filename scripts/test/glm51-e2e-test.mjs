/**
 * GLM-5.1 (ZAI Coding Plan) 端到端格式测试
 * max_tokens 设为 4096，因为 GLM-5.1 的 reasoning 会消耗大量 token
 */

const ZAI_API_KEY = process.env.ZAI_API_KEY;
const ZAI_BASE_URL = 'https://api.z.ai/api/coding/paas/v4';

async function callGLM(systemPrompt, userPrompt, maxTokens = 4096) {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userPrompt });

  const res = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-5.1',
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    reasoning: data.choices?.[0]?.message?.reasoning_content || '',
    finishReason: data.choices?.[0]?.finish_reason,
  };
}

function analyze(content) {
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
    hasTable: /\|.*\|/.test(content) && content.includes('---'),
    hasDetails: content.includes('<details'),
    hasCodeBlock: content.includes('```'),
    length: content.length,
  };
}

async function test(name, systemPrompt, userPrompt) {
  console.log(`\n=== ${name} ===`);
  try {
    const { content, reasoning, finishReason } = await callGLM(systemPrompt, userPrompt);
    console.log('Content:');
    console.log(content || '(empty)');
    if (reasoning) {
      console.log('\nReasoning (first 200 chars):', reasoning.slice(0, 200) + '...');
    }
    console.log('Finish reason:', finishReason);
    const a = analyze(content);
    console.log('\nFormat analysis:');
    console.log(`  h5 #####      : ${a.hasH5 ? '⚠️ raw in output' : '✅ no raw'}`);
    console.log(`  [!IMPORTANT]  : ${a.hasGFM_IMPORTANT ? '✅' : '❌'}`);
    console.log(`  [!WARNING]    : ${a.hasGFM_WARNING ? '✅' : '❌'}`);
    console.log(`  [!NOTE]       : ${a.hasGFM_NOTE ? '✅' : '❌'}`);
    console.log(`  [!CAUTION]    : ${a.hasGFM_CAUTION ? '⚠️ unused' : '➖'}`);
    console.log(`  [!TIP]        : ${a.hasGFM_TIP ? '⚠️ unused' : '➖'}`);
    console.log(`  [关键]         : ${a.hasLegacyKey ? '✅' : '➖'}`);
    console.log(`  [注意]         : ${a.hasLegacyNote ? '✅' : '➖'}`);
    console.log(`  [建议]         : ${a.hasLegacySuggest ? '✅' : '➖'}`);
    console.log(`  Table         : ${a.hasTable ? '✅' : '❌'}`);
    console.log(`  Length        : ${a.length} chars`);
    return { name, content, analysis: a, ok: true };
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    return { name, error: err.message, ok: false };
  }
}

async function main() {
  console.log('=== GLM-5.1 Coding Plan 端到端格式测试 ===');
  console.log('Endpoint:', ZAI_BASE_URL);

  const baseSystem = `你是 Scholar's Tea 学者茶话会的学术 AI 助手，一位拥有丰富经验的高校教授和研究者。

输出格式规范：
- 使用 Markdown 表格呈现对比数据
- 关键结论前使用 "> [关键] " 提示框，警告前使用 "> [注意] "，方法建议前使用 "> [建议] "
- 也可使用标准 GitHub Alert 语法："> [!NOTE]"、"> [!WARNING]"、"> [!IMPORTANT]"、"> [!CAUTION]"、"> [!TIP]"（注意 > 与 [ 之间必须有空格）
- 步骤式内容使用有序列表
- 并列要点使用无序列表
- 长篇辅助内容使用折叠区块 <details><summary>摘要</summary>详情</details>
- 数学符号使用 UTF-8 Unicode，禁止使用 LaTeX 语法`;

  // Test 1: GFM Alert + headings + table
  const r1 = await test(
    '测试1: GFM Alert + 标题 + 表格',
    baseSystem,
    `简要介绍"深度学习在材料科学中的应用"（300字以内）：
1. 使用 ##### 作为小节标题
2. 用 > [!IMPORTANT] 强调一个关键发现
3. 用 > [!WARNING] 指出一个常见误区
4. 用 > [!NOTE] 补充一条背景信息
5. 用一个 Markdown 表格对比 CNN 与 Transformer 的优缺点`
  );

  // Test 2: Traditional markers
  const r2 = await test(
    '测试2: 传统标记 [关键]/[注意]/[建议]',
    baseSystem,
    `简要分析深度学习在药物发现中的挑战（150字以内）：
- 关键结论前使用 "> [关键]"
- 局限性前使用 "> [注意]"
- 改进建议前使用 "> [建议]"`
  );

  // Test 3: Professor personality + skill
  const r3 = await test(
    '测试3: Professor personality + skill 指令',
    `${baseSystem}\n[Skill Mode: research-paper-writing]\nYou are a rigorous university professor. Provide detailed, evidence-based explanations with references.`,
    `用一句话解释"过拟合"，要求学术严谨`
  );

  // Summary
  console.log('\n=== 测试总结 ===');
  const results = [r1, r2, r3];
  const passed = results.filter(r => r.ok).length;
  console.log(`通过: ${passed}/${results.length}`);

  for (const r of results) {
    if (!r.ok) {
      console.log(`  ${r.name}: ❌ ${r.error}`);
    } else {
      const a = r.analysis;
      const gfmScore = [a.hasGFM_IMPORTANT, a.hasGFM_WARNING, a.hasGFM_NOTE].filter(Boolean).length;
      const legacyScore = [a.hasLegacyKey, a.hasLegacyNote, a.hasLegacySuggest].filter(Boolean).length;
      console.log(`  ${r.name}: GFM=${gfmScore}/3, Legacy=${legacyScore}/3, Table=${a.hasTable ? '✅' : '❌'}, Len=${a.length}`);
    }
  }
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
