import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, 'avatar-screenshots');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

// Screenshot the preview page
await page.goto('http://10.72.212.33:3002/hermes_preview.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);

// Full page screenshot
await page.screenshot({ path: join(outputDir, 'preview-full.png'), fullPage: true });
console.log('Full preview screenshot saved');

// Screenshot individual avatars from the workshop page
const moods = ['idle', 'happy', 'love', 'surprised', 'sleepy', 'thinking', 'angry', 'shy'];

for (const mood of moods) {
  try {
    await page.goto(`http://10.72.212.33:3002/workshop?test_mood=${mood}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(800);
    
    // Find the avatar SVG container
    const avatar = await page.locator('[data-avatar-mood], .hermes-avatar svg, svg[width="56"]').first();
    if (await avatar.count() > 0) {
      await avatar.screenshot({ path: join(outputDir, `avatar-${mood}.png`) });
      console.log(`Screenshot: avatar-${mood}.png`);
    }
  } catch (e) {
    console.log(`Failed ${mood}: ${e.message}`);
  }
}

await browser.close();
console.log('Done');
