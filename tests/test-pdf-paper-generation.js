/**
 * 测试 PDF 上传后 paper_generation 是否原样复述
 * 直接调用 API，对比 FastPath 和 Gateway 的行为
 */

const BASE_URL = 'http://10.72.212.33:3002';

// 模拟一段 PDF 提取的文本（液晶超表面相关内容）
const SAMPLE_PDF_TEXT = `设计基于液晶材料的可重构超表面时，主要利用液晶材料的双折射效应，通过电场改变液晶分子取向，分子主轴方向的折射率和垂直方向折射率之间的差异使光波在通过液晶时的光程发生变化，从而实现动态相位调制。

2020年，LIU课题组采用结合液晶材料的金属超表面结构，设计了四个可寻址的像素单元，由四个独立电极进行控制。金纳米棒阵列嵌在介电聚合物中，上层交替覆盖相同厚度的液晶与聚甲基丙烯酸甲酯（PMMA）沟槽，结构中液晶的折射率可以通过施加交流正弦信号进行调控。`;

const TOPIC = '基于液晶材料的可重构超表面研究';

async function testPaperGeneration({ stage = 'proposal', useHermes = true, label }) {
  const body = {
    action: 'paper_generation',
    stage,
    topic: TOPIC,
    content: SAMPLE_PDF_TEXT,
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

    // 检查是否复述
    const hasDirectQuote = content.includes('双折射效应') || content.includes('金纳米棒阵列');
    const hasOriginalText = content.includes('液晶材料的可重构超表面');
    const isParaphrase = hasOriginalText && !hasDirectQuote;
    const isDirectCopy = hasDirectQuote;

    // 检查是否有学术写作特征
    const hasAcademicStructure = /摘要|引言|研究背景|方法|实验|结论|参考文献/i.test(content);
    const hasAnalysis = /分析|综合|讨论|本文提出|研究表明/i.test(content);

    console.log(`  hasDirectQuote: ${hasDirectQuote}`);
    console.log(`  isDirectCopy: ${isDirectCopy}`);
    console.log(`  hasAcademicStructure: ${hasAcademicStructure}`);
    console.log(`  hasAnalysis: ${hasAnalysis}`);
    console.log(`  Preview: ${content.slice(0, 200).replace(/\n/g, ' ')}...`);

    return {
      pass: !isDirectCopy && hasAnalysis,
      content,
      isDirectCopy,
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
  console.log('PDF Paper Generation — Retest Verbatim');
  console.log(`Target: ${BASE_URL}`);
  console.log('========================================');

  const results = [];

  // Test 1: FastPath (no Gateway) — proposal
  const r1 = await testPaperGeneration({ stage: 'proposal', useHermes: false, label: 'FastPath Proposal' });
  results.push({ test: 'FastPath Proposal', ...r1 });

  // Test 2: Gateway — proposal
  const r2 = await testPaperGeneration({ stage: 'proposal', useHermes: true, label: 'Gateway Proposal' });
  results.push({ test: 'Gateway Proposal', ...r2 });

  // Test 3: FastPath — writing
  const r3 = await testPaperGeneration({ stage: 'writing', useHermes: false, label: 'FastPath Writing' });
  results.push({ test: 'FastPath Writing', ...r3 });

  // Summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  for (const r of results) {
    const status = r.pass ? '✅' : r.error ? '💥' : '❌';
    console.log(`${status} ${r.test}${r.error ? ' ERROR: ' + r.error : ''}`);
    if (r.content) {
      console.log(`   isDirectCopy=${r.isDirectCopy}, hasAnalysis=${r.hasAnalysis}, elapsed=${r.elapsed}ms`);
    }
  }
}

runTests().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
