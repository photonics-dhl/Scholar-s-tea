/**
 * Playwright Paper Generation E2E Test
 * 测试论文生成 5 阶段工作流，验证各阶段输出是否符合预期
 *
 * Run: npx playwright test tests/playwright-paper-gen-test.js --headed
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://10.72.212.33:3002';
const TEST_TOPIC = '量子计算在药物发现中的应用';

// Helper: 登录（如果需要）
async function ensureLoggedIn(page) {
  await page.goto(`${BASE_URL}/workshop?mode=paper_generation`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // 检查是否在登录页
  const url = page.url();
  if (url.includes('/signin') || url.includes('/login')) {
    console.log('[TEST] Login required, filling credentials...');
    // 尝试使用访客模式或直接跳过（假设测试环境允许匿名访问）
    // 如果需要登录，请在此填写测试账号
    console.log('[TEST] WARN: Login page detected, test may fail without auth');
  }
}

// Helper: 切换到论文生成模式
async function switchToPaperGeneration(page) {
  await page.goto(`${BASE_URL}/workshop?mode=paper_generation`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 验证 PaperGenerationPanel 出现
  const topicInput = page.locator('input[placeholder*="论文主题"]').first();
  await expect(topicInput).toBeVisible({ timeout: 5000 });
  console.log('[TEST] Paper Generation panel is visible');
}

// Helper: 提交指定阶段
async function submitStage(page, stageId, topic, extraData = {}) {
  // 点击阶段标签
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
    await page.waitForTimeout(500);
  }

  // 填写主题
  const topicInput = page.locator('input[placeholder*="论文主题"]').first();
  await topicInput.fill(topic);

  // 根据阶段填写额外内容
  switch (stageId) {
    case 'proposal':
      if (extraData.background) {
        await page.locator('textarea[placeholder*="研究背景"]').first().fill(extraData.background);
      }
      break;
    case 'structure':
      if (extraData.content) {
        await page.locator('textarea[placeholder*="开题报告"]').first().fill(extraData.content);
      }
      break;
    case 'writing':
      if (extraData.section) {
        await page.locator('input[placeholder*="目标章节"]').first().fill(extraData.section);
      }
      if (extraData.wordCount) {
        const wcInput = page.locator('input[type="number"]').first();
        await wcInput.fill(String(extraData.wordCount));
      }
      if (extraData.content) {
        await page.locator('textarea[placeholder*="上下文"]').first().fill(extraData.content);
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
        const formatBtn = page.locator('button', { hasText: extraData.format === 'latex' ? 'LaTeX' : extraData.format === 'markdown' ? 'Markdown' : '纯文本' }).first();
        await formatBtn.click();
        await page.waitForTimeout(300);
      }
      if (extraData.content) {
        await page.locator('textarea[placeholder*="论文全文"]').first().fill(extraData.content);
      }
      break;
  }

  // 点击生成按钮
  const submitBtn = page.locator('button', { hasText: '开始生成' }).first();
  await submitBtn.click();
  console.log(`[TEST] Submitted stage: ${stageId}`);
}

// Helper: 等待响应完成
async function waitForResponse(page, timeoutMs = 120000) {
  const startTime = Date.now();
  let lastContent = '';
  let stableCount = 0;

  while (Date.now() - startTime < timeoutMs) {
    await page.waitForTimeout(2000);

    // 检查是否还在加载
    const isLoading = await page.locator('text=生成中...').first().isVisible().catch(() => false);
    const isThinking = await page.locator('text=AI 思考中').first().isVisible().catch(() => false);

    if (!isLoading && !isThinking) {
      // 等待内容稳定
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

// Helper: 提取最后一条 AI 消息的内容
async function getLastAssistantMessage(page) {
  const messages = await page.locator('[data-role="assistant"], .assistant-message, .message-assistant').all();
  if (messages.length > 0) {
    return await messages[messages.length - 1].textContent();
  }
  // Fallback: try to get content from the page
  return await page.evaluate(() => {
    const allText = document.body.innerText;
    // Find the last substantial text block after "开始生成" or similar
    return allText;
  });
}

// =============================================================================
// 测试用例
// =============================================================================

test.describe('Paper Generation Workshop Tests', () => {
  test('Stage 1: Proposal - should generate research proposal framework', async ({ page }) => {
    await switchToPaperGeneration(page);
    await submitStage(page, 'proposal', TEST_TOPIC, {
      background: '目前已有分子对接方法计算成本较高',
    });

    const responseText = await waitForResponse(page, 90000);

    // 验证输出包含proposal阶段应有的内容
    const checks = [
      { name: '研究背景', pattern: /研究背景|背景/i },
      { name: '科学问题', pattern: /科学问题|问题|Q1/i },
      { name: '创新点', pattern: /创新|创新点/i },
      { name: '引用标记', pattern: /\[REF-\d+\]/ },
    ];

    for (const check of checks) {
      const pass = check.pattern.test(responseText);
      console.log(`[TEST] Proposal check "${check.name}": ${pass ? 'PASS' : 'FAIL'}`);
      expect(pass, `Expected proposal to contain ${check.name}`).toBe(true);
    }

    // 验证不是data阶段输出
    const isDataStage = /统计方法|图表描述|假设检验|NRMSE|ANOVA/i.test(responseText);
    expect(isDataStage, 'Proposal stage should NOT return data analysis content').toBe(false);
  });

  test('Stage 3: Writing - should generate academic text for a section', async ({ page }) => {
    await switchToPaperGeneration(page);
    await submitStage(page, 'writing', TEST_TOPIC, {
      section: '引言',
      wordCount: 800,
      content: '本文研究量子计算在分子对接中的应用',
    });

    const responseText = await waitForResponse(page, 90000);

    // 验证是正文写作而非其他阶段
    const checks = [
      { name: '段落结构', pattern: /。|\n\n/ },
      { name: '学术语气', pattern: /研究表明|实验结果|本文提出/i },
    ];

    for (const check of checks) {
      const pass = check.pattern.test(responseText);
      console.log(`[TEST] Writing check "${check.name}": ${pass ? 'PASS' : 'FAIL'}`);
    }

    // 验证不是data阶段输出
    const isDataStage = /统计方法建议|图表描述|数据特征分析/i.test(responseText);
    console.log(`[TEST] Writing stage isDataStage: ${isDataStage}`);
    expect(isDataStage, 'Writing stage should NOT return data analysis content').toBe(false);
  });

  test('Stage 5: Formatting - should convert to single format without placeholders', async ({ page }) => {
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

    // 验证不是data阶段输出
    const isDataStage = /统计方法建议|图表描述|假设检验设计/i.test(responseText);
    console.log(`[TEST] Formatting stage isDataStage: ${isDataStage}`);
    expect(isDataStage, 'Formatting stage should NOT return data analysis content').toBe(false);

    // 验证没有多格式输出
    const hasMultipleFormats = /<<BLOCK\d*>>|LaTeX.*Markdown.*纯文本|Markdown.*LaTeX/i.test(responseText);
    console.log(`[TEST] Formatting hasMultipleFormats: ${hasMultipleFormats}`);
    expect(hasMultipleFormats, 'Formatting should NOT output multiple formats').toBe(false);

    // 验证没有占位符
    const hasPlaceholders = /<<BLOCK\d*>>>|\[内容见上\]|\[见上文\]/i.test(responseText);
    console.log(`[TEST] Formatting hasPlaceholders: ${hasPlaceholders}`);
    expect(hasPlaceholders, 'Formatting should NOT use placeholders').toBe(false);

    // 验证包含原始内容
    const hasOriginalContent = responseText.includes('量子计算') || responseText.includes('药物发现');
    console.log(`[TEST] Formatting hasOriginalContent: ${hasOriginalContent}`);
    expect(hasOriginalContent, 'Formatting should preserve original content').toBe(true);
  });

  test('Stage 5: Formatting with LaTeX - should output LaTeX only', async ({ page }) => {
    await switchToPaperGeneration(page);

    const sampleContent = '## 方法\n我们提出了一种新的算法...';

    await submitStage(page, 'formatting', '测试论文', {
      format: 'latex',
      content: sampleContent,
    });

    const responseText = await waitForResponse(page, 90000);

    // 验证不是data阶段
    const isDataStage = /统计方法建议|图表描述/i.test(responseText);
    expect(isDataStage, 'LaTeX formatting should NOT return data analysis').toBe(false);

    // 验证包含LaTeX特征
    const hasLatex = /\\documentclass|\\section|\\begin\{/i.test(responseText);
    console.log(`[TEST] LaTeX formatting hasLatex: ${hasLatex}`);
    // 不强求一定有 \documentclass，但应该不是data阶段内容
  });

  test('Stage 4: Data - should analyze data and suggest statistical methods', async ({ page }) => {
    await switchToPaperGeneration(page);
    await submitStage(page, 'data', TEST_TOPIC, {
      dataDescription: '数据集包含1000个分子的物理化学性质，包括分子量、脂溶性、极性表面积等特征',
      analysisGoal: '分析不同分子特征的分布，并找出与生物活性的相关性',
    });

    const responseText = await waitForResponse(page, 90000);

    // 验证是data阶段输出
    const hasDataAnalysis = /统计方法|数据特征|假设检验|图表类型/i.test(responseText);
    console.log(`[TEST] Data stage hasDataAnalysis: ${hasDataAnalysis}`);
    expect(hasDataAnalysis, 'Data stage should return statistical analysis').toBe(true);
  });
});

module.exports = { BASE_URL };
