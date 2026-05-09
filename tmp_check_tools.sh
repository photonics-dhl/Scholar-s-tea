#!/bin/bash
node -e "try { require('puppeteer'); console.log('puppeteer ok') } catch(e) { console.log('no puppeteer') }" 2>/dev/null
python3 -c "import playwright; print('playwright ok')" 2>/dev/null || echo "no playwright python"
which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null || which firefox 2>/dev/null || echo "no browser binary"
