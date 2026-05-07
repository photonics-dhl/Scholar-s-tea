#!/bin/bash
PROJECT_DIR="/data/home/zju321/321/DHL/Scholar's_Tea"

echo "=== Build Process ==="
ps aux | grep 'next build' | grep -v grep || echo 'No build process running'

echo ""
echo "=== Build Log (last 30 lines) ==="
if [ -f /data/home/zju321/logs/build.log ]; then
    tail -30 /data/home/zju321/logs/build.log
else
    echo "No build log yet"
fi

echo ""
echo "=== Build Artifacts ==="
ls -la "$PROJECT_DIR/.next/BUILD_ID" 2>/dev/null || echo 'No BUILD_ID yet'
