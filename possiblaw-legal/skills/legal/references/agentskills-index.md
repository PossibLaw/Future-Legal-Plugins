# Case.dev Agent Skills Index

Local fallback catalog for `https://agentskills.legal/skills`.

**Source status:** active
**Catalog type:** fallback cache for `/possiblaw-legal:legal`
**Last reviewed:** 2026-02-21

## Endpoint Contract for Live Lookup

- Search endpoint: `https://api.case.dev/skills/resolve?q=<url-encoded-query>`
- Detail endpoint: `https://api.case.dev/skills/{slug}`
- Markdown fallback: `https://agentskills.legal/skills/{slug}.md`

## Parsing Notes

- Search responses include a `results` list with candidate skills and slugs for retrieval.
- Detail responses for `/{slug}` include full skill content plus metadata such as legal context.
- `/possiblaw-legal:legal` should normalize API output into the plugin candidate model and degrade gracefully to markdown fallback.

## Seed Categories

### contract-review
- **Category:** Contract Analysis
- **Expected intent:** Analyze clauses, obligations, and risk terms in agreements.

### legal-research
- **Category:** Legal Research
- **Expected intent:** Retrieve relevant authorities and reasoning patterns for a legal issue.

### compliance-checklist
- **Category:** Compliance
- **Expected intent:** Build or run requirement checklists for regulated workflows.

### discovery-analysis
- **Category:** Discovery
- **Expected intent:** Organize and analyze document sets for investigation and litigation support.

## Cache Usage Rules

- Use as fallback and ranking seed, not as final truth.
- Prefer live data before selection whenever possible.
- Mark cache-derived results clearly in `/possiblaw-legal:legal` output when live calls fail.
