#!/bin/bash
echo "=== Next.js Process ==="
ps aux | grep next | grep -v grep
echo ""
echo "=== DATABASE_URL ==="
grep DATABASE_URL /data/home/zju321/321/DHL/Scholar\'s_Tea/.env 2>&1
echo ""
echo "=== Restarting Next.js ==="
pkill -f "next" 2>/dev/null
sleep 3
cd /data/home/zju321/321/DHL/Scholar\'s_Tea
nohup node node_modules/.bin/next start -p 3002 > /data/home/zju321/logs/nextjs.log 2>&1 &
sleep 5
ps aux | grep next | grep -v grep
echo ""
echo "=== Testing API ==="
sleep 2
curl -s http://localhost:3002/api/v1/disciplines | head -200