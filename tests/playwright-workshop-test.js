/**
 * Playwright Workshop E2E Test
 * Tests: Paper Generation, Peer Review, PDF Upload
 * 
 * Run via browser_run_code_unsafe or browser_navigate + manual interaction
 */

const BASE_URL = 'http://10.72.212.33:3002';

async function testWorkshop(page) {
  const results = [];
  
  // Test 1: Navigate to Workshop
  console.log('[TEST] Navigating to workshop...');
  await page.goto(`${BASE_URL}/workshop`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Check page loaded
  const title = await page.title();
  results.push({ test: 'Page Load', pass: title.includes('Scholar') || title.includes('学者'), title });
  
  // Test 2: Switch to Paper Generation mode
  console.log('[TEST] Switching to paper generation mode...');
  const modeSelector = await page.$('text=通用对话') || await page.$('[data-testid="mode-selector"]');
  if (modeSelector) {
    await modeSelector.click();
    await page.waitForTimeout(500);
    const paperGenOption = await page.$('text=AI论文生成');
    if (paperGenOption) {
      await paperGenOption.click();
      await page.waitForTimeout(1000);
      results.push({ test: 'Mode Switch - Paper Generation', pass: true });
    } else {
      results.push({ test: 'Mode Switch - Paper Generation', pass: false, error: 'Option not found' });
    }
  } else {
    // Try direct URL
    await page.goto(`${BASE_URL}/workshop?mode=paper_generation`);
    await page.waitForTimeout(2000);
    results.push({ test: 'Mode Switch - Paper Generation', pass: true, note: 'via URL param' });
  }
  
  // Test 3: Check Paper Generation Panel elements
  console.log('[TEST] Checking paper generation panel...');
  const hasTopicInput = await page.$('input[placeholder*="论文主题"]') !== null;
  const hasStageButtons = await page.$('text=选题构思') !== null;
  const hasPdfUpload = await page.$('text=上传 PDF') !== null;
  results.push({ 
    test: 'Paper Generation Panel', 
    pass: hasTopicInput && hasStageButtons, 
    hasTopicInput, 
    hasStageButtons,
    hasPdfUpload 
  });
  
  // Test 4: Fill and submit paper generation (proposal stage)
  console.log('[TEST] Testing paper generation submission...');
  const topicInput = await page.$('input[placeholder*="论文主题"]');
  if (topicInput) {
    await topicInput.fill('量子计算在药物发现中的应用');
    await page.waitForTimeout(500);
    
    const submitBtn = await page.$('text=开始生成');
    if (submitBtn) {
      await submitBtn.click();
      
      // Wait for loading indicator or response
      await page.waitForSelector('text=生成中...', { timeout: 5000 }).catch(() => {});
      
      // Wait up to 60s for response
      console.log('[TEST] Waiting for AI response (up to 60s)...');
      await page.waitForFunction(
        () => document.body.innerText.includes('生成中...') === false,
        { timeout: 60000 }
      );
      
      const responseText = await page.evaluate(() => document.body.innerText);
      const hasResponse = responseText.length > 500;
      const hasThinkLeak = responseText.includes('<think>') || responseText.includes('</think>');
      results.push({ 
        test: 'Paper Generation Response', 
        pass: hasResponse && !hasThinkLeak, 
        hasResponse, 
        hasThinkLeak,
        responseLength: responseText.length 
      });
    } else {
      results.push({ test: 'Paper Generation Response', pass: false, error: 'Submit button not found' });
    }
  } else {
    results.push({ test: 'Paper Generation Response', pass: false, error: 'Topic input not found' });
  }
  
  // Test 5: Switch to Peer Review mode
  console.log('[TEST] Switching to peer review mode...');
  await page.goto(`${BASE_URL}/workshop?mode=peer_review`);
  await page.waitForTimeout(2000);
  
  const hasReviewTextarea = await page.$('textarea[placeholder*="粘贴论文"]') !== null;
  const hasReviewPdfUpload = await page.$('text=上传 PDF') !== null;
  const hasFocusButtons = await page.$('text=全面评审') !== null;
  results.push({ 
    test: 'Peer Review Panel', 
    pass: hasReviewTextarea && hasFocusButtons, 
    hasReviewTextarea, 
    hasReviewPdfUpload,
    hasFocusButtons 
  });
  
  // Test 6: Submit peer review
  console.log('[TEST] Testing peer review submission...');
  const reviewTextarea = await page.$('textarea[placeholder*="粘贴论文"]');
  if (reviewTextarea) {
    await reviewTextarea.fill(`
Title: Social Media Use and Adolescent Mental Health: A Longitudinal Study

Abstract: This study examines the relationship between social media use and mental health outcomes among adolescents over a 2-year period. We recruited 1,247 participants aged 13-17 and measured depression, anxiety, and self-esteem scores. Results show a significant negative correlation between daily social media use >3 hours and mental health scores (r=-0.34, p<0.001).

Introduction: Adolescent mental health has declined globally in the past decade, coinciding with the rise of social media platforms...
    `.trim());
    
    const reviewBtn = await page.$('text=开始评审');
    if (reviewBtn) {
      await reviewBtn.click();
      
      await page.waitForSelector('text=评审中...', { timeout: 5000 }).catch(() => {});
      
      console.log('[TEST] Waiting for peer review response (up to 60s)...');
      await page.waitForFunction(
        () => document.body.innerText.includes('评审中...') === false,
        { timeout: 60000 }
      );
      
      const reviewText = await page.evaluate(() => document.body.innerText);
      const hasReviewResponse = reviewText.includes('评分') || reviewText.includes('优点') || reviewText.includes('问题');
      const hasReviewThinkLeak = reviewText.includes('<think>') || reviewText.includes('</think>');
      results.push({ 
        test: 'Peer Review Response', 
        pass: hasReviewResponse && !hasReviewThinkLeak, 
        hasReviewResponse, 
        hasReviewThinkLeak 
      });
    } else {
      results.push({ test: 'Peer Review Response', pass: false, error: 'Review button not found' });
    }
  } else {
    results.push({ test: 'Peer Review Response', pass: false, error: 'Review textarea not found' });
  }
  
  // Test 7: Check PDF upload UI presence
  console.log('[TEST] Checking PDF upload UI...');
  results.push({ 
    test: 'PDF Upload UI - Peer Review', 
    pass: hasReviewPdfUpload 
  });
  
  return results;
}

module.exports = { testWorkshop, BASE_URL };
