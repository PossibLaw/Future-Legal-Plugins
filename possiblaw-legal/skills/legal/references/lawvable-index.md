# Lawvable Skills Index

Local fallback catalog for `https://www.lawvable.com/en`.

**Source status:** active
**Catalog type:** fallback cache for `/possiblaw-legal:legal`
**Last reviewed:** 2026-02-21

## Featured Entries

### nda-review
- **Name:** Non-Disclosure Agreement (NDA) Review
- **Category:** Contract Analysis
- **Summary:** Clause-by-clause NDA review with risk spotting and redline guidance.
- **URL:** https://www.lawvable.com/en

### vendor-due-diligence
- **Name:** Vendor Due Diligence
- **Category:** Compliance
- **Summary:** Structured vendor risk evaluation framework for legal and regulatory review.
- **URL:** https://www.lawvable.com/en

### whistleblower-policy
- **Name:** Whistleblower Policy
- **Category:** Compliance
- **Summary:** Policy drafting and review workflow aligned to applicable reporting frameworks.
- **URL:** https://www.lawvable.com/en

## Cache Usage Rules

- Use this index only as fallback/seed context.
- Prefer live lookup for freshness when available.
- Keep candidate fields normalized to:
  - `id`, `name`, `source`, `description`, `url`, `category`, `match_score`

## Maintenance

- Refresh when `/possiblaw-legal:legal` discovers missing or changed skills.
- Keep summaries short and task-oriented for novice readability.
