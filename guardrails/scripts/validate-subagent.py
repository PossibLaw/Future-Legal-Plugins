#!/usr/bin/env python3
"""SubagentStop hook — validates subagent output for completeness markers."""

import json
import sys


# Markers that suggest incomplete subagent work
INCOMPLETE_MARKERS = [
    "TODO",
    "FIXME",
    "HACK",
    "XXX",
    "not implemented",
    "placeholder",
    "work in progress",
    "WIP",
]

# Markers that suggest the subagent hit an error
ERROR_MARKERS = [
    "BLOCKED:",
    "FAILED:",
    "ERROR:",
    "could not find",
    "no results found",
    "unable to",
]


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    # SubagentStop provides the agent output
    output = data.get("tool_input", {}).get("output", "")
    agent_type = data.get("tool_input", {}).get("subagent_type", "unknown")

    if not output:
        sys.exit(0)

    output_lower = output.lower()
    warnings = []

    for marker in INCOMPLETE_MARKERS:
        if marker.lower() in output_lower:
            warnings.append(f"incomplete marker '{marker}'")

    for marker in ERROR_MARKERS:
        if marker.lower() in output_lower:
            warnings.append(f"error marker '{marker}'")

    if not warnings:
        sys.exit(0)

    detected = "; ".join(warnings[:5])  # Cap at 5 to avoid noise
    result = {
        "hookSpecificOutput": {
            "additionalContext": (
                f"Subagent ({agent_type}) output contains potential issues: {detected}. "
                f"Review the output before using it. The subagent may not have fully "
                f"completed its task."
            )
        }
    }
    print(json.dumps(result))
    sys.exit(0)


if __name__ == "__main__":
    main()
