/**
 * 测试 data 阶段 + PDF 内容传递
 */

const BASE_URL = 'http://10.72.212.33:3002';

async function testAPI(stage, topic, extra = {}) {
  console.log(`\n[TEST] Stage: ${stage}, Topic: ${topic}`);
  const startTime = Date.now();

  try {
    const res = await fetch(`${BASE_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'paper_generation',
        stage,
        topic,
        stream: false,
        ...extra,
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.log(`[TEST] HTTP ${res.status}: ${text.slice(0, 300)}`);
      return { pass: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    if (!data.success) {
      console.log(`[TEST] API error: ${data.error?.message}`);
      return { pass: false, error: data.error?.message };
    }

    const content = data.data?.content || '';
    console.log(`[TEST] Success in ${elapsed}ms, length: ${content.length}`);
    console.log(`[TEST] Preview: ${content.slice(0, 250).replace(/\n/g, ' ')}...`);
    return { pass: true, content, elapsed };
  } catch (err) {
    console.log(`[TEST] Error: ${err.message}`);
    return { pass: false, error: err.message };
  }
}

async function run() {
  console.log('========================================');
  console.log('Data Stage + PDF Content Test');
  console.log('========================================');

  const results = [];

  // Test 1: Data stage should return statistical analysis
  const r1 = await testAPI('data', '超表面（Metasurface）研究中的统计方法', {
    dataDescription: '数据集包含超表面器件的仿真与实验对比数据，包括透射率、反射率、相位分布等',
    analysisGoal: '评估仿真与实验的一致性，并分析超原子库的性能',
  });
  const r1HasData = r1.content && /统计方法|数据特征|假设检验|图表类型|NRMSE|ANOVA|SSIM/i.test(r1.content);
  const r1Pass = r1.pass && r1HasData;
  results.push({ test: 'Data Stage', pass: r1Pass, hasDataAnalysis: r1HasData, ...r1 });
  console.log(`[TEST] Data stage: ${r1Pass ? 'PASS' : 'FAIL'} (hasDataAnalysis=${r1HasData})`);

  // Test 2: Formatting with long content (simulating PDF)
  const longContent = `
# 基于深度学习的超表面设计优化研究

## 摘要
超表面（Metasurface）是一种由亚波长尺度的人工电磁单元构成的二维平面结构，能够在亚波长尺度内对电磁波的振幅、相位和偏振进行精确调控。本文提出了一种基于深度学习的超表面设计优化方法...

## 1. 引言
超表面作为电磁学领域的重要突破，自2011年Capasso课题组提出广义斯涅尔定律以来...

## 2. 相关工作
2.1 超表面设计方法
传统超表面设计主要依赖物理直觉和数值优化...

2.2 深度学习在电磁学中的应用
近年来，深度学习在电磁逆问题求解中展现出巨大潜力...

## 3. 方法
3.1 问题定义
设超表面由 N 个超原子组成，每个超原子的几何参数为...

3.2 网络架构
我们采用条件生成对抗网络（cGAN）作为核心架构...

3.3 训练策略
使用Adam优化器，学习率初始为1e-4...

## 4. 实验结果
4.1 数据集
收集了5000个不同结构的超表面仿真数据...

4.2 主实验
在测试集上，我们的方法相比传统方法提升了23%的设计效率...

4.3 消融实验
验证了网络各组件的贡献...

## 5. 结论
本文提出了一种基于深度学习的超表面设计优化方法...

## 参考文献
[1] Yu, N., et al. (2011). Light propagation with phase discontinuities...
[2] Khorasaninejad, M., et al. (2017). Metalenses at visible wavelengths...
  `.trim().repeat(3); // 模拟长 PDF 内容

  const r2 = await testAPI('formatting', '超表面设计优化', {
    format: 'markdown',
    content: longContent,
  });
  const r2HasOriginal = r2.content && (r2.content.includes('超表面') || r2.content.includes('深度学习') || r2.content.includes('cGAN'));
  const r2NotData = r2.content && !/统计方法建议|图表描述|假设检验设计/i.test(r2.content);
  const r2Pass = r2.pass && r2HasOriginal && r2NotData;
  results.push({ test: 'Formatting with Long PDF Content', pass: r2Pass, hasOriginal: r2HasOriginal, notData: r2NotData, ...r2 });
  console.log(`[TEST] Formatting with long PDF: ${r2Pass ? 'PASS' : 'FAIL'} (hasOriginal=${r2HasOriginal}, notData=${r2NotData})`);

  // Summary
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  const passed = results.filter(r => r.pass).length;
  for (const r of results) {
    console.log(`${r.pass ? '✅' : '❌'} ${r.test}`);
    if (!r.pass) {
      if (r.error) console.log(`   Error: ${r.error}`);
    }
  }
  console.log(`\nTotal: ${passed}/${results.length} passed`);

  process.exit(passed === results.length ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
