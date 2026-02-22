# Legal Assistant

Auto-suggests `/possiblaw-legal` as the unified legal retrieval command.

## Description (5%)

Helps legal professionals quickly retrieve better prompt context from Skills, ContractCodex, and SEC EDGAR using one novice-friendly workflow.

## When to Activate

Use this skill when the user:
- Asks for legal workflow help
- Mentions contract review, legal research, drafting, compliance, or discovery
- Needs exemplar clauses/contracts or process skills to guide agent behavior

## Capabilities (30%)

### Discovery
- Detects legal-task intent from conversation context
- Suggests `/possiblaw-legal <task-or-clause>` as the default entrypoint
- Uses source-picker model:
  - `Skills` for how the agent should act
  - `ContractCodex` for exemplar contracts/clauses
  - `SEC` for public-company exemplar exhibits
  - `All` for blended retrieval

### Guidance
- Explains source scope in plain language before retrieval
- Encourages prompt-ready evidence packs with citations
- Keeps user in explicit confirmation flow before any side effects

## Usage Pattern

1. Detect legal task intent.
2. Suggest `/possiblaw-legal` with a concrete query.
3. Let `/possiblaw-legal` ask source picker.
4. If `skills`, present top 5 and ask for selection.
5. If `contractcodex`, `sec`, or `all`, return prompt-ready evidence pack.
6. Ask user whether to refine clause type, source, or company/ticker filters.

## Reference Files (65%)

- `references/lawvable-index.md`
- `references/agentskills-index.md`
- `references/contractcodex-index.md`
- `references/sec-exhibits-index.md`

## Boundaries

**Always:**
- Prefer `/possiblaw-legal` as the single legal command.
- Keep recommendations short and task-specific.
- Provide source attribution for every evidence item.

**Ask first:**
- Applying any selected skill.
- Any operation with side effects.

**Never:**
- Auto-apply skills without confirmation.
- Provide legal advice or legal conclusions.
- Suggest removed legacy legal command surfaces.
