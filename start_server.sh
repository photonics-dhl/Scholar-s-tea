#!/bin/bash
PROJECT_DIR="/data/home/zju321/321/DHL/Scholar's_Tea"
LOG_FILE="/data/home/zju321/logs/nextjs.log"

echo "=== Stopping existing ==="
pkill -f "next start" 2>/dev/null || true
sleep 2

echo "=== Starting Next.js on 3002 ==="
mkdir -p /data/home/zju321/logs
cd "$PROJECT_DIR"
nohup node node_modules/.bin/next start -p 3002 > "$LOG_FILE" 2>&1 &
sleep 10

echo "=== Process ==="
ps aux | grep "next start" | grep -v grep || echo "No process"

echo ""
echo "=== Port ==="
netstat -tlnp 2>/dev/null | grep 3002 || lsof -i :3002 2>/dev/null || echo "Not listening"

echo ""
echo "=== API Test ==="
curl -s --max-time 5 http://localhost:3002/api/v1/disciplines | head -c 200 || echo "API failed"
