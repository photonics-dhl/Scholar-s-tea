#!/bin/bash
pkill -f "hermes gateway run" 2>/dev/null
sleep 2
HERMES_HOME=/data/home/zju321/.hermes
PY_BIN=/data/home/zju321/miniconda3/envs/hermes/bin/hermes
export PYTHONPATH="/data/home/zju321/.hermes/hermes-agent:$PYTHONPATH"
export PATH="/data/home/zju321/miniconda3/envs/hermes/bin:$PATH"
if [ -f "$HERMES_HOME/.env" ]; then
    set -a
    source "$HERMES_HOME/.env"
    set +a
fi
nohup env http_proxy=http://127.0.0.1:7890 https_proxy=http://127.0.0.1:7890 "$PY_BIN" gateway run >> "$HERMES_HOME/logs/hermes_v3.log" 2>&1 &
sleep 5
pgrep -f "hermes gateway run" || echo "Failed to start"
