#!/bin/bash
# Start socket server (Fastify/Node)
cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 1
PROJECT_ROOT="$(pwd)"
NODE_BIN="${NODE_BIN:-$(command -v node 2>/dev/null || echo "/data/home/zju321/miniconda3/envs/ai_agent/bin/node")}"
exec "$NODE_BIN" --import tsx/dist/loader.mjs src/index.ts
