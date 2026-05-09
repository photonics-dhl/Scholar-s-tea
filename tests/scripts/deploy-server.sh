#!/bin/bash
set -e

cd ~/321/DHL/Scholar\'s_Tea

echo "[deploy] Pulling latest..."
git pull github develop

echo "[deploy] Generating Prisma client..."
npx prisma generate

echo "[deploy] Building Next.js..."
npm run build

echo "[deploy] Restarting PM2..."
pm2 restart scholars-tea

echo "[deploy] Done!"
