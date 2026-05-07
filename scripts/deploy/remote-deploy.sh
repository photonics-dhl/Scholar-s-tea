#!/bin/bash
set -e
cd "/data/home/zju321/321/DHL/Scholar's_Tea"
echo "=== Pulling latest code ==="
git pull
echo "=== Building Next.js ==="
npm run build
echo "=== Restarting PM2 ==="
pm2 restart scholars-tea
echo "=== Done ==="
