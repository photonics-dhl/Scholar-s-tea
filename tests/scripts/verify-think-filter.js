const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. 打开 Workshop 论文生成页面
    await page.goto('http://10.72.212.33:3002/workshop?mode=paper_generation', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // 2. 等待输入框出现
    await page.waitForSelector('textarea[placeholder*="主题"], textarea[placeholder*="topic"], input[placeholder*="主题"]', { timeout: 10000 });
    const input = await page.locator('textarea, input').filter({ hasText: /^$/ }).first();
    await input.fill('基于深度学习的量子纠错码优化研究');

    // 3. 点击开始生成（通过 evaluate 避免 Live2D 遮挡）
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent.includes('开始生成') || b.textContent.includes('Generate')
      );
      if (btn) btn.click();
    });

    console.log('[TEST] Generation started, waiting for streaming...');

    // 4. 等待流式消息出现
    await page.waitForSelector('[data-testid="message-content"], .chat-message, [class*="message"]', { timeout: 15000 });

    // 5. 等待流式完成（检测最后一个消息的 [DONE] 或内容稳定）
    let lastContent = '';
    let stableCount = 0;
    for (let i = 0; i < 180; i++) { // 最多等 3 分钟
      await page.waitForTimeout(1000);
      const content = await page.evaluate(() => {
        const msgs = document.querySelectorAll('.chat-message, [data-testid="message-content"], [class*="message"]');
        const last = msgs[msgs.length - 1];
        return last ? last.innerText : '';
      });
      if (content === lastContent) {
        stableCount++;
        if (stableCount >= 5 && content.length > 100) break; // 连续5秒稳定且内容非空
      } else {
        stableCount = 0;
        lastContent = content;
      }
      if (i % 10 === 0) console.log(`[TEST] Waiting... content length: ${content.length}`);
    }

    // 6. 检查结果
    const hasThinkTag = lastContent.includes('<think>');
    const hasClosingThink = lastContent.includes('</think>');
    const hasActualContent = lastContent.length > 500 && !hasThinkTag;

    console.log('\n========== RESULT ==========');
    console.log(`Content length: ${lastContent.length}`);
    console.log(`Contains <think>: ${hasThinkTag}`);
    console.log(`Contains </think>: ${hasClosingThink}`);
    console.log(`Has actual content: ${hasActualContent}`);

    if (hasThinkTag) {
      // 提取 think 内容用于调试
      const thinkMatch = lastContent.match(/<think>[\s\S]*?<\/think>/);
      if (thinkMatch) {
        console.log(`Think content preview: ${thinkMatch[0].slice(0, 200)}...`);
      }
      console.log('\n❌ FAIL: Think tags still leaking!');
      process.exit(1);
    } else if (hasActualContent) {
      console.log('\n✅ PASS: Think tags filtered, actual content preserved.');
      process.exit(0);
    } else {
      console.log('\n⚠️ UNCERTAIN: No think tags but content seems too short or empty.');
      console.log('First 500 chars:', lastContent.slice(0, 500));
      process.exit(1);
    }

  } catch (err) {
    console.error('[TEST] Error:', err.message);
    await page.screenshot({ path: 'tests/screenshots/think-filter-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
