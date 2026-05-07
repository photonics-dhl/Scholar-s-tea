#!/bin/bash
# Session end hook - session summary, cleanup, and memory reminder

SESSION_DIR=".claude/sessions"
mkdir -p "$SESSION_DIR"
CURRENT_DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# Create session summary
echo "📋 Session Summary - $(date)" > "$SESSION_DIR/session_$CURRENT_DATE.md"
echo "" >> "$SESSION_DIR/session_$CURRENT_DATE.md"
echo "Files modified:" >> "$SESSION_DIR/session_$CURRENT_DATE.md"
git diff --name-only 2>/dev/null >> "$SESSION_DIR/session_$CURRENT_DATE.md" || echo "Not a git repository" >> "$SESSION_DIR/session_$CURRENT_DATE.md"
echo "" >> "$SESSION_DIR/session_$CURRENT_DATE.md"
echo "Untracked files:" >> "$SESSION_DIR/session_$CURRENT_DATE.md"
git ls-files --others --exclude-standard 2>/dev/null >> "$SESSION_DIR/session_$CURRENT_DATE.md" || echo "Not a git repository" >> "$SESSION_DIR/session_$CURRENT_DATE.md"

# Cleanup old sessions (keep last 10)
if [ -d "$SESSION_DIR" ]; then
    cd "$SESSION_DIR" || exit 1
    ls -t session_*.md 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    cd - > /dev/null
fi

echo "✅ Session summary saved to $SESSION_DIR/session_$CURRENT_DATE.md"

# === Memory Reminder ===
echo ""
echo "🧠 【记忆写入提醒】会话结束前检查："
echo "   本次学到了什么新知识？需要写入哪个层级？"
echo ""
echo "   写入规则："
echo "   · 工具Bug/workaround  → memory"
echo "   · 环境路径/凭证/端口  → memory"
echo "   · 跨项目SOP流程      → ~/.claude/skills/"
echo "   · 项目特定坑/事实    → CLAUDE.md"
echo "   · 已完成任务/临时状态 → 不存储"
echo ""

# Check for uncommitted changes that might need memory
if git status --porcelain 2>/dev/null | grep -q "."; then
    echo "📝 检测到未提交更改！请确认："
    echo "   · 是否有需要记忆的错误修复经验？"
    echo "   · 是否有新的坑需要记录到 CLAUDE.md？"
fi

exit 0
