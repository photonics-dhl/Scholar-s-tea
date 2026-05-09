#!/bin/bash
cd "/data/home/zju321/321/DHL/Scholar's_Tea"
git add -A
git commit -m "avatar: V3 Kakao粗描边Q版风格" || true
export PATH=/data/home/zju321/miniconda3/envs/ai_agent/bin:/usr/bin:/bin
export LD_PRELOAD=/data/home/zju321/miniconda3/envs/ai_agent/lib/libstdc++.so.6.0.34
npx next build
pm2 restart scholars-tea
echo "DEPLOY_OK"
