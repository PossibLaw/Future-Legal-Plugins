# PossibLaw Plugins

PossibLaw plugin marketplace for Claude Code. Distributes our cross-tool starter pack (a two-tier progressive harness) and the legal-app design grill plugin.

## Runtime Support

- **Claude Code:** Full plugin install support via marketplace (`/plugin install ...`).
- **Codex:** Claude plugins are not installed directly. Use `PossibLaw-Agent-Starter-Pack` for the canonical host-agnostic contract; Codex users install via the bootstrap installer in that same repo.

## Repository Boundary

- `PossibLaw-Agent-Starter-Pack` owns host-agnostic roles, delivery contracts, the state-artifact pipeline (PLAN/TEST/REVIEW/HANDOFF), continuity checkpoints, and now the runtime guardrails (Claude only).
- `Plugins` (this repo) owns Claude marketplace packaging — currently a thin catalog that points at the starter pack and ships the legal-app design grill.
- If a workflow needs to work the same way in both Codex and Claude Code, define the contract in the Starter Pack first.

## About PossibLaw

PossibLaw helps legal professionals become Builders. Architect Legal Professionals who don't just do the work, but design what comes next. AI is rewriting the rules. We help you stay ahead.

- Subscribe to our [Substack](https://www.possiblaw.com) for field notes on AI, teams, and transformation.
- Learn to think like a developer with [Trazomo](https://www.trazomo.com).
- Bring in [Lumen Atlas](https://www.possiblaw.com/p/consulting) for hands-on AI training and workflow coaching.

We're ReCoding the Vibe in legal.

## Plugins

### possiblaw-starter (v3.0.0)

Two-tier progressive harness for non-developer legal builders. **Tier 1 (Starter)** ships the state-artifact pipeline (PLAN/TEST/REVIEW/HANDOFF), single-file continuity, role registry, continuity checkpoints, runtime guardrails (Claude only), a simplicity ladder, and token discipline. **Tier 2 (Scale)** adds Graphify indexing and deeper review, gated by `/possiblaw-starter:scale` as the codebase grows. Sourced from [`PossibLaw/agent-starter-pack`](https://github.com/PossibLaw/agent-starter-pack). Cross-tool via `AGENTS.md`; Codex/AGENTS-aware users continue using the bootstrap installer in that repo (macOS + Linux).

Installing the plugin gives you the **global** layer (guardrails, agents, skills active in every Claude Code session). To scaffold the **per-project** layer (`AGENTS.md`, `CLAUDE.md`, `.agent/*.md` state templates, `docs/roles/`, `docs/workflows/`, `docs/glossary.md`), run the init command inside any project repo after install:

```bash
/plugin install possiblaw-starter@possiblaw-plugins
# then, inside a project repo:
/possiblaw-starter:init
```

`/possiblaw-starter:init` auto-detects your stack (Node/Python/Go/Rust), pre-fills test/lint/typecheck/build commands, patches `.gitignore` so per-session state files stay local, and supports `--preserve-progress` (skip overwriting in-progress `.agent/*.md`) and `--dry-run` (preview).

### possiblaw-vibe (v2.0.0)

Legal-app design grill in the spirit of Matt Pocock's grill-me skill. Walks document systems, software systems, workflows, data model, and integrations through relentless interrogation until the spec is real. Built for legal professionals architecting practice tooling, document automation, client portals, compliance systems, and beyond.

```bash
/plugin install possiblaw-vibe@possiblaw-plugins
```

## Install

```bash
/plugin marketplace add PossibLaw/PossibLaw-Plugins
/plugin install possiblaw-starter@possiblaw-plugins
/plugin install possiblaw-vibe@possiblaw-plugins
```

Then, in any project repo where you want the state-artifact pipeline + governance files:

```bash
/possiblaw-starter:init
```

To start a legal-app design session:

```bash
/possiblaw-vibe:vibe-coding
```

If you previously added the marketplace under a different name, remove it and re-add so Claude picks up the renamed marketplace:

```bash
/plugin marketplace remove possiblaw-plugins || true
/plugin marketplace add PossibLaw/PossibLaw-Plugins
```

## What was here previously

On 2026-04-28 the marketplace was collapsed from four plugins to two:

- `possiblaw-build-plugin` — retired. The interactive plugin builder is no longer maintained as a separate package.
- `possiblaw-legal` — retired as a standalone plugin. Its retrieval scaffolds (the verbatim `*.mjs` runtime entrypoints for Skills, ContractCodex, and SEC EDGAR) live on inside `possiblaw-vibe/references/scaffolds/_source/` and are referenced by the design grill when a stack calls for legal retrieval.
- `possiblaw-guardrails` — absorbed into `possiblaw-starter` v2.0.0. The safety hooks that previously shipped here are now part of the starter pack's Claude runtime layer.

The `archive/before-cleanup-2026-04-28` git tag in this repo preserves the previous tree state in full if you ever need to recover the retired packages.

## Release Validation

Before publishing plugin changes, run:

```bash
./scripts/validate-marketplace.sh
```

This enforces:
- Plugin manifests exist and resolve for relative-path sources
- `plugin.json` `name` matches each marketplace plugin ID for local plugins
- Non-empty plugin versions
- Remote (github/url/git-subdir/npm) sources have a pinned `version` in the marketplace entry
