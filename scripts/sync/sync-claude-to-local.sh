#!/bin/bash
# sync-claude-to-local.sh - Sync server .claude to local
# Usage: ./sync-claude-to-local.sh
# Note: Run this on the server or via SSH

# Actual path (symlinked to /e/PostGraduate/Science_softwares/Claude_CLI/.claude)
LOCAL_DIR="E:/PostGraduate/Science_softwares/Claude_CLI/.claude"
REMOTE_DIR="/data/home/zju321/.claude"
SSH_KEY="/data/home/zju321/.ssh/id_ed25519_scholars_tea"
SSH_USER="zju321"
SSH_HOST="10.72.212.33"

echo "=== Syncing Server .claude -> Local .claude ==="
echo "Local: $LOCAL_DIR"
echo "Remote: $REMOTE_DIR"
echo ""

unison "$REMOTE_DIR" "$LOCAL_DIR" \
  -sshargs "-i $SSH_KEY" \
  -auto \
  -batch \
  -prefer "$REMOTE_DIR" \
  -ignore "Path {*.log}" \
  -ignore "Path {*.tmp}" \
  -ignore "Path {*.swp}" \
  -ignore "Path {.DS_Store}" \
  -ignore "Path {Thumbs.db}" \
  -log \
  -logfile "/data/home/zju321/.claude/logs/unison-to-local.log"

echo ""
echo "=== Sync Complete ==="
