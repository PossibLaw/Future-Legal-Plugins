---
name: possiblaw-vibe
description: Start a new project with guided discovery. Helps non-coders define goals, budget, and tech stack before coding begins.
argument-hint: [optional project idea]
allowed-tools: Read, Write, Edit, Glob, Bash, AskUserQuestion, Task
---

# /possiblaw-vibe

Project Vibe: Discovery-First Planning

Guide the user through project discovery to produce a PRD, CLAUDE.md, and reference docs.

---

## CRITICAL: No Assumptions Policy

**NEVER assume. ALWAYS ask.**

- Do NOT assume the user knows technical terms — explain or ask
- Do NOT assume budget, timeline, or scale — ask explicitly
- Do NOT assume features are needed — ask if they want them
- Do NOT proceed to the next phase until the current phase is complete
- Do NOT generate files until ALL discovery phases are finished and user confirms the recommendations

**Each discovery phase is BLOCKING.** Wait for user responses before moving forward. If an answer is unclear, ask a follow-up question. If the user seems unsure, offer options to choose from.

File operations follow the agent's permission settings.

**When in doubt, ask.** It's better to ask one extra question than to build the wrong thing.

---

**Assumption about the USER:** They may not know coding. Start with their goal, not tech details.

## Phase 1: The Vision

Start by understanding what they want to build.

**Ask:**
1. "What do you want to build? Describe the end result you're imagining."
2. "Who is this for? (yourself, a client, the public, a specific group)"
3. "What problem does this solve?"

If `$ARGUMENTS` was provided, use it as the starting point and ask follow-up questions.

**BLOCKING:** Do not proceed until you have clear answers for: what they're building, who it's for, and what problem it solves.

---

## Phase 2: Technical Baseline

Determine their technical knowledge level.

**Ask:**
"Do you already know what tech stack you want to use?"

| Answer | Next Step |
|--------|-----------|
| Yes, I know exactly | Go to Phase 2A |
| I have some ideas | Go to Phase 2A (validate their ideas) |
| No idea | Go to Phase 2B |

### Phase 2A: Validate Known Stack

If they have a stack in mind:
1. "What language/framework are you thinking?"
2. "Any specific reason for that choice?"
3. "Have you used it before?"

Validate their choice against their goals. If it's a mismatch, gently suggest alternatives.

### Phase 2B: Budget Discovery

If they don't know the stack, budget drives the recommendation.

**Ask progressively:**

1. **Hosting budget**
   - "Do you have a budget for hosting? (free tier only, $5-20/mo, $50+/mo, enterprise)"

2. **Database needs**
   - "Will you need to store user data, files, or both?"
   - "How much data? (small/personal, medium/startup, large/enterprise)"

3. **Third-party services**
   - "Do you need payments, auth, email, AI, or other paid APIs?"
   - "Any services you're already paying for that we should use?"

4. **Time constraints**
   - "How quickly do you need this? (learning project, weeks, days, yesterday)"

**BLOCKING:** Do not proceed until you know: their tech knowledge level AND (if no stack) their budget constraints for hosting, database, and services.

---

## Phase 3: Requirements Gathering

Based on vision + budget, ask targeted questions:

**For web apps:**
- "Does it need user accounts and login?"
- "Real-time features? (chat, live updates, collaboration)"
- "Mobile-friendly or desktop-only?"
- "Admin dashboard needed?"

**For APIs/backends:**
- "What will consume this API? (mobile app, web app, third-party)"
- "Expected traffic? (personal, hundreds, thousands, millions)"
- "Need background jobs or scheduled tasks?"

**For tools/utilities:**
- "Command line, GUI, or web interface?"
- "Just for you or will others use it?"

**Tooling level:**

After gathering requirements, ask:

"How much project tooling do you want me to set up?"

| Level | What You Get |
|-------|-------------|
| **Minimal** | Docs only (CLAUDE.md, PRD, architecture, setup) |
| **Standard** (recommended) | Docs + helper scripts + dev agent + slash commands + getting-started guide |
| **Custom** | You pick which extras: scripts, agent, commands, getting-started |

If they choose **Custom**, ask which extras they want:
- "Helper scripts (setup, dev, test, lint)"
- "Dev-helper agent (debugging assistant)"
- "Slash commands (/review, /test-runner, /setup, /getting-started)"
- "Getting-started guide"

Default to **Standard** if they're unsure.

**BLOCKING:** Do not proceed until you have gathered all relevant requirements for their project type AND determined tooling level. If unsure what to ask, ask: "Is there anything else about your project I should know before I recommend a tech stack?"

---

## Phase 4: Architecture Decisions

Based on gathered info, use the `project-architect` agent to recommend:
1. Tech stack (language, framework, database)
2. Hosting approach
3. Key libraries/services
4. Folder structure

**Spawn agent:**
```
Use Task tool with subagent_type: general-purpose
Prompt: Load the project-architect agent and recommend a tech stack for:
- Goal: [summarize]
- Budget: [summarize]
- Requirements: [summarize]
Return: Recommended stack with reasoning and cost estimate
```

Present the tech stack recommendation and cost estimate. Ask: "Does this stack and budget look right for your project?" Wait for confirmation before proceeding.

---

## Phase 5: Generate Outputs

After user confirms the recommendations, generate:

### 5.1 PRD/Spec Document

Create `docs/PRD.md` using this structure:

    # [Project Name] - Product Requirements Document

    ## Vision
    [What they described]

    ## Problem Statement
    [The problem it solves]

    ## Target Users
    [Who it's for]

    ## Requirements

    ### Must Have (P0)
    - [ ] [Core feature 1]
    - [ ] [Core feature 2]

    ### Should Have (P1)
    - [ ] [Important feature]

    ### Nice to Have (P2)
    - [ ] [Future feature]

    ## Technical Decisions

    ### Stack
    - **Language:** [choice] - [why]
    - **Framework:** [choice] - [why]
    - **Database:** [choice] - [why]
    - **Hosting:** [choice] - [why]

    ### Cost Estimate
    | Service | Monthly Cost |
    |---------|-------------|
    | Hosting | $X |
    | Database | $X |
    | [Service] | $X |
    | **Total** | **$X** |

    ## Open Questions
    - [Anything still unclear]

    ## Next Steps
    1. [First coding task]
    2. [Second task]

### 5.2 CLAUDE.md

Create `CLAUDE.md` based on chosen stack. Use templates from `references/stack-templates.md`.

### 5.3 Reference Docs

Create relevant reference docs in `docs/`:
- `docs/architecture.md` - How the pieces fit together
- `docs/setup.md` - How to get the dev environment running

### 5.4 Scripts (Standard/Custom with scripts)

Generate shell scripts in `scripts/` using templates from `references/script-templates.md`.

1. Include the **Common Utilities Block** at the top of every script
2. Choose the stack-specific template matching the recommended stack
3. Replace all placeholders (`[Project Name]`, env vars, etc.)
4. Adjust package manager to match the user's choice
5. Generate these files:
   - `scripts/setup.sh` — Install deps, init git, create .env, verify build
   - `scripts/dev.sh` — Start dev server with helpful messages
   - `scripts/test.sh` — Run tests with beginner-friendly output
   - `scripts/lint.sh` — Run linter/formatter with fix suggestions

### 5.5 Dev Helper Agent (Standard/Custom with agent)

Generate a dev-helper agent in `.claude/agents/dev-helper.md` using templates from `references/agent-templates.md`.

1. Choose the stack-specific template matching the recommended stack
2. Ensure Project Knowledge paths match the actual generated docs
3. Customize the error table if the user mentioned specific concerns
4. Output a single file: `.claude/agents/dev-helper.md`

### 5.6 Commands (Standard/Custom with commands)

Generate slash commands in `.claude/commands/` using templates from `references/command-templates.md`.

1. Generate these command files:
   - `.claude/commands/review.md` — Check code against CLAUDE.md boundaries
   - `.claude/commands/test-runner.md` — Run tests and explain failures
   - `.claude/commands/setup.md` — Check prerequisites and run setup
   - `.claude/commands/getting-started.md` — Show workflow guide
2. For `/review`, include only the stack-specific checks relevant to this project
3. Ensure all commands reference the correct project paths

### 5.7 Getting Started Guide (Standard/Custom with getting-started)

Generate `docs/getting-started.md` — a quick-reference workflow guide for the user. Use this structure:

    # Getting Started with [Project Name]

    ## Quick Start

    1. **Set up the project:** `./scripts/setup.sh`
    2. **Start developing:** `./scripts/dev.sh`
    3. **Run tests:** `./scripts/test.sh`
    4. **Check your code:** `./scripts/lint.sh`

    ## Helpful Commands

    | Command | What It Does |
    |---------|-------------|
    | `/review` | Check your code against project standards |
    | `/test-runner` | Run tests and explain any failures |
    | `/setup` | Re-run setup or troubleshoot issues |
    | `/getting-started` | Show this guide again |

    ## Project Docs

    - `CLAUDE.md` — Project commands and boundaries (Claude reads this automatically)
    - `docs/PRD.md` — What the project does and why
    - `docs/architecture.md` — How the pieces fit together
    - `docs/setup.md` — Detailed setup instructions

    ## Dev Helper

    Need help? Ask the **Dev Helper** agent:
    - "Why is my page blank?"
    - "Explain this error"
    - "How do I add a new [page/route/command]?"

    ## Saving Your Progress (Git)

    Git keeps a history of every change you save. It's like "undo" for your whole project.
    You don't need a GitHub account or remote repo — it works locally.

    - **Save a snapshot:** `git add -A && git commit -m "describe what you changed"`
    - **See what changed:** `git status`
    - **View history:** `git log --oneline`

    We recommend committing after each meaningful change — finishing a feature,
    fixing a bug, or reaching a working state. If things break later, you can
    always go back.

    ## Tips

    - Run `./scripts/lint.sh` before committing
    - Commit often — small saves are easier to undo than big ones
    - Check `docs/PRD.md` when unsure about requirements
    - The dev-helper agent has a table of common errors — ask it first!

Customize the guide for the specific stack (adjust commands, tips, and examples).

## Phase 6: Handoff

Present all generated files to the user:

1. Show PRD summary
2. Show CLAUDE.md
3. Show full folder structure that will be created

**Generated artifacts (Standard tier):**

| Artifact | Path |
|----------|------|
| Project foundation | `CLAUDE.md` |
| Product requirements | `docs/PRD.md` |
| Architecture overview | `docs/architecture.md` |
| Setup instructions | `docs/setup.md` |
| Getting-started guide | `docs/getting-started.md` |
| Setup script | `scripts/setup.sh` |
| Dev server script | `scripts/dev.sh` |
| Test runner script | `scripts/test.sh` |
| Lint/format script | `scripts/lint.sh` |
| Dev-helper agent | `.claude/agents/dev-helper.md` |
| Review command | `.claude/commands/review.md` |
| Test runner command | `.claude/commands/test-runner.md` |
| Setup command | `.claude/commands/setup.md` |
| Getting-started command | `.claude/commands/getting-started.md` |

File writing follows the agent's permission settings. Then:
1. Create all directories (`docs/`, `scripts/`, `.claude/agents/`, `.claude/commands/`)
2. Write all files
3. Make scripts executable: `chmod +x scripts/*.sh`
4. **Git save checkpoint:** If a `.git` repo exists, suggest committing the generated files as a starting point ("Initial project setup from /possiblaw-vibe"). If no `.git` exists, suggest initializing one: "Want me to set up git so you can save your progress as you go? It keeps a history of every change — recommended even for solo projects."
5. Provide "what's next" guidance — point them to `docs/getting-started.md` and suggest running `./scripts/setup.sh`

## Boundaries

- **Always:** Ask before assuming. Complete each phase before proceeding. Explain technical terms in plain language.
- **Ask first:** Budget constraints, feature requirements, timeline, scale expectations, paid services.
- **Never:** Assume the user knows what they need. Never skip discovery phases. Never generate files without explicit approval. Never use jargon without explanation.
