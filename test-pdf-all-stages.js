const testPdfContent = `摘要：本文提出了一种基于液晶-金属超表面结构的太赫兹动态调控器件。上层交替覆盖相同厚度的液晶与聚甲基丙烯酸甲酯（PMMA）沟槽，结构中液晶的折射率可以通过施加交流正弦信号进行调控。仿真结果表明，当液晶折射率从1.52变化到1.74时，透射峰从0.63 THz偏移到0.61 THz，调控深度达到28%。该器件在金纳米棒阵列增强下表现出显著的双折射效应。`;

async function testStage(stage) {
  const payload = {
    action: 'paper_generation',
    stage,
    topic: '基于液晶-金属超表面的太赫兹动态调控器件研究',
    content: testPdfContent,
    format: stage === 'formatting' ? 'markdown' : undefined,
    section: stage === 'writing' ? '引言' : undefined,
  };

  console.log(`\n=== Testing ${stage} stage ===`);
  try {
    const res = await fetch('http://localhost:3002/api/v1/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const text = data.content || data.response || '';
    
    // Check for verbatim phrases
    const verbatimPhrases = ['交替覆盖相同厚度', '聚甲基丙烯酸甲酯', '交流正弦信号', '双折射效应', '金纳米棒阵列', '透射峰从0.63 THz偏移到0.61 THz'];
    const matchedQuotes = verbatimPhrases.filter(p => text.includes(p));
    
    // Check for analysis indicators
    const analysisIndicators = ['分析', '综合', '改写', '基于', '参考', '研究表明', '本文提出', '因此'];
    const hasAnalysis = analysisIndicators.some(w => text.includes(w));
    
    // Check for structure
    const hasStructure = text.includes('##') || text.includes('1.') || text.includes('一、') || text.includes('引言');
    
    console.log(`Length: ${text.length} chars`);
    console.log(`Matched verbatim phrases: ${matchedQuotes.length}/${verbatimPhrases.length}`);
    console.log(`Has analysis indicators: ${hasAnalysis}`);
    console.log(`Has structure: ${hasStructure}`);
    console.log(`Preview: ${text.slice(0, 200).replace(/\n/g, ' ')}...`);
    
    return { stage, ok: matchedQuotes.length <= 2 && hasAnalysis && hasStructure, matchedQuotes, hasAnalysis, hasStructure };
  } catch (e) {
    console.log(`Error: ${e.message}`);
    return { stage, ok: false, error: e.message };
  }
}

(async () => {
  const stages = ['proposal', 'structure', 'writing'];
  const results = [];
  for (const stage of stages) {
    const r = await testStage(stage);
    results.push(r);
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log('\n=== SUMMARY ===');
  const allOk = results.every(r => r.ok);
  console.log(`All stages passed: ${allOk}`);
  results.forEach(r => console.log(`  ${r.stage}: ${r.ok ? 'PASS' : 'FAIL'} ${r.error || ''}`));
})();
