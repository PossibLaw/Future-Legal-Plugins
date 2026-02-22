# SEC EX-10 Exhibits Index

Local fallback catalog for SEC EDGAR contract exhibit retrieval.

**Source status:** active
**Catalog type:** fallback cache for `/legal`
**Last reviewed:** 2026-02-22

## Featured Entries

### ex10-commercial-agreement
- **Company:** Example Public Co.
- **Form Type:** 8-K
- **Exhibit Type:** EX-10.1
- **Filing Date:** 2025-01-14
- **Summary:** Commercial agreement exhibit sample showing indemnification and liability cap interplay.
- **URL:** https://www.sec.gov

### ex10-employment-agreement
- **Company:** Example Public Co.
- **Form Type:** 10-Q
- **Exhibit Type:** EX-10.2
- **Filing Date:** 2025-04-30
- **Summary:** Executive employment agreement exhibit sample with termination and severance provisions.
- **URL:** https://www.sec.gov

### ex10-license-agreement
- **Company:** Example Public Co.
- **Form Type:** 10-K
- **Exhibit Type:** EX-10.3
- **Filing Date:** 2025-02-25
- **Summary:** License agreement exhibit sample with IP ownership and confidentiality obligations.
- **URL:** https://www.sec.gov

## Cache Usage Rules

- Use as fallback when live SEC calls fail.
- Prioritize EX-10* exhibits for contract context in v1.
- Ensure each entry includes company, form type, exhibit type, date, and citation URL.
