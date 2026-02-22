# PossibLaw Plugins

Claude Code plugins built by the PossibLaw team.

## Runtime Support

- **Claude Code:** Full plugin install support via marketplace (`claude plugin install ...`).
- **Codex:** Not installable as Claude plugins. Use the plugin docs/workflows directly in Codex, and configure required MCP servers with `codex mcp ...`.

## About PossibLaw

PossibLaw helps legal professionals become Builders. Architect Legal Professionals who don't just do the work, but design what comes next. AI is rewriting the rules. We help you stay ahead.

- Subscribe to our [Substack](https://www.possiblaw.com) for field notes on AI, teams, and transformation.
- Learn to think like a developer with [LexPair](https://www.lexpair.ai).
- Bring in [Lumen Atlas](https://https://www.possiblaw.com/p/consulting) for hands-on AI training and workflow coaching.

We're ReCoding the Vibe in legal.

## Available Plugins

### build-plugin

Interactive plugin builder for Claude Code. Use `/possiblaw-build-plugin` to launch guided plugin creation. It asks targeted questions to determine the right extensibility mechanism — CLAUDE.md files, skills, commands, hooks, or agents — then generates properly structured files following documented patterns.

```bash
claude plugin install build-plugin --marketplace PossibLaw
```

### guardrails

General-purpose safety hooks for Claude Code. Blocks destructive commands (`rm -rf`, `sudo rm`, `curl | bash`, force-push to main), protects sensitive files (`.env`, SSH keys, credentials), auto-formats code after writes, and validates task completion before sessions end. Ships with a curated blacklist and escalation prompts for risky-but-not-fatal commands.

```bash
claude plugin install guardrails --marketplace PossibLaw
```

### legal-skills

Single-command legal retrieval plugin for novice builders. `/possiblaw-legal` now asks users whether to search `Skills`, `ContractCodex`, `SEC EDGAR`, or `All`, then returns either top skill matches or a prompt-ready evidence pack with citations. It includes a runtime entrypoint for tool wrappers: `legal-skills/retrieval/run-search.mjs`.

```bash
claude plugin install legal-skills --marketplace PossibLaw
```

### project-vibe

Discovery-first project planning for non-coders. Use `/possiblaw-vibe` to guide goal definition, budget constraints, and tech stack selection, then generate a complete dev environment with docs, helper scripts, and a debugging agent.

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
claude plugin install legal-skills --marketplace PossibLaw
claude plugin install project-vibe --marketplace PossibLaw
```

## What's Next

More plugins are on the way to help legal professionals architect what's next in legal. Stay tuned.

## Using These in Codex

These packages are authored in Claude plugin format, so Codex does not install them with `claude plugin install`.

Use this pattern instead:

1. Open the plugin's workflow docs and run the same process in Codex.
2. Configure any external MCP dependency in Codex (example for legal skills):
   `codex mcp add agentskills --url https://skills.case.dev/api/mcp`
3. In Codex prompts, explicitly request that workflow (example: "Use the legal workflow from this repo and show top 5 skills for contract review").

For legal-skills specifically, see:
- `legal-skills/docs/codex-usage.md`
- `legal-skills/docs/agent-contract.md`
- `legal-skills/retrieval/README.md`
