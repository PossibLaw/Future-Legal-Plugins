---
name: build-plugin
description: >
  Interactive plugin builder for Claude Code. Use when user wants to create
  a plugin, extension, skill, command, hook, agent, or CLAUDE.md file. Guides
  through targeted questions to determine the right extensibility mechanism,
  then generates properly structured files following documented patterns.
  Triggers: "create plugin", "build skill", "add command", "setup hooks",
  "new agent", "initialize CLAUDE.md".
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# Plugin Builder Skill

Build Claude Code plugins interactively by asking targeted questions and generating the correct files.

## The Plugin Hierarchy

**Critical:** Claude Code extensibility follows a top-down control hierarchy. Higher layers govern lower layers:

```
┌─────────────────────────────────────────────────────────┐
│  CLAUDE.md / AGENTS.md                                  │
│  Always-loaded. Sets project context, rules, boundaries.│
│  CONTROLS EVERYTHING BELOW.                             │
└─────────────────────────────┬───────────────────────────┘
                              │ governs
                              ▼
┌─────────────────────────────────────────────────────────┐
│  Skills & Commands                                      │
│  Task-specific capabilities. Loaded on-demand.          │
│  Must operate within CLAUDE.md constraints.             │
└─────────────────────────────┬───────────────────────────┘
                              │ enforced by
                              ▼
┌─────────────────────────────────────────────────────────┐
│  Hooks                                                  │
│  Runtime enforcement. Block/warn on patterns.           │
│  Implements guardrails defined above.                   │
└─────────────────────────────┬───────────────────────────┘
                              │ supported by
                              ▼
┌─────────────────────────────────────────────────────────┐
│  Reference Files & Agents                               │
│  Deep context loaded when needed.                       │
│  Specialist knowledge for specific domains.             │
└─────────────────────────────────────────────────────────┘
```

**Key insight:** If you're creating skills, commands, or hooks without a CLAUDE.md, you're building on sand. CLAUDE.md establishes the foundation that everything else builds upon.

## Overview

This skill implements a questionnaire-driven workflow:
1. Determine what type of extensibility mechanism is needed
2. **Check if CLAUDE.md exists** - recommend creating it first if missing
3. Gather specifics through targeted questions
4. Generate properly structured files using documented templates
5. Review with user before writing

## Step-by-Step Workflow

### Phase 1: Check Foundation

**Before asking what to create, check for CLAUDE.md:**

```bash
# Check project root
ls -la ./CLAUDE.md ./AGENTS.md 2>/dev/null
```

If no CLAUDE.md exists and user wants to create a skill/command/hook/agent:

> "I notice this project doesn't have a CLAUDE.md yet. CLAUDE.md is the top-level control file that governs how all skills, commands, and hooks behave. Would you like to create CLAUDE.md first, or proceed with your [skill/command/hook] knowing you may want to add CLAUDE.md later?"

### Phase 2: Intent Classification

Ask what the user wants to create. Use AskUserQuestion:

**Question:** "What do you want to create?"

| Option | Description |
|--------|-------------|
| **CLAUDE.md** | Top-level project context and rules (start here for new projects) |
| **Slash command** | Manual workflow triggered with /command-name |
| **Skill** | Auto-discovered capability (56% miss rate - consider command instead) |
| **Hook** | Real-time enforcement (block/warn on patterns). Consider the `guardrails` plugin as a starting template. |
| **Sub-agent** | Research specialist with isolated context |
| **Full plugin** | Distributable package with multiple components |

### Phase 3: Decision Tree

Use this flow to help users pick the right mechanism:

```
Q1: Always-on rule OR task-specific capability?
    → Always-on → CLAUDE.md
    → Task-specific → Q2

Q2: User triggers manually OR Claude auto-discovers?
    → Manual trigger → Slash command (recommended)
    → Auto-discover → Skill (warn: 56% miss rate)

Q3: Research-heavy OR quick action?
    → Research-heavy → Sub-agent
    → Quick action → Q4

Q4: Needs real-time enforcement?
    → Yes → Hook
    → No → Q5

Q5: Integrates with external systems?
    → Yes → MCP server or Research agent
    → No → Skill or Command

Q6: Reusable across projects?
    → Yes → Official plugin package
    → No → Project-level files
```

### Phase 4: Type-Specific Questions

Based on selection, ask targeted questions. Load from `references/decision-tree.md`.

### Phase 5: Generate Files

Load templates from `references/templates.md` and generate based on answers.

**For hooks:** If the user wants safety/guardrail hooks, recommend the `guardrails` plugin first (`claude plugin install possiblaw-guardrails --marketplace PossibLaw`). It provides production-ready patterns for destructive command blocking, sensitive file protection, and auto-formatting. If they need custom hooks beyond what guardrails provides, use the guardrails source as a template — see `references/examples.md` for the full structure.

**File naming conventions:**
- CLAUDE.md: `./CLAUDE.md` (project root)
- Commands: `.claude/commands/<name>.md` (kebab-case)
- Skills: `.claude/skills/<name>/SKILL.md` (kebab-case)
- Agents: `.claude/agents/<name>.md` (kebab-case)
- Hooks: `.claude/hookify.<name>.local.md`
- Plugins: `<name>/.claude-plugin/plugin.json`

### Phase 6: Review with User

Present all generated files for approval:
1. Show each file with full content
2. Explain what each file does
3. **Show where it fits in the hierarchy**
4. Ask: "Ready to create these files?"

**BLOCKING:** Wait for explicit user approval before writing.

### Phase 7: Write Files

After approval:
1. Create necessary directories
2. Write all files
3. Confirm creation with file paths
4. Provide next steps

## Reference Files

Load these for detailed templates and examples:
- `references/templates.md` - All file templates
- `references/decision-tree.md` - Full questionnaire flow
- `references/examples.md` - Real-world examples

## Three-Tier Boundary System

All generated files should include boundaries where appropriate:

```markdown
## Boundaries
- **Always:** [safe actions to do automatically]
- **Ask first:** [potentially impactful actions]
- **Never:** [forbidden actions]
```

## Output Locations

| Type | Project-Level | Global |
|------|---------------|--------|
| CLAUDE.md | `./CLAUDE.md` | `~/.claude/CLAUDE.md` |
| Command | `.claude/commands/` | `~/.claude/commands/` |
| Skill | `.claude/skills/` | `~/.claude/skills/` |
| Agent | `.claude/agents/` | `~/.claude/agents/` |
| Hook | `.claude/hookify.*.md` | `~/.claude/settings.json` |
| Plugin | `.claude-plugin/` | N/A |

## Critical Patterns

1. **CLAUDE.md is the foundation** - Create it first; it governs everything below
2. **Keep CLAUDE.md under 150 lines** - Prefer shorter; use docs/ for details
3. **Progressive disclosure** - 5% description / 30% SKILL.md / 65% references
4. **Backpressure over prose** - Let tools enforce rules
5. **Safe alternatives** - Every "don't" needs a "do this instead"
6. **Commands early** - Document exact commands with flags
7. **Code over prose** - One example beats three paragraphs
