---
description: Build or update Claude Code plugins with guided questions and safe file generation.
argument-hint: [optional plugin request, e.g. create a command for staging deploy]
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# /possiblaw-build-plugin

Interactive plugin builder entrypoint for novice and advanced users.

## Usage

```bash
/possiblaw-build-plugin
/possiblaw-build-plugin create a legal command for clause triage
/possiblaw-build-plugin add hooks to block dangerous git commands
```

## What This Command Does

1. Classifies what you want to build (`CLAUDE.md`, command, skill, hook, agent, or full plugin).
2. Checks foundation files first (`CLAUDE.md`/`AGENTS.md`).
3. Asks targeted questions to gather required details.
4. Generates the right file set using validated templates.
5. Reviews planned files with you before writing.
6. Writes files only after explicit approval.

## Execution Rule

Follow the canonical workflow in:

- `skills/build-plugin/SKILL.md`

Apply that workflow exactly, including confirmation gates and safety boundaries.
