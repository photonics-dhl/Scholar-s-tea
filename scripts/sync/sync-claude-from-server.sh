#!/bin/bash
# sync-claude-from-server.sh - Run on SERVER to sync server .claude back to local
# Usage: Run this on the server (zju321@10.72.212.33)
#
# Requires:
# - SSH key access from server to local (configure reverse tunnel if needed)
# - Local unison profile: C:/Users/Mac/.unison/claude.prf
#
# Note: This script runs on SERVER and SSH back to LOCAL machine

set -e

# Find unison: prefer env var, then try which, fallback to default
UNISON="${UNISON:-$(command -v unison 2>/dev/null || echo "/data/home/zju321/softwares/unison-2.53.8-ubuntu-22.04-x86_64-static/bin/unison")}"

# Local machine SSH info (from server's perspective)
# Note: The local machine is behind NAT, so we need to use the SSH reverse tunnel
# Or use the local SSH server if exposed

echo "=== Syncing Server .claude -> Local .claude ==="
echo "This script should be run ON the server"
echo ""

# Since local machine (DESKTOP-160J18K) is behind NAT,
# we can't directly SSH from server to local.
# Instead, use the existing profile which connects from local to server.

echo "To sync from server to local, run on LOCAL machine:"
echo "  D:\\Softwares_new\\unison-2.53.8-windows-x86_64\\bin\\unison.exe claude"
echo ""
echo "Or use the batch sync script from the project:"
echo "  z:\\321\\DHL\\Scholar's_Tea\\scripts\\sync\\sync-claude.bat bidirectional"
