#!/bin/bash
# Post-write hook for Write/Edit operations
# Security: credential scanning + file validation

FILE_PATH="$1"
shift

# --- Critical file checks (must never commit) ---
CRITICAL_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    "settings.local.json"
    "credentials.json"
    "secrets.json"
    "*.key"
    "id_rsa"
    "id_ed25519"
    ".npmrc"
)

if [ -f "$FILE_PATH" ]; then
    FILENAME=$(basename "$FILE_PATH")

    # Check if critical file is being written
    for critical in "${CRITICAL_FILES[@]}"; do
        if [[ "$FILENAME" == $critical ]]; then
            echo "🚨 CRITICAL: $FILENAME should NOT be committed to git!"
            echo "   Move secrets to .env files and add to .gitignore"
        fi
    done

    # --- Credential scanning (security) ---
    CREDENTIAL_PATTERNS=(
        "sk-[a-zA-Z0-9]{20,}"                      # API keys (OpenAI, Anthropic, etc.)
        "AIza[a-zA-Z0-9_-]{35,}"                   # Google API keys
        "ghp_[a-zA-Z0-9]{36,}"                     # GitHub tokens
        "glpat-[a-zA-Z0-9_-]{20,}"                 # GitLab tokens
        "xox[baprs]-[a-zA-Z0-9]{10,}"             # Slack tokens
        "sq0[a-z]{3}-[a-zA-Z0-9_-]{22}"           # Square tokens
        "SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}" # SendGrid
        "tvly-dev-[a-zA-Z0-9_-]{30,}"            # Tavily API keys
        "sk-cp-[a-zA-Z0-9_-]{40,}"               # MiniMax API keys
        "AKIA[A-Z0-9]{16}"                        # AWS Access Key IDs
        "-----BEGIN.*PRIVATE KEY-----"            # SSH private keys
        "password\s*=\s*['\"][^'\"]{8,}"         # Hardcoded passwords
        "api[_-]?key\s*[=:]\s*['\"][^'\"]{16,}"  # Generic api_key patterns
        "secret\s*[=:]\s*['\"][^'\"]{16,}"        # Generic secret patterns
        "bearer\s+[a-zA-Z0-9_-]{20,}"             # Bearer tokens
    )

    for pattern in "${CREDENTIAL_PATTERNS[@]}"; do
        if grep -rqE "$pattern" "$FILE_PATH" 2>/dev/null; then
            echo "⚠️  WARNING: Potential credential detected in $FILE_PATH"
            echo "   Pattern: $pattern"
            echo "   → Move secrets to .env or environment variables"
            echo "   → Add credentials to .gitignore"
        fi
    done
fi

# --- File extension checks ---
EXT="${FILE_PATH##*.}"

case "$EXT" in
    "ts"|"tsx")
        # TypeScript validation
        if command -v npx &> /dev/null; then
            # Quick syntax check without full type checking
            npx tsc --noEmit --skipLibCheck "$FILE_PATH" 2>/dev/null &
        fi
        ;;
    "md")
        # Check for TODO/FIXME without implementation
        if grep -rqE "TODO|FIXME|XXX|HACK" "$FILE_PATH" 2>/dev/null; then
            echo "📝 Note: $FILE_PATH contains TODO/FIXME comments"
        fi
        ;;
    "json")
        if command -v node &> /dev/null; then
            node -e "JSON.parse(require('fs').readFileSync('$FILE_PATH', 'utf8'))" 2>/dev/null && echo "✅ JSON valid: $FILE_PATH" || echo "❌ JSON invalid: $FILE_PATH"
        fi
        ;;
    "sh")
        # Shell script syntax check
        if command -v bash &> /dev/null; then
            bash -n "$FILE_PATH" 2>/dev/null && echo "✅ Bash syntax OK: $FILE_PATH" || echo "❌ Bash syntax error: $FILE_PATH"
        fi
        ;;
    *)
        ;;
esac

exit 0
