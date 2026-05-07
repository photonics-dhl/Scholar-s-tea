#!/bin/bash
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
exec ./node_modules/.bin/tsx src/index.ts
