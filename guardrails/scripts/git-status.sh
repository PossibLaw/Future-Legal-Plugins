#!/usr/bin/env bash
# SessionStart hook — provides git context at session start.
# Outputs JSON with additionalContext so Claude has repo awareness from the start.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

if [ ! -d "$PROJECT_DIR/.git" ]; then
    # Not a git repo — nothing to report
    exit 0
fi

cd "$PROJECT_DIR"

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
STATUS=$(git status --short 2>/dev/null | head -20 || echo "")
LOG=$(git log --oneline -5 2>/dev/null || echo "")
STASH_COUNT=$(git stash list 2>/dev/null | wc -l | tr -d ' ')

CONTEXT="Git context at session start:
Branch: $BRANCH
Stash count: $STASH_COUNT

Recent commits:
$LOG"

if [ -n "$STATUS" ]; then
    CONTEXT="$CONTEXT

Working tree changes:
$STATUS"
fi

# Escape for JSON
CONTEXT_ESCAPED=$(echo "$CONTEXT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")

cat <<EOF
{
  "hookSpecificOutput": {
    "additionalContext": $CONTEXT_ESCAPED
  }
}
EOF

exit 0
