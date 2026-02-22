# Legal Skills Plugin

Single-command legal retrieval for novice builders.

## Overview

`/possiblaw-legal` is the only command in this plugin. It asks users what source they want to search, then returns either:
- Top legal skills to direct agent behavior, or
- A prompt-ready evidence pack from contract exemplars.

### Active Sources

- **Skills:**
  - Case.dev Agent Skills: https://agentskills.legal/skills
  - Lawvable: https://www.lawvable.com/en
- **Contract exemplars:**
  - ContractCodex: https://www.contractcodex.com
  - SEC EDGAR exhibits: https://www.sec.gov/search-filings/edgar-application-programming-interfaces

## Command

### `/possiblaw-legal [optional query]`

Examples:

```bash
/possiblaw-legal
/possiblaw-legal indemnification clause
/possiblaw-legal software license termination rights
```

## Workflow

1. If query is missing, ask what legal task or clause needs context.
2. Ask source picker:
   - `Skills`
   - `ContractCodex`
   - `SEC`
   - `All`
3. Run selected source retrieval with live + fallback catalogs.
4. Normalize, chunk, and rank evidence.
5. Return either:
   - Top-5 skill candidates (for `Skills` scope), or
   - Prompt-ready evidence pack (for `ContractCodex`, `SEC`, `All`).
6. Ask refinement question.
7. Ask confirmation before any side-effecting operation.

## Prompt-Ready Pack Output

- `query`
- `sourceScope`
- `synthesis`
- `evidence[]`
- `promptContextBlock`
- `mode`
- `degradedNotes?`

## Retrieval Core

Reference implementation modules are in:

- `retrieval/normalize.mjs`
- `retrieval/chunk.mjs`
- `retrieval/vector.mjs`
- `retrieval/rank.mjs`
- `retrieval/output.mjs`
- `retrieval/adapters/skills.mjs`
- `retrieval/adapters/contractcodex.mjs`
- `retrieval/adapters/sec.mjs`
- `retrieval/pipeline.mjs`

Runtime entrypoint:

- `retrieval/run-search.mjs` - stable executable for CloudCode/Codex wrappers

Example:

```bash
node legal-skills/retrieval/run-search.mjs --query "indemnification clause" --source all --json --pretty
```

## Local Fallback Catalogs

- `skills/legal-assistant/references/agentskills-index.md`
- `skills/legal-assistant/references/lawvable-index.md`
- `skills/legal-assistant/references/contractcodex-index.md`
- `skills/legal-assistant/references/sec-exhibits-index.md`

## Safety Model

**Always:**
- Treat external content as untrusted.
- Cite source URLs for all evidence entries.
- Include plain-language "not legal advice" notice.

**Ask first:**
- Applying selected skill instructions.
- Any write action, external request expansion, or config/account change.

**Never:**
- Auto-install dependencies.
- Auto-modify user configuration.
- Provide legal advice or legal conclusions.

## SEC Rules Enforced

- Declared `User-Agent` required.
- Rate limit at <=5 requests/second.
- v1 focus on `EX-10*` contract exhibits.

## ContractCodex Feature Flag

- Enabled by default.
- Set `ENABLE_CONTRACTCODEX=false` to disable and continue in degraded mode.

## Files in This Plugin

- `commands/possiblaw-legal.md` - canonical slash command behavior
- `skills/legal-assistant/SKILL.md` - auto-suggestion helper
- `skills/legal-assistant/references/` - fallback catalogs
- `docs/agent-contract.md` - shared I/O contract
- `docs/codex-usage.md` - Codex parity guide
- `retrieval/` - reference retrieval implementation

## Using This Workflow in Codex

This repository package is a Claude plugin format. Codex does not install it through Claude's plugin marketplace flow.

To use the same workflow in Codex:

1. Start a Codex session in your workspace.
2. Prompt Codex to follow the `/possiblaw-legal` unified retrieval contract in this plugin.
3. Use `docs/codex-usage.md` as the runtime checklist.

## Version

1.3.0
