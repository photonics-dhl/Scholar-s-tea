#!/bin/bash
# Pre-command hook for npm/lerna/yarn/pnpm commands

COMMAND="$1"
shift

# Check if it's an install command
if echo "$COMMAND" | grep -qE "(install|add|remove|rm|uninstall)"; then
    echo "📦 Package management detected - running security check..."

    # Check for potentially dangerous packages
    DANGEROUS_PATTERNS=("eval\(" "child_process" "require\s*\(\s*'fs'" "exec\s*\(")

    for pattern in "${DANGEROUS_PATTERNS[@]}"; do
        if grep -rqE "$pattern" package.json package-lock.json yarn.lock pnpm-lock.yaml 2>/dev/null; then
            echo "⚠️  Warning: Potentially dangerous pattern detected: $pattern"
        fi
    done
fi

# Check Node version
if [ -f ".nvmrc" ]; then
    REQUIRED_NODE=$(cat .nvmrc)
    CURRENT_NODE=$(node -v 2>/dev/null | tr -d 'v')
    if [ "$CURRENT_NODE" != "$REQUIRED_NODE" ]; then
        echo "⚠️  Node version mismatch. Required: v$REQUIRED_NODE, Current: v$CURRENT_NODE"
    fi
fi

echo "✅ Pre-command check passed"
exit 0
