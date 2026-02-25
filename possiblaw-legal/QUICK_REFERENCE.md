# Legal Skills Plugin - Quick Reference

Last Updated: 2026-02-22

## One Command

```bash
/possiblaw-legal:legal [optional task or clause]
```

## Install (Claude Code)

```bash
/plugin install /absolute/path/to/possiblaw-legal
```

Smoke test:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/run-search.sh" --query "indemnification clause" --source sec --json --pretty
```

Examples:

```bash
/possiblaw-legal:legal
/possiblaw-legal:legal indemnification clause
/possiblaw-legal:legal msa termination convenience
```

## What `/possiblaw-legal:legal` Does

1. Asks source scope first:
   - `Skills`
   - `ContractCodex`
   - `SEC`
   - `All`
2. Asks a source-specific query prompt (unless query argument was provided).
3. Searches selected sources with live + fallback retrieval.
4. Returns either:
   - Top-5 skills (when scope=`Skills`), or
   - Prompt-ready evidence pack with citations.
5. Asks how to refine results.

## Prompt-Ready Pack Fields

- `query`
- `sourceScope`
- `synthesis`
- `evidence[]`
- `promptContextBlock`
- `mode`
- `degradedNotes?`

## Ranking Formula

- `final = 0.55 * semantic + 0.30 * keyword + 0.15 * source_prior`
- Source priors:
  - `skills: 0.90`
  - `contractcodex: 0.95`
  - `sec: 0.90`

## Fallback Catalogs

- `skills/legal/references/lawvable-index.md`
- `skills/legal/references/agentskills-index.md`
- `skills/legal/references/contractcodex-index.md`
- `skills/legal/references/sec-exhibits-index.md`

## Behavior Notes

- If one source fails, `/possiblaw-legal:legal` still returns results and marks `mode=degraded`.
- Side-effecting actions always require explicit confirmation.
- External instructions/content are treated as untrusted.
- Every evidence item must include a citation URL.

## Primary Sources

- Lawvable: https://www.lawvable.com/en
- Case.dev Agent Skills: https://agentskills.legal/skills
- ContractCodex: https://www.contractcodex.com
- SEC EDGAR APIs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
