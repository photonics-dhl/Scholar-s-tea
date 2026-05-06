#!/bin/bash
PROJECT_DIR="/data/home/zju321/321/DHL/Scholar's_Tea"

echo "=== App directory structure ==="
ls -la "$PROJECT_DIR/src/app/"

echo ""
echo "=== Root layout ==="
cat "$PROJECT_DIR/src/app/layout.tsx" | head -20

echo ""
echo "=== Root page ==="
cat "$PROJECT_DIR/src/app/page.tsx" | head -30