# Guardrails Plugin

Safety hooks that enforce boundaries on Claude Code sessions.

## Active Hooks

### PreToolUse — Bash Validation (`validate-bash.py`)
Intercepts every Bash command before execution.

**Blocked commands (exit 2 — execution prevented):**
- `rm -rf`, `sudo rm` — destructive file deletion
- `curl | bash`, `wget | bash` — remote code execution
- `dd if=` — raw disk writes
- `chmod 777`, `chmod -R 777` — overly permissive file modes
- `git push --force origin main/master` — force push to protected branches
- `git reset --hard` — irreversible history rewrite
- `git clean -f` — untracked file deletion
- `mkfs.` — filesystem formatting
- Fork bomb patterns

**Escalated commands (user prompted to confirm):**
- `git reset` (without --hard) — soft resets
- `git rebase` — history rewriting
- `git push --force` (non-main branches) — force push to feature branches
- `rm -r` (without -f) — recursive deletion
- `chmod` (non-777) — permission changes

### PreToolUse — File Protection (`protect-files.py`)
Blocks writes to sensitive files:
- `.env`, `.env.*` — environment secrets
- `.git/config`, `.gitconfig` — git configuration
- `id_rsa`, `id_ed25519`, `*.pem`, `*.key` — cryptographic keys
- `credentials.json`, `secrets.yaml`, `*.secret` — credentials
- `.ssh/`, `.aws/` — cloud and SSH configuration

### PostToolUse — Auto-Format (`format-check.sh`)
After Write or Edit, auto-formats the file if a project formatter is detected (prettier, ruff, black).

### Stop — Completion Validator
Before session ends, evaluates whether all requested tasks were completed. Blocks if work is incomplete.

## Rules for Claude

- Do not attempt to bypass hooks or suggest workarounds for blocked commands.
- When a command is blocked, suggest a safer alternative to the user.
- When escalation fires, explain the risk clearly and let the user decide.
- Treat all hook decisions as final unless the user explicitly overrides.
