"""Guardrails pattern definitions.

Data module — no main. Imported by validate-bash.py and protect-files.py.
"""

# Commands that are always blocked (exit 2)
BLOCKED_PATTERNS = [
    r"rm\s+-rf\s",
    r"sudo\s+rm\s",
    r"curl\s.*\|\s*bash",
    r"wget\s.*\|\s*bash",
    r"dd\s+if=",
    r"chmod\s+777",
    r"chmod\s+-R\s+777",
    r"git\s+push\s+--force\s+origin\s+(main|master)",
    r"git\s+reset\s+--hard",
    r"git\s+clean\s+-f",
    r"mkfs\.",
    r":\(\)\{\s*:\|:&\s*\};:",
]

# Commands that require user confirmation (permissionDecision: "ask")
ESCALATE_PATTERNS = [
    r"git\s+reset(?!\s+--hard)",
    r"git\s+rebase",
    r"git\s+push\s+--force(?!\s+origin\s+(main|master))",
    r"rm\s+-r(?!f)\s",
    r"chmod\s+(?!777)",
]

# Files that should never be written to
PROTECTED_FILE_PATTERNS = [
    r"\.env$",
    r"\.env\.",
    r"\.git/config$",
    r"\.gitconfig$",
    r"id_rsa",
    r"id_ed25519",
    r"\.pem$",
    r"\.key$",
    r"credentials\.json$",
    r"secrets\.yaml$",
    r"\.secret$",
    r"\.ssh/",
    r"\.aws/",
]
