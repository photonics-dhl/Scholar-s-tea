#!/bin/bash
cd /data/home/zju321/321/DHL/Scholar\'s_Tea
pkill -f "next" 2>/dev/null
sleep 2
npx prisma generate
node node_modules/.bin/next start -p 3002 > /data/home/zju321/logs/nextjs.log 2>&1 &
echo "Prisma generated and Next.js started on port 3002"