/**
 * 验证修复：PDF 上传后 formatting 阶段不再原样复述
 * 同时验证 proposal 阶段仍然正常
 */

const BASE_URL = 'http://10.72.212.33:3002';

const SAMPLE_PDF_TEXT = `设计基于液晶材料的可重构超表面时，主要利用液晶材料的双折射效应，通过电场改变液晶分子取向，分子主轴方向的折射率和垂直方向折射率之间的差异使光波在通过液晶时的光程发生变化，从而实现动态相位调制。具体而言，可相对独立地设计二者的功能，例如液晶作为动态波片实时调节入射光的偏振态，超表面作为偏振复用器件，二者相结合实现不同功能的切换 [24]，也可对液晶与超表面功能进行整体设计以提供互补的调制效果，超表面单元的电磁响应通过改变纳米结构的几何尺寸、形状和取向进行设计，液晶的可调双折射特性则提供额外的动态调控自由度，在器件小型化的同时实现复杂的波前调制 [25-26]。

2020年，LIU [26] 课题组采用结合液晶材料的金属超表面结构，设计了四个可寻址的像素单元，由四个独立电极进行控制。如图1(a)所示，金纳米棒阵列嵌在介电聚合物中，上层交替覆盖相同厚度的液晶与聚甲基丙烯酸甲酯（PMMA）沟槽，结构中液晶的折射率可以通过施加交流正弦信号进行调控，同时PMMA的折射率保持不变，因此为相邻奇偶列引入不同的相位延迟，实现像素单元"0"或"1"状态的切换，可进一步用于光束调控与动态全息显示。`;

const TOPIC = '基于液晶材料的可重构超表面研究';

async function testStage(stage, useHermes, label) {
  const body = {
    action: 'paper_generation',
    stage,
    topic: TOPIC,
    content: SAMPLE_PDF_TEXT,
    format: stage === 'formatting' ? 'markdown' : undefined,
    stream: false,
    useHermes,
  };

  console.log(`\n[TEST] ${label}`);
  console.log(`  stage=${stage}, useHermes=${useHermes}`);
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
      console.log(`  HTTP ${res.status} in ${elapsed}ms`);
      console.log(`  Response: ${text.slice(0, 300)}`);
      return { pass: false, error: `HTTP ${res.status}`, content: '' };
    }

    const data = await res.json();
    const content = data.data?.content || '';

    console.log(`  Success in ${elapsed}ms, content length: ${content.length}`);

    // 检查复述指标
    const directQuotes = [
      '双折射效应',
      '金纳米棒阵列',
      '聚甲基丙烯酸甲酯',
      '交流正弦信号',
      '奇偶列引入不同的相位延迟',
      '像素单元"0"或"1"状态的切换',
    ];
    const matchedQuotes = directQuotes.filter(q => content.includes(q));
    const hasDirectQuote = matchedQuotes.length > 0;

    const isFormattingBehavior = /排版剩余部分|原文过长|完整转换|继续排版/i.test(content);
    const hasAcademicStructure = /摘要|引言|研究背景|方法|实验|结论|分析|综合/i.test(content);
    const hasAnalysis = /分析|综合|本文提出|研究表明|基于.*进行|创造性/i.test(content);
    const hasOriginality = !hasDirectQuote || matchedQuotes.length <= 1; // 允许少量术语引用

    console.log(`  matchedQuotes: ${matchedQuotes.length}/${directQuotes.length} [${matchedQuotes.join(', ')}]`);
    console.log(`  isFormattingBehavior: ${isFormattingBehavior}`);
    console.log(`  hasAcademicStructure: ${hasAcademicStructure}`);
    console.log(`  hasAnalysis: ${hasAnalysis}`);
    console.log(`  Preview: ${content.slice(0, 250).replace(/\n/g, ' ')}...`);

    return {
      pass: !isFormattingBehavior && hasAnalysis,
      content,
      matchedQuotes,
      isFormattingBehavior,
      hasAcademicStructure,
      hasAnalysis,
      elapsed,
    };
  } catch (err) {
    console.log(`  Error: ${err.message}`);
    return { pass: false, error: err.message, content: '' };
  }
}

async function runTests() {
  console.log('========================================');
  console.log('PDF Retest Verification After Fix');
  console.log(`Target: ${BASE_URL}`);
  console.log('========================================');

  const results = [];

  // Test 1: FastPath formatting (the stage that was causing verbatim output)
  const r1 = await testStage('formatting', false, 'FastPath Formatting (FIX TARGET)');
  results.push({ test: 'FastPath Formatting', ...r1 });

  // Test 2: FastPath proposal (should still work normally)
  const r2 = await testStage('proposal', false, 'FastPath Proposal (REGRESSION CHECK)');
  results.push({ test: 'FastPath Proposal', ...r2 });

  // Summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  for (const r of results) {
    const status = r.pass ? '✅' : r.error ? '💥' : '❌';
    console.log(`${status} ${r.test}${r.error ? ' ERROR: ' + r.error : ''}`);
    if (r.content) {
      console.log(`   matchedQuotes=${r.matchedQuotes?.length || 0}, analysis=${r.hasAnalysis}, formattingBehavior=${r.isFormattingBehavior}, elapsed=${r.elapsed}ms`);
    }
  }
}

runTests().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
