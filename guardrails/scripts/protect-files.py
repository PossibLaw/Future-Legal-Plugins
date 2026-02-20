#!/usr/bin/env python3
"""PreToolUse hook for Write|Edit — blocks writes to sensitive files."""

import json
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blacklist import PROTECTED_FILE_PATTERNS


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    file_path = data.get("tool_input", {}).get("file_path", "")
    if not file_path:
        sys.exit(0)

    for pattern in PROTECTED_FILE_PATTERNS:
        if re.search(pattern, file_path):
            print(
                f"BLOCKED: File '{file_path}' matches protected pattern '{pattern}'. "
                f"This file contains sensitive data and should not be modified by Claude.",
                file=sys.stderr,
            )
            sys.exit(2)

    # Safe file — approve
    sys.exit(0)


if __name__ == "__main__":
    main()
