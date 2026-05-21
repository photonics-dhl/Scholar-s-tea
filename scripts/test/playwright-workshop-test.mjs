#!/usr/bin/env node
import { chromium } from 'playwright'

const APP_URL = 'http://10.72.212.33:3002/workshop'

async function testWorkshop() {
  console.log('Launching browser...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  // Capture console logs
  const logs = []
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`
    logs.push(text)
    if (msg.type() === 'error' || msg.text().includes('503')) {
      console.log('PAGE LOG:', text)
    }
  })

  // Capture network errors
  page.on('response', async response => {
    const url = response.url()
    if (url.includes('/api/v1/ai/chat') || url.includes('/api/v1/hermes/')) {
      const status = response.status()
      console.log(`NETWORK: ${response.request().method()} ${url} => ${status}`)
      if (!response.ok()) {
        const text = await response.text().catch(() => '')
        console.log(`  ERROR BODY: ${text.slice(0, 500)}`)
      }
    }
  })

  try {
    console.log(`Navigating to ${APP_URL}...`)
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Take screenshot of initial state
    await page.screenshot({ path: 'z:/321/DHL/Scholar\'s_Tea/scripts/test/workshop-initial.png' })
    console.log('Screenshot saved: workshop-initial.png')

    // Find input and send a message
    const input = await page.locator('textarea, [contenteditable], input[type="text"]').first()
    if (!input) {
      console.log('No input found!')
      await browser.close()
      return
    }

    console.log('Typing message...')
    await input.fill('Say exactly "OK" and nothing else.')
    await page.waitForTimeout(500)

    // Find send button
    const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), button:has-svg').first()
    if (sendButton) {
      console.log('Clicking send button...')
      await sendButton.click()
    } else {
      // Try pressing Enter
      await input.press('Enter')
    }

    // Wait for response
    console.log('Waiting for AI response...')
    await page.waitForTimeout(15000)

    // Take screenshot after response
    await page.screenshot({ path: 'z:/321/DHL/Scholar\'s_Tea/scripts/test/workshop-after-response.png' })
    console.log('Screenshot saved: workshop-after-response.png')

    // Check for response content
    const pageText = await page.content()
    const hasOK = pageText.includes('OK') && !pageText.includes('Say exactly')
    const hasError = pageText.includes('503') || pageText.includes('服务暂时不可用') || pageText.includes('error')

    console.log('\n=== RESULTS ===')
    console.log('Has OK response:', hasOK)
    console.log('Has error indicator:', hasError)

    // Print last 20 logs
    console.log('\n=== PAGE LOGS ===')
    logs.slice(-20).forEach(l => console.log(l))

  } catch (err) {
    console.error('Test error:', err.message)
    await page.screenshot({ path: 'z:/321/DHL/Scholar\'s_Tea/scripts/test/workshop-error.png' })
  } finally {
    await browser.close()
  }
}

testWorkshop().catch(console.error)
