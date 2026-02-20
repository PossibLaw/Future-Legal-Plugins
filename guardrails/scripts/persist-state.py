#!/usr/bin/env python3
"""PreCompact hook — persists session state before context compression."""

import json
import os
import sys
from datetime import datetime, timezone


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        data = {}

    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    agent_dir = os.path.join(project_dir, ".agent")

    # Create .agent/ if it doesn't exist
    os.makedirs(agent_dir, exist_ok=True)

    state_file = os.path.join(agent_dir, "COMPACT_STATE.md")
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Read existing state to append, not overwrite
    existing = ""
    if os.path.exists(state_file):
        with open(state_file) as f:
            existing = f.read()

    # Build state entry
    entry = f"\n---\n\n## Compact at {timestamp}\n\n"
    entry += "Context was compressed. Key state preserved:\n\n"

    # Check for plan file
    plan_file = os.path.join(agent_dir, "PLAN.md")
    if os.path.exists(plan_file):
        entry += f"- Active plan: `{plan_file}` (read to restore context)\n"

    # Check for tasks file
    tasks_file = os.path.join(agent_dir, "TASKS.md")
    if os.path.exists(tasks_file):
        entry += f"- Task list: `{tasks_file}` (read to restore task state)\n"

    # Check for handoff file
    handoff_file = os.path.join(agent_dir, "HANDOFF.md")
    if os.path.exists(handoff_file):
        entry += f"- Handoff notes: `{handoff_file}` (read for session continuity)\n"

    # Git branch context
    try:
        import subprocess
        branch = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, cwd=project_dir, timeout=5
        )
        if branch.returncode == 0:
            entry += f"- Git branch: `{branch.stdout.strip()}`\n"
    except Exception:
        pass

    entry += "\nResume by reading the files listed above.\n"

    with open(state_file, "w") as f:
        f.write(existing + entry)

    # Output context for Claude post-compaction
    result = {
        "hookSpecificOutput": {
            "additionalContext": (
                f"Session state persisted to {state_file} before context compression. "
                f"After compaction, read .agent/COMPACT_STATE.md to restore key context."
            )
        }
    }
    print(json.dumps(result))
    sys.exit(0)


if __name__ == "__main__":
    main()
