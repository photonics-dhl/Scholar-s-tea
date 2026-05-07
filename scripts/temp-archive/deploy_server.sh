#!/bin/bash
set -e
cd "/data/home/zju321/321/DHL/Scholar's_Tea"

echo "=== Checking node_modules ==="
ls node_modules/.bin/next 2>/dev/null || echo "next not found in node_modules/.bin"
ls node_modules/next/package.json 2>/dev/null || echo "next package not installed"

echo ""
echo "=== NPM Install ==="
npm install

echo ""
echo "=== NPM Build ==="
npm run build

echo ""
echo "=== Starting Next.js on port 3002 ==="
pkill -f "next start" 2>/dev/null || true
sleep 2
nohup node node_modules/.bin/next start -p 3002 > /data/home/zju321/logs/nextjs.log 2>&1 &
sleep 5

echo ""
echo "=== Process Check ==="
ps aux | grep "next start" | grep -v grep || echo "No next process found"

echo ""
echo "=== Port Check ==="
netstat -tlnp 2>/dev/null | grep 3002 || lsof -i :3002 2>/dev/null || echo "Port 3002 not listening"

echo ""
echo "=== API Test ==="
curl -s http://localhost:3002/api/v1/disciplines | head -c 200
