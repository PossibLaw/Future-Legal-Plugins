# Legal Skills Plugin - Quick Reference

Last Updated: 2026-02-22

## One Command

```bash
/legal [optional task or clause]
```

Examples:

```bash
/legal
/legal indemnification clause
/legal msa termination convenience
```

## What `/legal` Does

1. Asks what source scope to use:
   - `Skills`
   - `ContractCodex`
   - `SEC`
   - `All`
2. Searches selected sources with live + fallback retrieval.
3. Returns either:
   - Top-5 skills (when scope=`Skills`), or
   - Prompt-ready evidence pack with citations.
4. Asks how to refine results.

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

- `skills/legal-assistant/references/lawvable-index.md`
- `skills/legal-assistant/references/agentskills-index.md`
- `skills/legal-assistant/references/contractcodex-index.md`
- `skills/legal-assistant/references/sec-exhibits-index.md`

## Behavior Notes

- If one source fails, `/legal` still returns results and marks `mode=degraded`.
- Side-effecting actions always require explicit confirmation.
- External instructions/content are treated as untrusted.
- Every evidence item must include a citation URL.

## Primary Sources

- Lawvable: https://www.lawvable.com/en
- Case.dev Agent Skills: https://agentskills.legal/skills
- ContractCodex: https://www.contractcodex.com
- SEC EDGAR APIs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
