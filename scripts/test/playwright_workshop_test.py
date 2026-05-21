#!/usr/bin/env python3
"""
Playwright Workshop E2E Test - 验证 AI 回复是否正常
"""

import asyncio
from playwright.async_api import async_playwright

BASE_URL = "http://10.72.212.33:3002"

async def test_workshop():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        # 捕获控制台日志
        logs = []
        page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}"))

        # 捕获网络请求
        async def handle_response(response):
            url = response.url
            if "/api/v1/ai/chat" in url or "/api/v1/hermes/" in url:
                status = response.status
                print(f"NETWORK: {response.request.method} {url} => {status}")
                if not response.ok:
                    try:
                        text = await response.text()
                        print(f"  ERROR BODY: {text[:500]}")
                    except:
                        pass

        page.on("response", lambda r: asyncio.create_task(handle_response(r)))

        try:
            print(f"Navigating to {BASE_URL}/workshop ...")
            await page.goto(f"{BASE_URL}/workshop", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            # 截图初始状态
            await page.screenshot(path="workshop_initial.png")
            print("Screenshot: workshop_initial.png")

            # 查找输入框
            input_selector = 'textarea, [contenteditable="true"], input[type="text"]'
            input_elem = await page.query_selector(input_selector)
            if not input_elem:
                # 尝试更宽的选择器
                input_elem = await page.query_selector('div[class*="input"], div[class*="chat"] textarea')

            if not input_elem:
                print("No input found! Dumping page text...")
                text = await page.evaluate("() => document.body.innerText")
                print(text[:2000])
                await browser.close()
                return

            print("Typing message...")
            await input_elem.fill("Say exactly OK and nothing else.")
            await page.wait_for_timeout(500)

            # 查找发送按钮（通常是最后一个按钮或包含发送图标的按钮）
            send_btn = await page.query_selector('button[type="submit"]')
            if not send_btn:
                # 尝试查找包含箭头或纸飞机图标的按钮
                buttons = await page.query_selector_all("button")
                for btn in buttons:
                    text = await btn.inner_text()
                    if text and ("发送" in text or "Send" in text):
                        send_btn = btn
                        break

            if send_btn:
                print("Clicking send button...")
                await send_btn.click()
            else:
                print("Pressing Enter...")
                await input_elem.press("Enter")

            # 等待 AI 响应（最多 45 秒）
            print("Waiting for AI response...")
            await page.wait_for_timeout(30000)

            # 截图响应后状态
            await page.screenshot(path="workshop_response.png")
            print("Screenshot: workshop_response.png")

            # 检查结果
            page_text = await page.evaluate("() => document.body.innerText")
            has_ok = '"OK"' in page_text or "OK" in page_text.split("Say exactly")[-1][:500]
            has_error = "503" in page_text or "服务暂时不可用" in page_text or "error" in page_text.lower()
            has_loading = "生成中" in page_text or "加载中" in page_text or "thinking" in page_text.lower()

            print("\n=== RESULTS ===")
            print(f"Has OK response: {has_ok}")
            print(f"Has error: {has_error}")
            print(f"Still loading: {has_loading}")
            print(f"Page text length: {len(page_text)}")

            # 打印最后 20 条日志
            print("\n=== PAGE LOGS ===")
            for log in logs[-20:]:
                print(log)

            if has_ok:
                print("\n🟢 WORKSHOP RESPONDS CORRECTLY")
            elif has_error:
                print("\n🔴 WORKSHOP HAS ERRORS")
            elif has_loading:
                print("\n🟡 WORKSHOP STILL LOADING")
            else:
                print("\n🟡 NO CLEAR RESPONSE (might be empty)")
                # 打印页面内容片段
                print("Page content snippet:")
                print(page_text[:1500])

        except Exception as e:
            print(f"Test error: {e}")
            await page.screenshot(path="workshop_error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_workshop())
