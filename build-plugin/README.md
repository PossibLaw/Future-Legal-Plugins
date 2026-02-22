# build-plugin

Interactive plugin builder for Claude Code. Guides you through creating plugins by asking targeted questions and generating properly structured files.

## Installation

```bash
# From local path
/plugin install /path/to/build-plugin-plugin

# Or copy to global skills
cp -r skills/build-plugin ~/.claude/skills/
```

## Usage

Use the slash command directly:

```bash
/possiblaw-build-plugin
/possiblaw-build-plugin create a command for contract triage
```

Or let the skill auto-activate when you mention creating plugins, skills, commands, hooks, or agents:

```
Create a new slash command for deploying to staging
```

```
Help me build a skill for code review
```

```
I need to set up hooks to block dangerous commands
```

## What It Does

1. **Checks foundation** - Recommends CLAUDE.md first if missing
2. **Classifies intent** - Determines which mechanism you need
3. **Asks targeted questions** - Gathers specifics for your use case
4. **Generates files** - Creates properly structured files from templates
5. **Reviews with you** - Shows files before writing
6. **Writes files** - Creates everything in the right locations

## The Hierarchy

```
CLAUDE.md              ← Foundation (create first)
    ↓
Skills / Commands      ← Capabilities (build on foundation)
    ↓
Hooks                  ← Enforcement (implement guardrails)
    ↓
References / Agents    ← Deep context (specialist knowledge)
```

## Supported Components

| Component | Purpose | Location |
|-----------|---------|----------|
| CLAUDE.md | Project context and rules | `./CLAUDE.md` |
| Slash command | Manual workflow | `.claude/commands/` |
| Skill | Auto-discovered capability | `.claude/skills/` |
| Hook | Runtime enforcement | `.claude/hookify.*.md` |
| Sub-agent | Research specialist | `.claude/agents/` |
| Full plugin | Distributable package | `.claude-plugin/` |

## Reference Files

The skill includes templates and examples for all component types:

- `references/templates.md` - All file templates
- `references/decision-tree.md` - Full questionnaire flow
- `references/examples.md` - Real-world production examples

## Development & Deployment

```bash
# Phase 1: Test locally (project-level)
# Skill is at .claude/skills/build-plugin/ - auto-discovered in this project
# Command is at commands/possiblaw-build-plugin.md

# Phase 2: Deploy globally (all your projects)
cp -r .claude/skills/build-plugin ~/.claude/skills/

# Phase 3: Share as distributable plugin
# Give others the build-plugin-plugin/ directory
# They install with: /plugin install /path/to/build-plugin-plugin
```

## License

MIT
