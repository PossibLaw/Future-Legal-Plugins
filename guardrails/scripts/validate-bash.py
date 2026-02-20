#!/usr/bin/env python3
"""PreToolUse hook for Bash — blocks destructive commands, escalates risky ones."""

import json
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blacklist import BLOCKED_PATTERNS, ESCALATE_PATTERNS


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    command = data.get("tool_input", {}).get("command", "")
    if not command:
        sys.exit(0)

    # Check blocked patterns first
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, command):
            print(
                f"BLOCKED: Command matches destructive pattern '{pattern}'. "
                f"Use a safer alternative.",
                file=sys.stderr,
            )
            sys.exit(2)

    # Check escalation patterns
    for pattern in ESCALATE_PATTERNS:
        if re.search(pattern, command):
            result = {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "ask",
                    "permissionDecisionReason": (
                        f"This command may have unintended consequences "
                        f"(matched pattern '{pattern}'). Confirm before proceeding."
                    ),
                }
            }
            print(json.dumps(result))
            sys.exit(0)

    # Safe command — approve
    sys.exit(0)


if __name__ == "__main__":
    main()
