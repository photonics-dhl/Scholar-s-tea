#!/bin/bash
pkill -f "server/dist/index.js" 2>/dev/null
sleep 1
mkdir -p /home/zju321/logs
cd "/data/home/zju321/321/DHL/Scholar's_Tea"
setsid node server/dist/index.js > /home/zju321/logs/socket.log 2>&1 &
sleep 3
ps aux | grep -E "node.*server/dist" | grep -v grep
cat /home/zju321/logs/socket.log
