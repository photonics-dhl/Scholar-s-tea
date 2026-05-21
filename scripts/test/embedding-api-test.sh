#!/bin/bash
cd "$(dirname "$0")/../.."

# Load env
export ZCHAT_API_KEY=$(grep ZCHAT_API_KEY .env | cut -d= -f2 | tr -d "'\"" )
export ZCHAT_BASE_URL=$(grep ZCHAT_BASE_URL .env | cut -d= -f2 | tr -d "'\"" )

echo "=== ZCHAT Embedding API Test ==="
echo "URL: $ZCHAT_BASE_URL"
echo "Key: ${ZCHAT_API_KEY:0:12}..."

# Test 1: Via proxy (default)
echo -e "\n--- Test 1: With proxy (env default) ---"
curl -s -o /tmp/proxy_test.json -w "HTTP %{http_code}, time: %{time_total}s\n" \
  -X POST "$ZCHAT_BASE_URL/embeddings" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ZCHAT_API_KEY" \
  -d '{"model":"text-embedding-3-small","input":"quantum computing"}' 2>/dev/null
cat /tmp/proxy_test.json | head -c 300
echo

# Test 2: Without proxy
echo -e "\n--- Test 2: Without proxy ---"
unset http_proxy https_proxy all_proxy ALL_PROXY HTTP_PROXY HTTPS_PROXY
curl -s -o /tmp/direct_test.json -w "HTTP %{http_code}, time: %{time_total}s\n" \
  -X POST "$ZCHAT_BASE_URL/embeddings" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ZCHAT_API_KEY" \
  -d '{"model":"text-embedding-3-small","input":"quantum computing"}' 2>/dev/null
cat /tmp/direct_test.json | head -c 300
echo

echo -e "\n=== Test Complete ==="
