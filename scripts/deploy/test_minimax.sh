#!/bin/bash
cd ~/321/DHL/Scholar's_Tea

# Write correct JSON request body
cat > /tmp/minimax_req.json << 'EOF'
{"model":"MiniMax-M2.7","messages":[{"role":"user","content":"hi"}],"stream":false,"max_tokens":2048,"temperature":0.7}
EOF

echo "=== REQUEST BODY ==="
cat /tmp/minimax_req.json
echo

echo "=== API RESPONSE ==="
curl -s -w '\nHTTP_CODE:%{http_code}' -X POST https://api.minimax.chat/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-cp-qE86-XcYk4b079O0NoNQKwcJ5wvaMlRrXE8ew1y6ovXxuMCuZ0tEv7JjoLck2Ub7VXJKmUZtR5O39Coct_dDYytXGul8BuWoty_dyzvmTnGQQsx8VCTkNBU' \
  -d @/tmp/minimax_req.json

echo
