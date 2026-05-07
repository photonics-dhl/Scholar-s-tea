#!/bin/bash
# Pre-commit security check hook
# Triggered by: PreToolUse with Bash(git commit:*) matcher
# Runs before git commit to check for credential exposure

echo "🔒 Running pre-commit security check..."

# Check for sensitive files that should not be committed
SENSITIVE_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    "settings.local.json"
    "credentials.json"
    "secrets.json"
    "*.key"
    "*.pem"
    "id_rsa"
    "id_ed25519"
    ".npmrc"
    "docker-compose.override.yml"
)

# Get the list of files being committed
COMMIT_FILES=$(git diff --cached --name-only 2>/dev/null)
STAGED_FILES=$(git diff --name-only --cached 2>/dev/null)
ALL_CHECK_FILES="${COMMIT_FILES:-$STAGED_FILES}"

if [ -z "$ALL_CHECK_FILES" ]; then
    echo "No staged files to check"
    exit 0
fi

CREDENTIAL_PATTERNS=(
    "sk-[a-zA-Z0-9]{20,}"
    "AIza[a-zA-Z0-9_-]{35,}"
    "ghp_[a-zA-Z0-9]{36,}"
    "glpat-[a-zA-Z0-9_-]{20,}"
    "tvly-dev-[a-zA-Z0-9_-]{30,}"
    "sk-cp-[a-zA-Z0-9_-]{40,}"
    "AKIA[A-Z0-9]{16}"
    "-----BEGIN.*PRIVATE KEY-----"
    "password\s*=\s*['\"][^'\"]{8,}"
)

BLOCKED=0

# Check each staged file
for file in $ALL_CHECK_FILES; do
    # Skip if file doesn't exist
    [ -f "$file" ] || continue

    # Check filename against sensitive patterns
    for sensitive in "${SENSITIVE_FILES[@]}"; do
        if [[ "$file" == $sensitive ]]; then
            echo "🚨 BLOCKED: Cannot commit sensitive file: $file"
            BLOCKED=1
        fi
    done

    # Check for credential patterns
    for pattern in "${CREDENTIAL_PATTERNS[@]}"; do
        if grep -rqE "$pattern" "$file" 2>/dev/null; then
            echo "🚨 BLOCKED: Credential pattern found in $file"
            echo "   Pattern: $pattern"
            BLOCKED=1
        fi
    done
done

# Check if settings.local.json is tracked by git
if git ls-files --error-unmatch settings.local.json 2>/dev/null; then
    echo "🚨 BLOCKED: settings.local.json is tracked by git!"
    echo "   Run: git rm --cached settings.local.json"
    BLOCKED=1
fi

if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "🚨 BLOCKED: .env is tracked by git!"
    echo "   Run: git rm --cached .env"
    BLOCKED=1
fi

if [ $BLOCKED -eq 1 ]; then
    echo ""
    echo "❌ Pre-commit security check FAILED"
    echo "   Fix the issues above before committing"
    exit 1
fi

echo "✅ Pre-commit security check PASSED"
exit 0
