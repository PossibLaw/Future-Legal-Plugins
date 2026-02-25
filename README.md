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

### possiblaw-build-plugin

Interactive plugin builder for Claude Code. Use `/possiblaw-build-plugin:build-plugin` to launch guided plugin creation. It asks targeted questions to determine the right extensibility mechanism — CLAUDE.md files, skills, commands, hooks, or agents — then generates properly structured files following documented patterns.

```bash
claude plugin install possiblaw-build-plugin@possiblaw-plugins
```

### possiblaw-guardrails

General-purpose safety hooks for Claude Code. Blocks destructive commands (`rm -rf`, `sudo rm`, `curl | bash`, force-push to main), protects sensitive files (`.env`, SSH keys, credentials), auto-formats code after writes, and validates task completion before sessions end. Ships with a curated blacklist and escalation prompts for risky-but-not-fatal commands.

```bash
claude plugin install possiblaw-guardrails@possiblaw-plugins
```

### possiblaw-legal

Single-command legal retrieval plugin for novice builders. `/possiblaw-legal:legal` now asks users whether to search `Skills`, `ContractCodex`, `SEC EDGAR`, or `All`, then returns either top skill matches or a prompt-ready evidence pack with citations. It includes a runtime entrypoint for tool wrappers: `possiblaw-legal/retrieval/run-search.mjs`.

```bash
claude plugin install possiblaw-legal@possiblaw-plugins
```

### possiblaw-vibe

Discovery-first project planning for non-coders. Use `/possiblaw-vibe:vibe-coding` to guide goal definition, budget constraints, and tech stack selection, then generate a complete dev environment with docs, helper scripts, and a debugging agent.

```bash
claude plugin install possiblaw-vibe@possiblaw-plugins
```

## Getting Started

### Option A: Using the interactive UI

1. Open Claude Code and type `/plugin`
2. Press the **right arrow key** to navigate to the **Discover** tab
3. Select **Add Marketplace**
4. Enter the GitHub repo: `PossibLaw/PossibLaw-Plugins`
5. Once added, browse the marketplace and install any plugin from the list

### Option B: Using the command line

First, add the `possiblaw-plugins` marketplace:

```bash
claude plugin marketplace add https://github.com/PossibLaw/PossibLaw-Plugins.git
```

If you previously added the old marketplace name (`PossibLaw`), remove it and re-add so Claude picks up the renamed marketplace:

```bash
claude plugin marketplace remove PossibLaw || true
claude plugin marketplace add https://github.com/PossibLaw/PossibLaw-Plugins.git
```

Then install any plugin:

```bash
claude plugin install possiblaw-build-plugin@possiblaw-plugins
claude plugin install possiblaw-guardrails@possiblaw-plugins
claude plugin install possiblaw-legal@possiblaw-plugins
claude plugin install possiblaw-vibe@possiblaw-plugins
```

## Release Validation

Before publishing plugin changes, run:

```bash
./scripts/validate-marketplace.sh
```

This enforces:
- Unique `plugin.json` names across all marketplace plugins
- `plugin.json` `name` matches each marketplace plugin ID
- Non-empty plugin versions

## What's Next

More plugins are on the way to help legal professionals architect what's next in legal. Stay tuned.

## Using These in Codex

These packages are authored in Claude plugin format, so Codex does not install them with `claude plugin install`.

Use this pattern instead:

1. Open the plugin's workflow docs and run the same process in Codex.
2. Configure any external MCP dependency in Codex (example for legal skills):
   `codex mcp add agentskills --url https://skills.case.dev/api/mcp`
3. In Codex prompts, explicitly request that workflow (example: "Use the legal workflow from this repo and show top 5 skills for contract review").

For possiblaw-legal specifically, see:
- `possiblaw-legal/docs/codex-usage.md`
- `possiblaw-legal/docs/agent-contract.md`
- `possiblaw-legal/retrieval/README.md`
