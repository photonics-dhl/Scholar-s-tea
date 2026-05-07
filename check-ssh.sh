#!/bin/bash
echo "=== SSH keys ==="
ls -la ~/.ssh/
echo "=== SSH agent ==="
ssh-add -l 2>/dev/null || echo "No ssh-agent"
echo "=== SSH test ==="
ssh -o ConnectTimeout=5 -T git@github.com 2>&1 || echo "SSH test failed"
echo "=== Git pull ==="
cd ~/321/DHL/Scholar\'s_Tea
git pull github develop 2>&1 || echo "Git pull failed"
