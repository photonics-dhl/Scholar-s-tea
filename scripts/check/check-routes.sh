#!/bin/bash
PROJECT_DIR="/data/home/zju321/321/DHL/Scholar's_Tea"

echo "=== (main) route group ==="
ls -la "$PROJECT_DIR/src/app/(main)/"

echo ""
echo "=== groups page ==="
ls -la "$PROJECT_DIR/src/app/(main)/groups/"

echo ""
echo "=== Page file exists? ==="
test -f "$PROJECT_DIR/src/app/(main)/groups/page.tsx" && echo "EXISTS" || echo "NOT FOUND"