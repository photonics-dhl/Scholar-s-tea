/**
 * 单独测试 formatting 阶段（最关键）
 */

const BASE_URL = 'http://10.72.212.33:3002';

async function testFormatting(format, content) {
  console.log(`\n[TEST] Formatting: ${format.toUpperCase()}`);
  const startTime = Date.now();

  try {
    const res = await fetch(`${BASE_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'paper_generation',
        stage: 'formatting',
        topic: '量子计算在药物发现中的应用',
        format,
        content,
        stream: false,
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.log(`[TEST] HTTP ${res.status} in ${elapsed}ms`);
      console.log(`[TEST] Response: ${text.slice(0, 300)}`);
      return { pass: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    if (!data.success) {
      console.log(`[TEST] API error: ${data.error?.message || 'unknown'}`);
      return { pass: false, error: data.error?.message };
    }

    const text = data.data?.content || '';
    console.log(`[TEST] Success in ${elapsed}ms, length: ${text.length}`);
    console.log(`[TEST] Preview: ${text.slice(0, 300).replace(/\n/g, ' ')}...`);

    const isDataStage = /统计方法建议|图表描述|假设检验设计|数据特征分析|NRMSE|ANOVA|SSIM/i.test(text);
    const hasMultipleFormats = /<<BLOCK\d*>>>|LaTeX.*Markdown.*纯文本|Markdown.*LaTeX|三种格式/i.test(text);
    const hasPlaceholders = /<<BLOCK\d*>>>|\[内容见上\]|\[见上文\]|\[同上文\]/i.test(text);
    const hasOriginalContent = text.includes('量子计算') || text.includes('药物发现') || text.includes('VQE') || text.includes('分子对接');

    console.log(`[TEST] Checks: isDataStage=${isDataStage}, multiFormat=${hasMultipleFormats}, placeholders=${hasPlaceholders}, hasOriginal=${hasOriginalContent}`);

    const pass = !isDataStage && !hasMultipleFormats && !hasPlaceholders && hasOriginalContent;
    return { pass, content: text, isDataStage, hasMultipleFormats, hasPlaceholders, hasOriginalContent, elapsed };
  } catch (err) {
    console.log(`[TEST] Error: ${err.message}`);
    return { pass: false, error: err.message };
  }
}

async function run() {
  console.log('========================================');
  console.log('Formatting Stage Test');
  console.log('========================================');

  const sampleContent = `
# 量子计算辅助药物发现研究

## 摘要
量子计算在药物发现领域展现出巨大潜力。本文提出基于VQE的分子对接方法。

## 1. 引言
药物发现是一个耗时且昂贵的过程，传统计算方法难以在可行时间内模拟复杂生物分子。

## 2. 方法
我们提出了一种基于变分量子本征求解器(VQE)的分子对接方法。

## 3. 实验结果
在多个基准数据集上验证了方法的有效性。
  `.trim();

  const results = [];

  // Test Markdown
  const r1 = await testFormatting('markdown', sampleContent);
  results.push({ test: 'Formatting Markdown', ...r1 });

  // Test LaTeX
  const r2 = await testFormatting('latex', sampleContent);
  results.push({ test: 'Formatting LaTeX', ...r2 });

  // Test Plain
  const r3 = await testFormatting('plain', sampleContent);
  results.push({ test: 'Formatting Plain', ...r3 });

  // Summary
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  const passed = results.filter(r => r.pass).length;
  for (const r of results) {
    console.log(`${r.pass ? '✅' : '❌'} ${r.test}`);
    if (!r.pass) {
      if (r.isDataStage) console.log('   ❌ Returned data analysis instead of formatting');
      if (r.hasMultipleFormats) console.log('   ❌ Output multiple formats');
      if (r.hasPlaceholders) console.log('   ❌ Used placeholders');
      if (!r.hasOriginalContent && r.hasOriginalContent !== undefined) console.log('   ❌ Lost original content');
      if (r.error) console.log(`   ❌ Error: ${r.error}`);
    }
  }
  console.log(`\nTotal: ${passed}/${results.length} passed`);

  process.exit(passed === results.length ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
