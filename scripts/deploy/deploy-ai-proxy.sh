#!/bin/bash
cd /data/home/zju321/321/DHL/Scholar\'s_Tea
echo "=== Stopping Next.js ==="
pkill -f "next" 2>/dev/null
sleep 2

echo "=== Building ==="
npm run build 2>&1 | tail -20

echo ""
echo "=== Starting with Proxy ==="
# Node.js fetch 不使用系统代理，使用 global-agent 库来支持 HTTP_PROXY
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890

node node_modules/.bin/next start -p 3002 > /data/home/zju321/logs/nextjs.log 2>&1 &
sleep 10
ps aux | grep next | grep -v grep

echo ""
echo "=== Testing AI API ==="
curl -s -X POST http://localhost:3002/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}' | head -200