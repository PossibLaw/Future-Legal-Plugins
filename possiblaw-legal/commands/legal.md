---
description: Unified legal retrieval for skills guidance, ContractCodex exemplars, and SEC EDGAR exhibits (PossibLaw).
argument-hint: [optional legal task or clause text]
allowed-tools: Read, Glob, Grep, Bash, WebSearch, WebFetch, AskUserQuestion
---

# /possiblaw:legal

Single entrypoint for novice-friendly legal context retrieval.

## Rules

1. Ask the source picker first (even if `$ARGUMENTS` is present): `Skills`, `ContractCodex`, `SEC`, `All`.
2. If no query was provided, ask a source-specific query prompt.
3. Prefer running the local retrieval runtime when available:
   - Use plugin-rooted paths so the command works from any project directory:
     - `bash \"${CLAUDE_PLUGIN_ROOT}/scripts/run-search.sh\" --query \"<query>\" --source <skills|contractcodex|sec|all> --json --pretty`
   - Never pipe the runtime output away (no `| echo ...`). If you need a sentinel, use `||` on failure.
4. If live retrieval fails, continue using local fallback catalogs and clearly mark `mode=degraded`.
5. Never provide legal advice or legal conclusions.

## Output

- If `Skills`: return top 5 skill candidates and ask user to choose one.
- If `ContractCodex`, `SEC`, or `All`: return a prompt-ready evidence pack with citations.

## SEC Workflow

When source is SEC:

1. **Search with previews**: Run search-preview to get results with provision snippets:
   `bash "${CLAUDE_PLUGIN_ROOT}/scripts/run-search.sh" --mode search-preview --query "<query>" --json --pretty`
   Present results as a numbered table with columns: #, Company, Filing, Date, Exhibit, Provision Preview, URL.
   The top 3 results include a ~400-char provision preview extracted from the document.

2. **Load more previews**: If there are more than 3 results, ask:
   "Would you like me to load previews for the next 3 results?"
   If yes, for each of the next 3 URLs run:
   `bash "${CLAUDE_PLUGIN_ROOT}/scripts/run-search.sh" --mode fetch-extract --url "<url>" --extract "<keyword>" --json --pretty`
   The keyword is auto-derived from the query (e.g., "indemnification" from "indemnification clauses AI").
   Append the preview text to the table and ask again if more remain.

3. **Extract full provision**: When the user picks a document to examine in full:
   `bash "${CLAUDE_PLUGIN_ROOT}/scripts/run-search.sh" --mode fetch-extract --url "<url>" --extract "<keyword>" --json --pretty`
   Present the full extracted section text.

4. **Fetch full document** (only if user explicitly requests full text):
   `bash "${CLAUDE_PLUGIN_ROOT}/scripts/run-search.sh" --mode fetch --url "<url>" --json --pretty`

Always end with: "This is a factual excerpt from a publicly filed SEC exhibit. This is not legal advice."

## Requirements

- Requires Node.js to run the local retrieval runtime. If Node is unavailable or the runtime cannot be executed, fall back to `Read`-only retrieval from the local catalogs and mark `mode=degraded`.
