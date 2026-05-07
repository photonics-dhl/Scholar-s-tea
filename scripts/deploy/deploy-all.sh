#!/bin/bash
set -e

cd /data/home/zju321/321/DHL/Scholar's_Tea

echo "=== Prisma DB Push ==="
npx prisma db push --accept-data-loss

echo "=== Prisma Generate ==="
npx prisma generate

echo "=== Build Socket Server ==="
cd server
npm run build
cd ..

echo "=== Build Next.js ==="
npm run build

echo "=== Restart Services ==="
# Kill existing Next.js process on port 3002
kill $(lsof -t -i:3002) 2>/dev/null || true
# Kill existing socket server on port 3001
kill $(lsof -t -i:3001) 2>/dev/null || true

sleep 2

# Start Next.js
nohup npm start -- -p 3002 > ~/logs/nextjs.log 2>&1 &

# Start Socket Server
nohup node server/dist/index.js > ~/logs/socket.log 2>&1 &

echo "=== Deploy Complete ==="
echo "Next.js running on port 3002"
echo "Socket server running on port 3001"
