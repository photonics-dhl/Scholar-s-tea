#!/bin/bash
cd /data/home/zju321/321/DHL/Scholar\'s_Tea
echo "=== Stopping Next.js ==="
pkill -f "next" 2>/dev/null
sleep 2
echo "=== Building Next.js ==="
npm run build 2>&1 | tail -30
echo ""
echo "=== Starting Next.js ==="
node node_modules/.bin/next start -p 3002 > /data/home/zju321/logs/nextjs.log 2>&1 &
sleep 10
echo "=== Process ==="
ps aux | grep "next" | grep -v grep
echo ""
echo "=== AI Service Test ==="
curl -s -X POST http://localhost:3002/api/v1/chat  \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}' | head -200