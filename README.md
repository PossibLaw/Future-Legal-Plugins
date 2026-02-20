# PossibLaw Plugins

Claude Code plugins built by the PossibLaw team.

## About PossibLaw

PossibLaw helps legal professionals become Builders. Architect Legal Professionals who don't just do the work, but design what comes next. AI is rewriting the rules. We help you stay ahead.

- Subscribe to our [Substack](https://www.possiblaw.com) for field notes on AI, teams, and transformation.
- Learn to think like a developer with [LexPair](https://www.lexpair.ai).
- Bring in [Lumen Atlas](https://https://www.possiblaw.com/p/consulting) for hands-on AI training and workflow coaching.

We're ReCoding the Vibe in legal.

## Available Plugins

### build-plugin

Interactive plugin builder for Claude Code. Asks targeted questions to determine the right extensibility mechanism — CLAUDE.md files, skills, commands, hooks, or agents — then generates properly structured files following documented patterns. Whether you're creating your first plugin or your tenth, it walks you through the full process from intent to working code.

```bash
claude plugin install build-plugin --marketplace PossibLaw
```

### guardrails

General-purpose safety hooks for Claude Code. Blocks destructive commands (`rm -rf`, `sudo rm`, `curl | bash`, force-push to main), protects sensitive files (`.env`, SSH keys, credentials), auto-formats code after writes, and validates task completion before sessions end. Ships with a curated blacklist and escalation prompts for risky-but-not-fatal commands.

```bash
claude plugin install guardrails --marketplace PossibLaw
```

### legal-skills

Discovery and access layer for legal professionals to easily find and use skills, tools, and MCP integrations. Provides a unified interface to legal resources from lawvable.com, docs.case.dev, and Midpage MCP. Includes commands for searching legal skills (/legal-search), browsing categorized tools (/legal-tools), and directly invoking legal workflows (/legal-skill). Features auto-discovery that suggests relevant resources during legal conversations.

```bash
claude plugin install legal-skills --marketplace PossibLaw
```

### project-vibe

Discovery-first project planning for non-coders. Guides you through defining your project goals, budget constraints, and tech stack selection — then generates a complete dev environment with docs, helper scripts, a debugging agent, and slash commands. Starts with your goals and works backward to technical decisions, so you don't need to know what a database is to get started.

```bash
claude plugin install project-vibe --marketplace PossibLaw
```

## Getting Started

### Option A: Using the interactive UI

1. Open Claude Code and type `/plugin`
2. Press the **right arrow key** to navigate to the **Discover** tab
3. Select **Add Marketplace**
4. Enter the GitHub repo: `PossibLaw/PossibLaw-Plugins`
5. Once added, browse the marketplace and install any plugin from the list

### Option B: Using the command line

First, add the PossibLaw marketplace:

```bash
claude plugin marketplace add --source github --repo PossibLaw/PossibLaw-Plugins
```

Then install any plugin:

```bash
claude plugin install build-plugin --marketplace PossibLaw
claude plugin install guardrails --marketplace PossibLaw
claude plugin install project-vibe --marketplace PossibLaw
```

## What's Next

More plugins are on the way to help legal professionals architect what's next in legal. Stay tuned.
