#!/bin/bash
# sync-claude-to-server.sh - Sync local .claude to server
# Usage: ./sync-claude-to-server.sh

set -e

# Actual path (symlinked to /e/PostGraduate/Science_softwares/Claude_CLI/.claude)
LOCAL_DIR="E:/PostGraduate/Science_softwares/Claude_CLI/.claude"
REMOTE_DIR="/data/home/zju321/.claude"
SSH_KEY="C:/Users/Mac/.ssh/id_ed25519_scholars_tea"
SSH_USER="zju321"
SSH_HOST="10.72.212.33"

UNISON_LOCAL="D:/Softwares_new/unison-2.53.8-windows-x86_64/bin/unison.exe"

echo "=== Syncing Local .claude -> Server .claude ==="
echo "Local: $LOCAL_DIR"
echo "Remote: $REMOTE_DIR"
echo ""

"$UNISON_LOCAL" "$LOCAL_DIR" "ssh://${SSH_USER}@${SSH_HOST}${REMOTE_DIR}" \
  -sshargs "-i $SSH_KEY" \
  -auto \
  -batch \
  -prefer "$LOCAL_DIR" \
  -ignore "Path {*.log}" \
  -ignore "Path {*.tmp}" \
  -ignore "Path {*.swp}" \
  -ignore "Path {.DS_Store}" \
  -ignore "Path {Thumbs.db}" \
  -log \
  -logfile "z:/321/DHL/Scholar's_Tea/logs/unison-to-server.log"

echo ""
echo "=== Sync Complete ==="
