#!/bin/bash
PROJECT_DIR="/data/home/zju321/321/DHL/Scholar's_Tea"
cd "$PROJECT_DIR"

# Kill any existing next processes
pkill -f "next" 2>/dev/null || true
sleep 2

echo "=== Starting Next.js ==="
PORT=3000 nohup npm run start > /tmp/nextjs.log 2>&1 &
NEXT_PID=$!
echo "Started with PID: $NEXT_PID"
echo $NEXT_PID > /tmp/nextjs.pid

sleep 8

echo "=== Checking port ==="
netstat -tlnp 2>/dev/null | grep 3000

echo ""
echo "=== Testing curl ==="
curl -s http://localhost:3000

echo ""
echo "=== Log ==="
tail -30 /tmp/nextjs.log