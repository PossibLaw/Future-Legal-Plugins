#!/usr/bin/env bash
# PostToolUse hook for Write|Edit — auto-formats files if a formatter is detected.
# Exit 0 always (PostToolUse cannot block — tool already ran).

set -euo pipefail

# Read JSON from stdin and extract file_path
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null || true)

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
    echo '{"hookSpecificOutput":{"suppressOutput":true}}'
    exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

# Detect and run formatter
if [ -f "$PROJECT_DIR/package.json" ] && grep -q '"prettier"' "$PROJECT_DIR/package.json" 2>/dev/null; then
    npx prettier --write "$FILE_PATH" >/dev/null 2>&1 || true
elif [ -f "$PROJECT_DIR/.prettierrc" ]; then
    npx prettier --write "$FILE_PATH" >/dev/null 2>&1 || true
elif [ -f "$PROJECT_DIR/pyproject.toml" ] && grep -q '\[tool\.ruff\]' "$PROJECT_DIR/pyproject.toml" 2>/dev/null; then
    ruff format "$FILE_PATH" >/dev/null 2>&1 || true
elif [ -f "$PROJECT_DIR/pyproject.toml" ] && grep -q '\[tool\.black\]' "$PROJECT_DIR/pyproject.toml" 2>/dev/null; then
    black "$FILE_PATH" >/dev/null 2>&1 || true
fi

echo '{"hookSpecificOutput":{"suppressOutput":true}}'
exit 0
