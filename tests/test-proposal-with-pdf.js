/**
 * 测试 proposal 阶段上传 PDF 内容，确认是否复述
 */

const BASE_URL = 'http://10.72.212.33:3002';

const SAMPLE_PDF_TEXT = `设计基于液晶材料的可重构超表面时，主要利用液晶材料的双折射效应，通过电场改变液晶分子取向，分子主轴方向的折射率和垂直方向折射率之间的差异使光波在通过液晶时的光程发生变化，从而实现动态相位调制。具体而言，可相对独立地设计二者的功能，例如液晶作为动态波片实时调节入射光的偏振态，超表面作为偏振复用器件，二者相结合实现不同功能的切换 [24]，也可对液晶与超表面功能进行整体设计以提供互补的调制效果，超表面单元的电磁响应通过改变纳米结构的几何尺寸、形状和取向进行设计，液晶的可调双折射特性则提供额外的动态调控自由度，在器件小型化的同时实现复杂的波前调制 [25-26]。`;

const TOPIC = '基于液晶材料的可重构超表面研究';

async function testProposal(useHermes) {
  const body = {
    action: 'paper_generation',
    stage: 'proposal',
    topic: TOPIC,
    content: SAMPLE_PDF_TEXT,
    stream: false,
    useHermes,
  };

  console.log(`\n[TEST] Proposal useHermes=${useHermes}`);
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
      return { pass: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const content = data.data?.content || '';

    // 检查复述指标
    const hasDirectQuote = content.includes('双折射效应') || content.includes('金纳米棒阵列');
    const hasParaphrase = content.includes('液晶') && content.includes('超表面');
    const hasAcademicStructure = /研究背景|科学问题|创新点|研究方法/i.test(content);
    const hasAnalysis = /分析|综合|本文提出|研究表明/i.test(content);
    const isFormattingBehavior = /排版|转换|原文过长|剩余部分/i.test(content);

    console.log(`  Success in ${elapsed}ms, length: ${content.length}`);
    console.log(`  hasDirectQuote: ${hasDirectQuote}`);
    console.log(`  hasAcademicStructure: ${hasAcademicStructure}`);
    console.log(`  hasAnalysis: ${hasAnalysis}`);
    console.log(`  isFormattingBehavior: ${isFormattingBehavior}`);
    console.log(`  Preview: ${content.slice(0, 250).replace(/\n/g, ' ')}...`);

    return {
      pass: !hasDirectQuote && hasAnalysis && !isFormattingBehavior,
      content,
      hasDirectQuote,
      hasAnalysis,
      isFormattingBehavior,
      elapsed,
    };
  } catch (err) {
    console.log(`  Error: ${err.message}`);
    return { pass: false, error: err.message };
  }
}

async function run() {
  console.log('========================================');
  console.log('Proposal Stage with PDF Content Test');
  console.log('========================================');

  // 先测试 FastPath（确保基本流程正常）
  const r1 = await testProposal(false);

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`${r1.pass ? '✅' : '❌'} FastPath Proposal: ${r1.pass ? 'PASS' : r1.error || 'FAIL'}`);
  if (r1.content) {
    console.log(`   DirectQuote=${r1.hasDirectQuote}, Analysis=${r1.hasAnalysis}, FormattingBehavior=${r1.isFormattingBehavior}`);
  }
}

run().catch(console.error);
