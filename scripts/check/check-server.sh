#!/bin/bash
PROJECT_DIR="/data/home/zju321/321/DHL/Scholar's_Tea"

echo "=== .next directory ==="
ls -la "$PROJECT_DIR/.next/" | head -15

echo ""
echo "=== Checking PORT in .env ==="
grep -E "PORT|NEXTAUTH|APP_URL" "$PROJECT_DIR/.env" | head -5

echo ""
echo "=== Trying localhost:3000 ==="
curl -s http://localhost:3000 2>&1 | head -20