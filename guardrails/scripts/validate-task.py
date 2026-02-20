#!/usr/bin/env python3
"""TaskCompleted hook — validates task output quality before marking complete."""

import json
import sys


# Minimum output length for a task to be considered substantive
MIN_OUTPUT_LENGTH = 20

# Patterns that suggest the task was not actually completed
INCOMPLETE_SIGNALS = [
    "i'll do this later",
    "skipping for now",
    "not yet implemented",
    "will be done in a future",
    "deferred",
    "out of scope",
    "TODO",
    "FIXME",
]


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    output = data.get("tool_input", {}).get("output", "")
    task_subject = data.get("tool_input", {}).get("subject", "")

    if not output:
        result = {
            "hookSpecificOutput": {
                "additionalContext": (
                    f"Task '{task_subject}' was marked complete but produced no output. "
                    f"Verify that the task was actually completed."
                )
            }
        }
        print(json.dumps(result))
        sys.exit(0)

    if len(output.strip()) < MIN_OUTPUT_LENGTH:
        result = {
            "hookSpecificOutput": {
                "additionalContext": (
                    f"Task '{task_subject}' produced very short output ({len(output.strip())} chars). "
                    f"Verify the task was substantively completed."
                )
            }
        }
        print(json.dumps(result))
        sys.exit(0)

    output_lower = output.lower()
    warnings = []
    for signal in INCOMPLETE_SIGNALS:
        if signal.lower() in output_lower:
            warnings.append(signal)

    if warnings:
        detected = ", ".join(warnings[:3])
        result = {
            "hookSpecificOutput": {
                "additionalContext": (
                    f"Task '{task_subject}' may not be fully complete — "
                    f"detected signals: {detected}. Review before accepting."
                )
            }
        }
        print(json.dumps(result))

    sys.exit(0)


if __name__ == "__main__":
    main()
