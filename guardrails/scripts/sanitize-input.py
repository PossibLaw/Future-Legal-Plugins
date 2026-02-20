#!/usr/bin/env python3
"""UserPromptSubmit hook — warns if user prompt contains likely secrets or credentials."""

import json
import re
import sys

# Patterns that suggest accidentally pasted secrets
SECRET_PATTERNS = [
    (r"(?:sk|pk)[-_](?:live|test)[-_][a-zA-Z0-9]{20,}", "API key (Stripe-style)"),
    (r"ghp_[a-zA-Z0-9]{36,}", "GitHub personal access token"),
    (r"ghs_[a-zA-Z0-9]{36,}", "GitHub server token"),
    (r"glpat-[a-zA-Z0-9\-]{20,}", "GitLab personal access token"),
    (r"xox[bpas]-[a-zA-Z0-9\-]{10,}", "Slack token"),
    (r"AKIA[0-9A-Z]{16}", "AWS access key ID"),
    (r"-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----", "Private key"),
    (r"(?:password|passwd|pwd)\s*[:=]\s*['\"][^'\"]{8,}['\"]", "Hardcoded password"),
    (r"[a-f0-9]{40}", "Possible SHA1 hash or token (40-char hex)"),
    (r"eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}", "JWT token"),
]

# Minimum prompt length to check — very short prompts are unlikely to contain secrets
MIN_CHECK_LENGTH = 30


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    prompt = data.get("tool_input", {}).get("user_prompt", "")
    if not prompt or len(prompt) < MIN_CHECK_LENGTH:
        sys.exit(0)

    warnings = []
    for pattern, description in SECRET_PATTERNS:
        if re.search(pattern, prompt):
            warnings.append(description)

    if not warnings:
        sys.exit(0)

    # Warn but don't block — user may intentionally reference token formats
    detected = ", ".join(warnings)
    result = {
        "hookSpecificOutput": {
            "additionalContext": (
                f"WARNING: User prompt may contain sensitive data ({detected}). "
                f"Do not echo, store, or transmit these values. If the user pasted "
                f"credentials accidentally, suggest they rotate them immediately."
            )
        }
    }
    print(json.dumps(result))
    sys.exit(0)


if __name__ == "__main__":
    main()
