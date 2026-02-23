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
   - `node retrieval/run-search.mjs --query \"<query>\" --source <skills|contractcodex|sec|all> --json --pretty`
4. If live retrieval fails, continue using local fallback catalogs and clearly mark `mode=degraded`.
5. Never provide legal advice or legal conclusions.

## Output

- If `Skills`: return top 5 skill candidates and ask user to choose one.
- If `ContractCodex`, `SEC`, or `All`: return a prompt-ready evidence pack with citations.
