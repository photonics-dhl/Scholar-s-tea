#!/bin/bash
cd ~/scholars
PDF=tests/test-math-pdf.pdf
OUT=tests/marker-test-result.json
LOG=tests/marker-test.log

echo "=== Marker E2E Test Started: $(date) ===" > $LOG

# Create a simple test payload with simulated corrupted formula text
curl -s -X POST http://localhost:3002/api/v1/knowledge/extract-pdf   -F "file=@$PDF"   -F 'originalText=Page 3: EE = UU (yy, zz) · ee ii (ωω0 ∂∂ −ββββ) (4)'   -F 'badPages=[3]'   -F 'pageCount=15'   --max-time 2400   -o $OUT 2>> $LOG

HTTP_CODE=$(cat $OUT | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("success","unknown"))' 2>/dev/null || echo "parse_error")
echo "=== Test Completed: $(date) ===" >> $LOG
echo "Result: $HTTP_CODE" >> $LOG
echo "Output saved to $OUT" >> $LOG
