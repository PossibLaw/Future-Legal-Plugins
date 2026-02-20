# Plugin Templates

All templates for Claude Code plugin components. Use these as starting points, customizing based on user answers.

---

## 1. CLAUDE.md Template

**Purpose:** Top-level project context. Always loaded. Governs all skills, commands, and hooks.

**Target:** Under 150 lines (prefer ~50 lines). Use `docs/` for detailed content.

```markdown
# CLAUDE.md

[One-line project description]

## Commands

```bash
[cmd]          # [what it does]
[cmd]          # [what it does]
```

Run `[validation command]` after code changes.

## Stack

- [Framework/language with version]
- [Key dependencies]

## Structure

- `[dir]/` - [purpose]
- `[dir]/` - [purpose]
- `[file]` - [purpose]

## Boundaries

- **Always:** [safe defaults to follow automatically]
- **Ask first:** [risky operations needing approval]
- **Never:** [forbidden actions] — instead, [safe alternative]

## Further Reading

**IMPORTANT:** Read relevant docs below before starting any task.

- `docs/[topic].md` - [what it covers]
```

### Variant: TypeScript/Next.js

```markdown
# CLAUDE.md

[Project name] - [one-line description]

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test         # Run tests
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript compiler
```

Run `pnpm lint && pnpm typecheck` after code changes.

## Stack

- Next.js 14+ (App Router)
- TypeScript (strict mode)
- [Database]
- [Styling]

## Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable UI components
- `lib/` - Utility functions and shared logic
- `types/` - TypeScript type definitions

## Boundaries

- **Always:** Use named exports, `import type` for types, run lint before commits
- **Ask first:** Add new dependencies, modify database schema
- **Never:** Use `any` type — use `unknown` and narrow

## Code Style

- Functional components only (no classes)
- Prefix booleans: `is`/`has`/`can`/`should`
- Collocate tests: `*.test.ts` next to source
```

### Variant: Python

```markdown
# CLAUDE.md

[Project name] - [one-line description]

## Commands

```bash
uv sync              # Install dependencies
uv run pytest        # Run tests
uv run ruff check .  # Lint
uv run ruff format . # Format
uv run pyright       # Type check
```

Run `uv run ruff check . && uv run pyright` after code changes.

## Stack

- Python 3.12+
- [Framework]
- Package manager: uv

## Package Management

- ONLY use uv, NEVER pip
- Add packages: `uv add <package>`
- FORBIDDEN: `uv pip install`, `@latest` syntax

## Boundaries

- **Always:** Use specific exception types, run tests before commits
- **Ask first:** Add new dependencies, modify migrations
- **Never:** Use bare `except:` — catch specific exceptions
```

---

## 2. Slash Command Template

**Purpose:** Manual workflow triggered with `/command-name`. User explicitly invokes.

**Location:** `.claude/commands/<name>.md`

```markdown
---
description: [One sentence - what this command does]
argument-hint: [optional hint for arguments]
allowed-tools: [comma-separated list of tools this command can use]
---

# [Command Name]

[Brief description of what this command accomplishes]

## Instructions

[Step-by-step instructions for Claude to follow]

1. **[Step name]**
   - [Action to take]
   - [Details]

2. **[Step name]**
   - [Action to take]

## Parameters

- `$ARGUMENTS` - [what arguments mean, if any]

## Boundaries

- **Always:** [safe actions]
- **Never:** [forbidden actions]
```

### Example: Research Command

```markdown
---
description: Research a topic using web and codebase sources
argument-hint: <topic to research>
allowed-tools: Read, Grep, Glob, WebFetch, WebSearch, Task, Write
---

# Research: $ARGUMENTS

Research the given topic thoroughly using multiple sources.

## Instructions

1. **Web Research**
   - Search for official documentation
   - Find relevant tutorials and guides
   - Check for common pitfalls

2. **Codebase Search**
   - Find related patterns in this codebase
   - Identify existing implementations

3. **Synthesize Findings**
   - Create `docs/research/<topic-slug>.md`
   - Include sources consulted
   - Provide actionable recommendations

## Boundaries

- **Always:** Cite sources, check existing patterns first
- **Never:** Make up information without sources
```

---

## 3. SKILL.md Template

**Purpose:** Auto-discovered capability. Claude decides when to use based on description.

**Location:** `.claude/skills/<name>/SKILL.md`

**Note:** 56% miss rate per Vercel evals. Consider slash commands for critical workflows.

```markdown
---
name: [skill-name]
description: >
  [50-100 words describing what this skill does and when to use it.
  Be specific enough that Claude knows when to load this skill.
  Include trigger phrases and example scenarios.]
allowed-tools: [comma-separated tool list]
---

# [Skill Name]

[One paragraph overview]

## Overview

[What this capability provides]

## Usage Guidelines

**When to use:**
- [Scenario 1]
- [Scenario 2]

**When NOT to use:**
- [Edge case to avoid]

## Step-by-Step Instructions

1. **[Phase name]**
   - [Action]
   - [Action]

2. **[Phase name]**
   - [Action]

## Boundaries

- **Always:** [safe defaults]
- **Ask first:** [risky operations]
- **Never:** [forbidden actions]

## Reference Files

For additional context, load:
- `references/[file].md` - [what it contains]
```

### Skill with Hooks (Claude Code 2.1+)

```markdown
---
name: guarded-skill
description: >
  [Description of skill with built-in safety checks]

hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./validate.sh"
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "./lint-check.sh"
---

# [Skill Name]

This skill includes built-in governance via hooks.

[Rest of skill content...]
```

### Forked Sub-Agent Skill (Claude Code 2.1+)

```markdown
---
name: research-specialist
context: fork
agent: Explore
description: >
  Deep research task that runs in isolated context.
  Use for extensive reading/searching without polluting main context.
---

Research the given topic and return a distilled summary.

## Instructions

1. Fetch documentation from relevant sources
2. Search codebase for related patterns
3. Synthesize findings into actionable summary
4. Return only the summary (not raw research)
```

---

## 4. Hook Template (Hookify Format)

**Purpose:** Real-time enforcement. Block or warn on patterns.

**Location:** `.claude/hookify.<name>.local.md`

**Reference implementation:** For a full plugin-packaged hooks system with Python scripts, see the `guardrails` plugin. Install directly with `claude plugin install guardrails --marketplace PossibLaw` or use its source as a template for custom hooks.

```markdown
---
name: [hook-name]
enabled: true
event: [bash|file|prompt|stop]
pattern: [regex pattern]
action: [warn|block]
---

[Message shown when hook triggers]

[Explanation and guidance]
```

### Example: Block Dangerous Commands

```markdown
---
name: block-destructive-ops
enabled: true
event: bash
pattern: rm\s+-rf|dd\s+if=|mkfs|format
action: block
---

**Destructive operation blocked**

This command can cause data loss. Please:
- Verify the exact path
- Consider a safer alternative
- Ask for approval if necessary
```

### Example: Warn on Debug Code

```markdown
---
name: warn-debug-code
enabled: true
event: file
pattern: console\.log\(|debugger;|print\(
action: warn
---

**Debug code detected**

Remember to remove debugging statements before committing.
```

### Example: Multi-Condition Hook

```markdown
---
name: protect-env-files
enabled: true
event: file
action: block
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.env$|credentials|secrets
  - field: new_text
    operator: contains
    pattern: KEY
---

**Sensitive file edit blocked**

Credentials should not be hardcoded. Use environment variables and ensure this file is in .gitignore.
```

---

## 5. Sub-Agent Template

**Purpose:** Research specialist with isolated context. Returns distilled results.

**Location:** `.claude/agents/<name>.md`

```markdown
---
name: [agent-name]
description: >
  [When to use this agent. Include example scenarios.]

  <example>
  user: "[Example user request]"
  assistant: "I'll use the [agent-name] agent."
  <commentary>
  [Why this agent is appropriate]
  </commentary>
  </example>
model: [opus|sonnet|haiku]
color: [green|blue|yellow|red]
---

# [Agent Name]

## Primary Domain

**[Library/Framework]**: [Brief description]

### Core Expertise

1. [Area 1]
2. [Area 2]
3. [Area 3]

## Documentation Sources

- **Primary**: `[url]/llms.txt`

| Section | URL Path | Purpose |
|---------|----------|---------|
| [Topic] | `/docs/[path]` | [Description] |

## Operational Approach

1. **Fetch documentation index** from llms.txt
2. **Categorize inquiry** into domain
3. **Fetch targeted pages** (not everything)
4. **Review project context** (local files)
5. **Provide actionable guidance** with code examples

## Guidelines

- Prioritize official docs over training knowledge
- Reference documentation URLs consulted
- Verify API specifics against fetched docs
- Note version considerations when relevant
```

---

## 6. Plugin Package Template

**Purpose:** Distributable plugin with multiple components.

**Structure:**
```
plugin-name/
├── .claude-plugin/
│   └── plugin.json      # Required: Plugin metadata
├── commands/            # Optional: Slash commands
│   └── example.md
├── skills/              # Optional: Skills
│   └── example/
│       └── SKILL.md
├── agents/              # Optional: Agents
│   └── example.md
├── hooks/               # Optional: Hook configs
│   └── hooks.json
├── scripts/             # Optional: Supporting scripts
├── README.md            # Documentation
└── LICENSE
```

### plugin.json

```json
{
  "name": "[plugin-name]",
  "description": "[What this plugin does]",
  "version": "1.0.0",
  "author": {
    "name": "[Your Name]",
    "email": "[email@example.com]"
  }
}
```

### hooks/hooks.json (if using hooks)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "[ToolName]",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/scripts/handler.py\""
          }
        ]
      }
    ]
  }
}
```

**Note:** Use `${CLAUDE_PLUGIN_ROOT}` for portable paths within plugin scripts.

---

## Template Selection Guide

| User Wants | Template | Key Consideration |
|------------|----------|-------------------|
| Project setup | CLAUDE.md | Start here for any new project |
| Manual workflow | Command | User explicitly invokes with `/` |
| Auto-discovered capability | Skill | 56% miss rate - consider command |
| Runtime enforcement | Hook | Block dangerous, warn on concerns |
| Research task | Sub-agent | Isolated context, returns summary |
| Share with others | Plugin package | Distributable with metadata |
