# Guardrails

General-purpose safety hooks for Claude Code. Blocks destructive commands, protects sensitive files, validates task completion, and auto-formats code.

## Installation

```bash
claude plugin install guardrails --marketplace PossibLaw
```

## What's Protected

### Destructive Commands
Commands like `rm -rf`, `sudo rm`, `curl | bash`, `git push --force origin main`, and `git reset --hard` are blocked before execution. Claude will suggest a safer alternative.

### Risky Commands
Commands like `git reset`, `git rebase`, and `rm -r` trigger a confirmation prompt. You decide whether to proceed.

### Sensitive Files
Writes to `.env`, SSH keys, credentials files, and cloud config directories are blocked. These files should only be modified manually.

### Incomplete Sessions
Before Claude ends a session, it self-evaluates whether all requested tasks were completed. If work remains, the session stays open.

## What's Auto-Applied

### Code Formatting
After any file write or edit, the plugin detects your project's formatter (prettier, ruff, or black) and auto-formats the changed file. This runs silently and never blocks.

## Hook Reference

| Event | Matcher | Script | Behavior |
|-------|---------|--------|----------|
| PreToolUse | Bash | `validate-bash.py` | Blocks destructive commands, escalates risky ones |
| PreToolUse | Write\|Edit | `protect-files.py` | Blocks writes to sensitive files |
| PostToolUse | Write\|Edit | `format-check.sh` | Auto-formats if formatter detected |
| Stop | — | prompt (inline) | Validates task completion |

## Tier 2 Hooks (Opt-In)

Tier 2 hooks provide additional safety and context features. They are defined in `hooks/tier2-hooks.json` and are **not active by default**.

### Enabling Tier 2

To activate Tier 2 hooks, merge them into your hooks configuration or symlink the file:

```bash
# Option 1: Copy Tier 2 hooks into your project's .claude/settings.json
# Option 2: Symlink for automatic updates
ln -s "$(claude plugin path guardrails)/hooks/tier2-hooks.json" .claude/tier2-hooks.json
```

### Tier 2 Hook Reference

| Event | Script | Behavior |
|-------|--------|----------|
| SessionStart | `git-status.sh` | Loads git branch, recent commits, and working tree changes |
| UserPromptSubmit | `sanitize-input.py` | Warns if prompt contains API keys, tokens, or passwords |
| PreCompact | `persist-state.py` | Saves session state to `.agent/COMPACT_STATE.md` |
| SubagentStop | `validate-subagent.py` | Warns if subagent output contains TODO/FIXME/error markers |
| TaskCompleted | `validate-task.py` | Warns if task output is empty, too short, or deferred |

All Tier 2 hooks are **non-blocking** — they add warnings or context but never prevent actions.

## Customization

### Adding Blocked Commands
Edit `scripts/blacklist.py` and add regex patterns to `BLOCKED_PATTERNS` (always blocked) or `ESCALATE_PATTERNS` (user prompted).

### Adding Protected Files
Edit `scripts/blacklist.py` and add regex patterns to `PROTECTED_FILE_PATTERNS`.

## Examples

### Blocked Command
```
> rm -rf /tmp/build
BLOCKED: Command matches destructive pattern 'rm\s+-rf\s'.
Use a safer alternative.
```

### Escalated Command
```
> git rebase main
This command may have unintended consequences (matched pattern 'git\s+rebase').
Confirm before proceeding. [y/n]
```

### Auto-Formatted File
```
> Write src/app.js
[file written]
[prettier auto-formatted — no output]
```

## Troubleshooting

**Command blocked unexpectedly?** Check `scripts/blacklist.py` for the matching pattern. Remove or adjust patterns that don't apply to your workflow.

**File write blocked?** The file matches a protected pattern in `PROTECTED_FILE_PATTERNS`. If you need Claude to modify it, temporarily remove the pattern or modify the file manually.

**Session won't end?** The Stop hook detected incomplete work. Review the pending tasks and either complete them or tell Claude to end the session.

## License

MIT
