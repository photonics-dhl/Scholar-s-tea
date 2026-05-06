#!/usr/bin/env python3
"""Minimal ASCII card test"""
import os, json, requests
os.environ['http_proxy'] = 'http://127.0.0.1:7890'
os.environ['https_proxy'] = 'http://127.0.0.1:7890'

FEISHU_APP_ID = os.environ['FEISHU_APP_ID']
FEISHU_APP_SECRET = os.environ['FEISHU_APP_SECRET']
CHAT_ID = 'oc_4c05763dd5c2edc78a09eee8b452c2a8'

r = requests.post(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    json={'app_id': FEISHU_APP_ID, 'app_secret': FEISHU_APP_SECRET},
    timeout=15
)
feishu_token = r.json()['tenant_access_token']
print(f"Token OK")

# Build a minimal ASCII-only card
card = {
    "config": {"wide_screen_mode": True},
    "header": {
        "title": {"tag": "plain_text", "content": "Evening Self-Check 2026-05-06"},
        "template": "indigo"
    },
    "elements": [
        {"tag": "text", "text": "[OK] All systems operational"},
        {"tag": "hr"},
        {"tag": "markdown", "text": "**Network Status**\n- Tavily Key2/3: 200 OK\n- Claude Code CLI: Running\n- MiniMax Image: Token env var missing\n- Feishu: Token OK\n- ngrok: colony-party-unpledged.ngrok-free.app"},
        {"tag": "hr"},
        {"tag": "markdown", "text": "**Today Summary**\n- ArXiv direct strategy in effect (200 OK, 2.7s)\n- Tavily Key2/3 both HTTP 200\n- Card data: 8/9 domains updated today\n- photonic_integration stale (04-19)"},
        {"tag": "hr"},
        {"tag": "markdown", "text": "**Tomorrow**\n1. Fix MiniMax token in cron env\n2. Rebuild photonic_integration domain\n3. Monitor ArXiv stability"},
    ]
}

payload = {
    "receive_id": CHAT_ID,
    "msg_type": "interactive",
    "content": json.dumps(card, ensure_ascii=False)
}

url = 'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id'
headers = {"Authorization": f"Bearer {feishu_token}"}
r = requests.post(url, json=payload, headers=headers, timeout=30)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:400]}")