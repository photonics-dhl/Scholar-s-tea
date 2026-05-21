#!/usr/bin/env python3
"""测试 ZAI API 连通性和模型名"""
import os, sys, time, requests

# 加载 .env
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, ".env")
    load_dotenv(env_path, override=False)
except ImportError:
    pass

key = os.environ.get("ZAI_API_KEY", "")
print(f"ZAI_API_KEY: {key[:8]}...{key[-6:]} (len={len(key)})")

base = "https://api.z.ai/api/paas/v4/chat/completions"
models = ["glm-4.7-flash", "GLM-4.7-Flash", "glm-4.7-Flash", "glm-4-flash", "GLM-4-Flash"]

for m in models:
    time.sleep(4)
    try:
        r = requests.post(
            base,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"model": m, "messages": [{"role": "user", "content": "say hi in 5 words"}], "max_tokens": 30},
            timeout=30,
            proxies={}
        )
        status = r.status_code
        body = r.text[:300]
        print(f"\n=== {m} ===")
        print(f"HTTP {status}")
        if status == 200:
            data = r.json()
            msg = data.get("choices", [{}])[0].get("message", {})
            print(f"content: {msg.get('content', '')[:100]}")
            print(f"reasoning_content: {str(msg.get('reasoning_content', ''))[:100]}")
        else:
            print(f"error: {body}")
    except Exception as e:
        print(f"\n=== {m} ===")
        print(f"ERROR: {e}")
