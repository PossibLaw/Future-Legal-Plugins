---
description: Start a new project with guided discovery and produce a PRD + CLAUDE.md + reference docs (PossibLaw).
argument-hint: [optional project idea]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion, Task
---

# /possiblaw-vibe:vibe-coding

Discovery-first project planning for non-coders.

## Rules

1. Never assume requirements, budget, or stack; ask.
2. Do not write files until the user confirms the plan.
3. If `$ARGUMENTS` is provided, treat it as an initial idea and still run discovery.

## Outcome

After discovery and user confirmation, generate:
- `docs/PRD.md`
- `CLAUDE.md`
- supporting reference docs and helper scripts as appropriate for the chosen stack
