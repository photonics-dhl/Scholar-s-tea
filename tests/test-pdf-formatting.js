/**
 * 测试 formatting 阶段上传 PDF 的行为
 */

const BASE_URL = 'http://10.72.212.33:3002';

const SAMPLE_PDF_TEXT = `设计基于液晶材料的可重构超表面时，主要利用液晶材料的双折射效应，通过电场改变液晶分子取向，分子主轴方向的折射率和垂直方向折射率之间的差异使光波在通过液晶时的光程发生变化，从而实现动态相位调制。

2020年，LIU课题组采用结合液晶材料的金属超表面结构，设计了四个可寻址的像素单元，由四个独立电极进行控制。`;

const TOPIC = '基于液晶材料的可重构超表面研究';

async function testFormatting(useHermes) {
  const body = {
    action: 'paper_generation',
    stage: 'formatting',
    topic: TOPIC,
    content: SAMPLE_PDF_TEXT,
    format: 'markdown',
    stream: false,
    useHermes,
  };

  console.log(`\n[TEST] Formatting useHermes=${useHermes}`);
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

    console.log(`  Success in ${elapsed}ms, length: ${content.length}`);
    console.log(`  Preview: ${content.slice(0, 300).replace(/\n/g, ' ')}...`);

    const hasDirectQuote = content.includes('双折射效应') || content.includes('金纳米棒阵列');
    console.log(`  hasDirectQuote: ${hasDirectQuote}`);

    return { content, hasDirectQuote, elapsed };
  } catch (err) {
    console.log(`  Error: ${err.message}`);
    return { error: err.message };
  }
}

async function run() {
  console.log('========================================');
  console.log('PDF Formatting Stage Test');
  console.log('========================================');

  const r1 = await testFormatting(false);
  console.log('\n--- FastPath result ---');
  console.log(r1.content?.slice(0, 500) || r1.error);
}

run().catch(console.error);
