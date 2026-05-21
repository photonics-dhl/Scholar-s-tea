/**
 * 直接测试论文生成 API（无需浏览器）
 * 调用 /api/v1/ai/chat 测试各阶段输出
 */

const BASE_URL = 'http://10.72.212.33:3002';

async function testPaperGeneration(stage, topic, extra = {}) {
  const body = {
    action: 'paper_generation',
    stage,
    topic,
    stream: false,
    ...extra,
  };

  console.log(`\n[TEST] Stage: ${stage}, Topic: ${topic}`);
  const startTime = Date.now();

  try {
    const res = await fetch(`${BASE_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.log(`[TEST] HTTP ${res.status} in ${elapsed}ms`);
      console.log(`[TEST] Response: ${text.slice(0, 500)}`);
      return { pass: false, error: `HTTP ${res.status}`, status: res.status };
    }

    const data = await res.json();

    if (!data.success) {
      console.log(`[TEST] API error: ${data.error?.message || 'unknown'}`);
      return { pass: false, error: data.error?.message, status: res.status };
    }

    const content = data.data?.content || '';
    console.log(`[TEST] Success in ${elapsed}ms, content length: ${content.length}`);
    console.log(`[TEST] Content preview: ${content.slice(0, 200).replace(/\n/g, ' ')}...`);

    return { pass: true, content, status: res.status, elapsed };
  } catch (err) {
    console.log(`[TEST] Network error: ${err.message}`);
    return { pass: false, error: err.message };
  }
}

async function runTests() {
  console.log('========================================');
  console.log('Paper Generation API Direct Test');
  console.log(`Target: ${BASE_URL}`);
  console.log('========================================');

  const results = [];

  // Test 1: Proposal
  const r1 = await testPaperGeneration('proposal', '量子计算在药物发现中的应用', {
    background: '目前已有分子对接方法计算成本较高',
  });
  const r1IsData = r1.content && /统计方法建议|图表描述|NRMSE|ANOVA/i.test(r1.content);
  const r1Pass = r1.pass && !r1IsData;
  results.push({ test: 'Proposal', pass: r1Pass, ...r1, isDataStage: r1IsData });

  // Test 2: Writing
  const r2 = await testPaperGeneration('writing', '量子计算在药物发现中的应用', {
    section: '引言',
    wordCount: 800,
  });
  const r2IsData = r2.content && /统计方法建议|图表描述|数据特征分析/i.test(r2.content);
  const r2Pass = r2.pass && !r2IsData;
  results.push({ test: 'Writing', pass: r2Pass, ...r2, isDataStage: r2IsData });

  // Test 3: Formatting (Markdown)
  const r3 = await testPaperGeneration('formatting', '量子计算在药物发现中的应用', {
    format: 'markdown',
    content: '# 量子计算辅助药物发现\n\n## 摘要\n量子计算展现出巨大潜力...\n\n## 方法\n基于VQE的分子对接...',
  });
  const r3IsData = r3.content && /统计方法建议|图表描述|假设检验设计/i.test(r3.content);
  const r3MultiFormat = r3.content && /<<BLOCK\d*>>>|LaTeX.*Markdown.*纯文本/i.test(r3.content);
  const r3Placeholders = r3.content && /<<BLOCK\d*>>>|\[内容见上\]/i.test(r3.content);
  const r3Pass = r3.pass && !r3IsData && !r3MultiFormat && !r3Placeholders;
  results.push({ test: 'Formatting Markdown', pass: r3Pass, ...r3, isDataStage: r3IsData, multiFormat: r3MultiFormat, placeholders: r3Placeholders });

  // Test 4: Formatting (LaTeX)
  const r4 = await testPaperGeneration('formatting', '测试论文', {
    format: 'latex',
    content: '## 方法\n我们提出了一种新的算法...',
  });
  const r4IsData = r4.content && /统计方法建议|图表描述/i.test(r4.content);
  const r4Pass = r4.pass && !r4IsData;
  results.push({ test: 'Formatting LaTeX', pass: r4Pass, ...r4, isDataStage: r4IsData });

  // Test 5: Data
  const r5 = await testPaperGeneration('data', '量子计算在药物发现中的应用', {
    dataDescription: '数据集包含1000个分子的物理化学性质',
    analysisGoal: '分析分子特征与生物活性的相关性',
  });
  const r5HasData = r5.content && /统计方法|数据特征|假设检验|图表类型/i.test(r5.content);
  const r5Pass = r5.pass && r5HasData;
  results.push({ test: 'Data', pass: r5Pass, ...r5, hasDataAnalysis: r5HasData });

  // Summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  for (const r of results) {
    const details = [];
    if (r.isDataStage) details.push('isDataStage=true');
    if (r.multiFormat) details.push('multiFormat=true');
    if (r.placeholders) details.push('placeholders=true');
    if (r.hasDataAnalysis !== undefined) details.push(`hasDataAnalysis=${r.hasDataAnalysis}`);
    if (r.error) details.push(`error=${r.error}`);
    console.log(`${r.pass ? '✅' : '❌'} ${r.test}${details.length > 0 ? ' (' + details.join(', ') + ')' : ''}`);
  }
  console.log(`\nTotal: ${passed}/${total} passed`);

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
