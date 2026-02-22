# project-vibe

Discovery-first project planning for non-coders. Guides you through defining your project goals, budget constraints, and tech stack — then generates a complete dev environment with docs, helper scripts, a debugging agent, and slash commands.

## Installation

**Option A: Install from a marketplace** (recommended)

If you have a local plugin marketplace (a folder with `.claude-plugin/marketplace.json`), register it once and install:

```bash
/plugin marketplace add /path/to/your/plugins-folder
/plugin install project-vibe@your-marketplace-name
```

Or use the interactive UI — run `/plugin`, go to the **Discover** tab, and install from there. Once installed, `/possiblaw-vibe` is available in every project.

**Option B: Copy the command directly**

```bash
cp /path/to/project-vibe/commands/possiblaw-vibe.md ~/.claude/commands/
```

Note: Option B gives you the `/possiblaw-vibe` command but not the reference templates. The plugin install (Option A) includes everything.

## Usage

```bash
/possiblaw-vibe
```

Or with a starting idea:

```bash
/possiblaw-vibe I want to build a todo app with AI features
```

## What It Does

The `/possiblaw-vibe` command guides you through project discovery:

### Phase 1: Vision
- What do you want to build?
- Who is it for?
- What problem does it solve?

### Phase 2: Technical Baseline
- Do you know your tech stack?
- If yes: validate your choices
- If no: discover through budget questions

### Phase 3: Requirements
- Feature-specific questions based on project type
- Auth, real-time, mobile, admin needs
- Tooling level: Minimal (docs only), Standard (full environment), or Custom

### Phase 4: Architecture
- Tech stack recommendation with cost estimates
- Tradeoffs and growth path

### Phase 5: Generate
- PRD/Spec document (`docs/PRD.md`)
- CLAUDE.md (project foundation)
- Reference docs (`docs/architecture.md`, `docs/setup.md`)
- Getting-started guide (`docs/getting-started.md`)
- Helper scripts (`scripts/setup.sh`, `dev.sh`, `test.sh`, `lint.sh`)
- Dev-helper agent (`.claude/agents/dev-helper.md`)
- Slash commands (`/review`, `/test-runner`, `/setup`, `/getting-started`)

### Phase 6: Handoff
- All files written and scripts made executable
- "What's next" guidance pointing to the getting-started guide

## Philosophy

**Non-coders welcome.** This plugin assumes you might not know:
- What language to use
- What hosting costs
- What "database" even means

It starts with YOUR goals and works backward to technical decisions.

**Budget-first thinking.** Free tiers exist for almost everything. We don't recommend paid services unless necessary.

**Simplicity wins.** Fewer moving parts = fewer things to break. We recommend mainstream, well-documented stacks.

## Components

| Component | Purpose |
|-----------|---------|
| `/possiblaw-vibe` command | Main discovery questionnaire |
| `project-architect` agent | Tech stack advisor with cost knowledge |
| `references/stack-options.md` | Comprehensive stack guide by budget |
| `references/stack-templates.md` | CLAUDE.md templates for common stacks |
| `references/script-templates.md` | Shell script templates by stack |
| `references/agent-templates.md` | Dev-helper agent templates by stack |
| `references/command-templates.md` | Slash command templates |

## Example Output

After running `/possiblaw-vibe` with Standard tooling, you'll have:

```
your-project/
├── CLAUDE.md                          # Project foundation for Claude Code
├── docs/
│   ├── PRD.md                         # Product requirements document
│   ├── architecture.md                # How the pieces fit together
│   ├── setup.md                       # Detailed setup instructions
│   └── getting-started.md             # Quick-start workflow guide
├── scripts/
│   ├── setup.sh                       # Install deps, init project
│   ├── dev.sh                         # Start dev server
│   ├── test.sh                        # Run tests
│   └── lint.sh                        # Lint and format code
└── .claude/
    ├── agents/
    │   └── dev-helper.md              # Debugging assistant agent
    └── commands/
        ├── review.md                  # Code review against standards
        ├── test-runner.md             # Run and explain test results
        ├── setup.md                   # Project setup helper
        └── getting-started.md         # Show workflow guide
```

## License

MIT
