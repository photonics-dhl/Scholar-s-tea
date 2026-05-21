/**
 * Direct Playwright Paper Generation Test
 * 使用原生 playwright API，不依赖 @playwright/test
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://10.72.212.33:3002';
const TEST_TOPIC = '量子计算在药物发现中的应用';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForResponse(page, timeoutMs = 120000) {
  const startTime = Date.now();
  let lastContent = '';
  let stableCount = 0;

  while (Date.now() - startTime < timeoutMs) {
    await sleep(2000);

    const isLoading = await page.locator('text=生成中...').first().isVisible().catch(() => false);
    const isThinking = await page.locator('text=AI 思考中').first().isVisible().catch(() => false);

    if (!isLoading && !isThinking) {
      const currentContent = await page.evaluate(() => document.body.innerText);
      if (currentContent === lastContent) {
        stableCount++;
        if (stableCount >= 3) {
          console.log('[TEST] Response completed');
          return currentContent;
        }
      } else {
        stableCount = 0;
        lastContent = currentContent;
      }
    }
  }

  throw new Error(`Response timeout after ${timeoutMs}ms`);
}

async function switchToPaperGeneration(page) {
  await page.goto(`${BASE_URL}/workshop?mode=paper_generation`);
  await page.waitForLoadState('networkidle');
  await sleep(2000);

  const topicInput = page.locator('input[placeholder*="论文主题"]').first();
  const visible = await topicInput.isVisible().catch(() => false);
  if (!visible) {
    throw new Error('Paper Generation panel not visible - may need login');
  }
  console.log('[TEST] Paper Generation panel is visible');
}

async function submitStage(page, stageId, topic, extraData = {}) {
  const stageLabels = {
    proposal: '选题立项',
    structure: '架构规划',
    writing: '正文写作',
    data: '数据/图表',
    formatting: '排版交付',
  };

  const stageBtn = page.locator('button', { hasText: stageLabels[stageId] }).first();
  if (await stageBtn.isVisible().catch(() => false)) {
    await stageBtn.click();
    await sleep(500);
  }

  const topicInput = page.locator('input[placeholder*="论文主题"]').first();
  await topicInput.fill(topic);

  switch (stageId) {
    case 'proposal':
      if (extraData.background) {
        await page.locator('textarea[placeholder*="研究背景"]').first().fill(extraData.background);
      }
      break;
    case 'writing':
      if (extraData.section) {
        await page.locator('input[placeholder*="目标章节"]').first().fill(extraData.section);
      }
      if (extraData.wordCount) {
        await page.locator('input[type="number"]').first().fill(String(extraData.wordCount));
      }
      break;
    case 'data':
      if (extraData.dataDescription) {
        await page.locator('textarea[placeholder*="数据描述"]').first().fill(extraData.dataDescription);
      }
      if (extraData.analysisGoal) {
        await page.locator('input[placeholder*="分析目标"]').first().fill(extraData.analysisGoal);
      }
      break;
    case 'formatting':
      if (extraData.format) {
        const formatLabel = extraData.format === 'latex' ? 'LaTeX' : extraData.format === 'markdown' ? 'Markdown' : '纯文本';
        const formatBtn = page.locator('button', { hasText: formatLabel }).first();
        await formatBtn.click();
        await sleep(300);
      }
      if (extraData.content) {
        await page.locator('textarea[placeholder*="论文全文"]').first().fill(extraData.content);
      }
      break;
  }

  const submitBtn = page.locator('button', { hasText: '开始生成' }).first();
  await submitBtn.click();
  console.log(`[TEST] Submitted stage: ${stageId}`);
}

async function runTests() {
  console.log('[TEST] Starting Paper Generation E2E Tests...');
  console.log(`[TEST] Target: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const results = [];

  try {
    // ==========================================
    // Test 1: Proposal Stage
    // ==========================================
    console.log('\n[TEST] === Test 1: Proposal Stage ===');
    try {
      await switchToPaperGeneration(page);
      await submitStage(page, 'proposal', TEST_TOPIC, {
        background: '目前已有分子对接方法计算成本较高',
      });
      const responseText = await waitForResponse(page, 90000);

      const hasResearchBackground = /研究背景|背景|研究意义/i.test(responseText);
      const hasScientificQuestions = /科学问题|核心问题|Q1/i.test(responseText);
      const hasInnovation = /创新|创新点/i.test(responseText);
      const hasCitations = /\[REF-\d+\]/.test(responseText);
      const isDataStage = /统计方法建议|图表描述|NRMSE|ANOVA/i.test(responseText);

      const pass = hasResearchBackground && hasScientificQuestions && !isDataStage;
      results.push({ test: 'Proposal Stage', pass, hasResearchBackground, hasScientificQuestions, hasInnovation, hasCitations, isDataStage });
      console.log(`[TEST] Proposal: ${pass ? 'PASS' : 'FAIL'} (isDataStage=${isDataStage})`);
    } catch (err) {
      results.push({ test: 'Proposal Stage', pass: false, error: err.message });
      console.log(`[TEST] Proposal: FAIL - ${err.message}`);
    }

    // ==========================================
    // Test 2: Writing Stage
    // ==========================================
    console.log('\n[TEST] === Test 2: Writing Stage ===');
    try {
      await switchToPaperGeneration(page);
      await submitStage(page, 'writing', TEST_TOPIC, {
        section: '引言',
        wordCount: 800,
      });
      const responseText = await waitForResponse(page, 90000);

      const isDataStage = /统计方法建议|图表描述|数据特征分析|假设检验/i.test(responseText);
      const hasAcademicTone = /研究表明|本文提出|实验结果/i.test(responseText);

      const pass = !isDataStage;
      results.push({ test: 'Writing Stage', pass, isDataStage, hasAcademicTone });
      console.log(`[TEST] Writing: ${pass ? 'PASS' : 'FAIL'} (isDataStage=${isDataStage}, hasAcademicTone=${hasAcademicTone})`);
    } catch (err) {
      results.push({ test: 'Writing Stage', pass: false, error: err.message });
      console.log(`[TEST] Writing: FAIL - ${err.message}`);
    }

    // ==========================================
    // Test 3: Formatting Stage (Markdown)
    // ==========================================
    console.log('\n[TEST] === Test 3: Formatting Stage (Markdown) ===');
    try {
      await switchToPaperGeneration(page);
      const sampleContent = `
# 量子计算辅助药物发现研究

## 摘要
量子计算在药物发现领域展现出巨大潜力...

## 1. 引言
药物发现是一个耗时且昂贵的过程...

## 2. 方法
我们提出了一种基于变分量子本征求解器(VQE)的分子对接方法...

## 3. 实验结果
在多个基准数据集上验证了方法的有效性...
      `.trim();

      await submitStage(page, 'formatting', TEST_TOPIC, {
        format: 'markdown',
        content: sampleContent,
      });
      const responseText = await waitForResponse(page, 90000);

      const isDataStage = /统计方法建议|图表描述|假设检验设计|数据特征分析/i.test(responseText);
      const hasMultipleFormats = /<<BLOCK\d*>>>|LaTeX.*Markdown.*纯文本|Markdown.*LaTeX/i.test(responseText);
      const hasPlaceholders = /<<BLOCK\d*>>>|\[内容见上\]|\[见上文\]/i.test(responseText);
      const hasOriginalContent = responseText.includes('量子计算') || responseText.includes('药物发现');

      const pass = !isDataStage && !hasMultipleFormats && !hasPlaceholders && hasOriginalContent;
      results.push({ test: 'Formatting Markdown', pass, isDataStage, hasMultipleFormats, hasPlaceholders, hasOriginalContent });
      console.log(`[TEST] Formatting Markdown: ${pass ? 'PASS' : 'FAIL'} (isDataStage=${isDataStage}, hasMultipleFormats=${hasMultipleFormats}, hasPlaceholders=${hasPlaceholders}, hasOriginalContent=${hasOriginalContent})`);
    } catch (err) {
      results.push({ test: 'Formatting Markdown', pass: false, error: err.message });
      console.log(`[TEST] Formatting Markdown: FAIL - ${err.message}`);
    }

    // ==========================================
    // Test 4: Formatting Stage (LaTeX)
    // ==========================================
    console.log('\n[TEST] === Test 4: Formatting Stage (LaTeX) ===');
    try {
      await switchToPaperGeneration(page);
      const sampleContent = '## 方法\n我们提出了一种新的算法...\n\n## 实验\n结果表明...';

      await submitStage(page, 'formatting', '测试论文', {
        format: 'latex',
        content: sampleContent,
      });
      const responseText = await waitForResponse(page, 90000);

      const isDataStage = /统计方法建议|图表描述/i.test(responseText);
      const hasLatex = /\\documentclass|\\section|\\begin\{|\\end\{/i.test(responseText);

      const pass = !isDataStage;
      results.push({ test: 'Formatting LaTeX', pass, isDataStage, hasLatex });
      console.log(`[TEST] Formatting LaTeX: ${pass ? 'PASS' : 'FAIL'} (isDataStage=${isDataStage}, hasLatex=${hasLatex})`);
    } catch (err) {
      results.push({ test: 'Formatting LaTeX', pass: false, error: err.message });
      console.log(`[TEST] Formatting LaTeX: FAIL - ${err.message}`);
    }

    // ==========================================
    // Test 5: Data Stage
    // ==========================================
    console.log('\n[TEST] === Test 5: Data Stage ===');
    try {
      await switchToPaperGeneration(page);
      await submitStage(page, 'data', TEST_TOPIC, {
        dataDescription: '数据集包含1000个分子的物理化学性质，包括分子量、脂溶性、极性表面积等特征',
        analysisGoal: '分析不同分子特征的分布，并找出与生物活性的相关性',
      });
      const responseText = await waitForResponse(page, 90000);

      const hasDataAnalysis = /统计方法|数据特征|假设检验|图表类型/i.test(responseText);

      const pass = hasDataAnalysis;
      results.push({ test: 'Data Stage', pass, hasDataAnalysis });
      console.log(`[TEST] Data Stage: ${pass ? 'PASS' : 'FAIL'} (hasDataAnalysis=${hasDataAnalysis})`);
    } catch (err) {
      results.push({ test: 'Data Stage', pass: false, error: err.message });
      console.log(`[TEST] Data Stage: FAIL - ${err.message}`);
    }

  } finally {
    await browser.close();
  }

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  for (const r of results) {
    console.log(`${r.pass ? '✅' : '❌'} ${r.test}`);
    if (!r.pass && r.error) {
      console.log(`   Error: ${r.error}`);
    }
  }
  console.log(`\nTotal: ${passed}/${total} passed`);

  if (passed < total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('[TEST] Fatal error:', err);
  process.exit(1);
});
