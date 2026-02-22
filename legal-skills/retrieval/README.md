# Retrieval Core (`legal-skills/retrieval`)

Reference implementation for unified legal context search used by `/legal`.

## Modules

- `types.mjs` - source enums and schema assertions.
- `normalize.mjs` - source-specific normalization to `ContextRecord`.
- `chunk.mjs` - clause-preserving chunker (500-900 chars, 120 overlap default).
- `vector.mjs` - deterministic local embedding + in-memory vector store.
- `rank.mjs` - hybrid ranking formula:
  - `final = 0.55 * semantic + 0.30 * keyword + 0.15 * source_prior`
- `output.mjs` - prompt-ready evidence pack with citation guardrails.
- `resilience.mjs` - retries, timeouts, circuit breaker, and RPS limiter.
- `adapters/skills.mjs` - Skills source adapter.
- `adapters/contractcodex.mjs` - ContractCodex source adapter.
- `adapters/sec.mjs` - SEC EDGAR adapter (EX-10 focused).
- `pipeline.mjs` - orchestration across selected sources.

## Environment Variables

- `ENABLE_CONTRACTCODEX=true|false`
- `SEC_USER_AGENT="Product/Version (contact@email)"`
- `SEC_RPS=5`
- `FETCH_TIMEOUT_MS=8000`
- `FETCH_RETRIES=2`

## SEC Requirements Applied

- Declared `User-Agent` required for SEC requests.
- Rate limiter defaults to 5 requests/second.
- EX-10 exhibit filtering in adapter for v1 signal quality.

## Quick Example

```js
import { runUnifiedSearch } from "./index.mjs";

const pack = await runUnifiedSearch({
  query: "indemnification limitation of liability",
  sourceScope: "all",
  maxEvidence: 8,
});

console.log(pack.synthesis);
console.log(pack.promptContextBlock);
```

## Runtime Entrypoint

Use the executable runner for CloudCode/Codex wrappers:

```bash
node legal-skills/retrieval/run-search.mjs --query "indemnification clause" --source all
```

JSON output mode:

```bash
node legal-skills/retrieval/run-search.mjs --query "termination for convenience" --source sec --json --pretty
```

Stdin payload mode:

```bash
echo '{"query":"nda confidentiality clause","sourceScope":"contractcodex"}' | node legal-skills/retrieval/run-search.mjs --json
```

Deterministic local/mock mode:

```bash
node legal-skills/retrieval/run-search.mjs --query "liability cap" --mock-data ./mock-data.json --json
```
