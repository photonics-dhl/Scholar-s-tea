#!/usr/bin/env python3
"""晚间自检飞书卡片发送"""
import os
import json
import requests

os.environ['http_proxy'] = 'http://127.0.0.1:7890'
os.environ['https_proxy'] = 'http://127.0.0.1:7890'

FEISHU_APP_ID = os.environ['FEISHU_APP_ID']
FEISHU_APP_SECRET = os.environ['FEISHU_APP_SECRET']
CHAT_ID = 'oc_4c05763dd5c2edc78a09eee8b452c2a8'

# 获取 token
r = requests.post(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    json={'app_id': FEISHU_APP_ID, 'app_secret': FEISHU_APP_SECRET},
    timeout=15
)
feishu_token = r.json()['tenant_access_token']
print(f"Token: {feishu_token[:20]}...")

# 强制重新获取 token
r = requests.post(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    json={'app_id': FEISHU_APP_ID, 'app_secret': FEISHU_APP_SECRET},
    proxies={"http": "http://127.0.0.1:7890", "https": "http://127.0.0.1:7890"},
    timeout=15
)
feishu_token = r.json()['tenant_access_token']
print(f"Token (refreshed): {feishu_token[:20]}...")

# 逐步测试：先发最简单的纯 text 元素卡片
elements = [
    {"tag": "text", "text": " Evening Self-Check Report 2026-05-06 "},
    {"tag": "hr"},
    {"tag": "text", "text": "Network Status:"},
    {"tag": "text", "text": "Tavily Key2/3: OK"},
    {"tag": "text", "text": "Claude Code CLI: Running PID 28477"},
    {"tag": "text", "text": "MiniMax Image: Token missing"},
    {"tag": "text", "text": "Feishu: Token OK"},
    {"tag": "hr"},
    {"tag": "text", "text": "Summary:"},
    {"tag": "text", "text": "All systems operational"},
]

card = {
    "config": {"wide_screen_mode": True},
    "header": {"title": {"tag": "plain_text", "content": "Evening Self-Check 2026-05-06"}, "template": "indigo"},
    "elements": elements
}

payload = {
    "receive_id": CHAT_ID,
    "msg_type": "interactive",
    "content": json.dumps(card, ensure_ascii=False)
}

url = 'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id'
headers = {"Authorization": f"Bearer {feishu_token}"}
r = requests.post(url, data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
                  headers=headers, timeout=30)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:500]}")