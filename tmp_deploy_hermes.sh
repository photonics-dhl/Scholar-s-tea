#!/bin/bash
cd "/data/home/zju321/321/DHL/Scholar's_Tea"
export PATH="/data/home/zju321/miniconda3/envs/ai_agent/bin:$PATH"
export LD_PRELOAD="/data/home/zju321/miniconda3/envs/ai_agent/lib/libstdc++.so.6.0.34"

npm run build 2>&1 | tail -n 30
