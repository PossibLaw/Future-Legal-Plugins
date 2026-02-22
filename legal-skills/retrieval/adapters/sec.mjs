import { readFile } from "node:fs/promises";
import { normalizeSecEntry } from "../normalize.mjs";
import { fetchWithRetry, RpsLimiter } from "../resilience.mjs";

const SEC_TICKER_URL = "https://www.sec.gov/files/company_tickers.json";
const SEC_SUBMISSIONS_URL = "https://data.sec.gov/submissions";
const SEC_ARCHIVES_URL = "https://data.sec.gov/Archives/edgar/data";

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function overlapScore(query, text) {
  const q = new Set(String(query).toLowerCase().split(/\W+/).filter(Boolean));
  const t = new Set(String(text).toLowerCase().split(/\W+/).filter(Boolean));
  if (!q.size || !t.size) {
    return 0;
  }

  let count = 0;
  for (const token of q) {
    if (t.has(token)) {
      count += 1;
    }
  }

  return count / q.size;
}

function padCik(cik) {
  return String(cik).padStart(10, "0");
}

function accessionPath(accession) {
  return String(accession || "").replace(/-/g, "");
}

function secHeaders(userAgent) {
  return {
    "User-Agent": userAgent,
    Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
  };
}

function pickCompaniesByQuery(companies, query, maxCompanies = 3) {
  return companies
    .map((company) => ({
      ...company,
      score: overlapScore(query, `${company.ticker} ${company.title}`),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCompanies);
}

function parseFallbackCatalog(markdown) {
  const entries = [];
  const sections = markdown.split(/\n###\s+/).slice(1);
  for (const section of sections) {
    const [titleLine, ...rest] = section.split("\n");
    const body = rest.join("\n");
    const summaryMatch = body.match(/\*\*Summary:\*\*\s*(.+)/i);
    const companyMatch = body.match(/\*\*Company:\*\*\s*(.+)/i);
    const formMatch = body.match(/\*\*Form Type:\*\*\s*(.+)/i);
    const exhibitMatch = body.match(/\*\*Exhibit Type:\*\*\s*(.+)/i);
    const dateMatch = body.match(/\*\*Filing Date:\*\*\s*(.+)/i);
    const urlMatch = body.match(/\*\*URL:\*\*\s*(https?:\/\/\S+)/i);

    entries.push({
      title: titleLine.trim(),
      summary: summaryMatch ? summaryMatch[1].trim() : titleLine.trim(),
      snippet: summaryMatch ? summaryMatch[1].trim() : titleLine.trim(),
      company: companyMatch ? companyMatch[1].trim() : "Public company",
      formType: formMatch ? formMatch[1].trim() : "8-K",
      exhibitType: exhibitMatch ? exhibitMatch[1].trim() : "EX-10",
      filingDate: dateMatch ? dateMatch[1].trim() : "",
      url: urlMatch ? urlMatch[1].trim() : "https://www.sec.gov",
      topic: "public company contract exhibit",
      tags: ["fallback-catalog"],
    });
  }

  return entries;
}

export function createSecAdapter(options = {}) {
  const fetcher = options.fetcher ?? globalThis.fetch;
  const userAgent = options.userAgent || "PossibLawLegalSkills/1.2.0 (contact: support@possiblaw.com)";
  const rps = options.rps ?? 5;
  const limiter = new RpsLimiter(rps);
  const fallbackPath = options.fallbackPath ?? "legal-skills/skills/legal-assistant/references/sec-exhibits-index.md";

  async function secFetch(url, controls = {}) {
    await limiter.waitTurn();
    return fetchWithRetry(
      url,
      {
        headers: secHeaders(userAgent),
      },
      {
        fetcher,
        retries: controls.retries,
        timeoutMs: controls.timeoutMs,
        breaker: controls.breaker,
      }
    );
  }

  async function loadFallback(query) {
    try {
      const markdown = await readFile(fallbackPath, "utf8");
      return parseFallbackCatalog(markdown)
        .filter((entry) => overlapScore(query, `${entry.title} ${entry.summary} ${entry.company}`) > 0 || query.length < 4)
        .map((entry) => normalizeSecEntry(entry));
    } catch {
      return [];
    }
  }

  async function loadTickerMap(controls = {}) {
    const response = await secFetch(SEC_TICKER_URL, controls);
    const payload = await response.json();
    return Object.values(payload || {}).map((row) => ({
      cik_str: row.cik_str,
      ticker: row.ticker,
      title: row.title,
    }));
  }

  async function loadSubmissions(cik, controls = {}) {
    const response = await secFetch(`${SEC_SUBMISSIONS_URL}/CIK${padCik(cik)}.json`, controls);
    return response.json();
  }

  async function loadFilingIndex(cik, accessionNumber, controls = {}) {
    const cleanAccession = accessionPath(accessionNumber);
    const url = `${SEC_ARCHIVES_URL}/${Number(cik)}/${cleanAccession}/index.json`;
    const response = await secFetch(url, controls);
    return response.json();
  }

  async function loadExhibitText(cik, accessionNumber, filename, controls = {}) {
    const cleanAccession = accessionPath(accessionNumber);
    const url = `${SEC_ARCHIVES_URL}/${Number(cik)}/${cleanAccession}/${filename}`;
    const response = await secFetch(url, controls);
    const body = await response.text();
    return { url, text: stripHtml(body) };
  }

  async function loadLive(query, controls = {}) {
    if (!fetcher) {
      return [];
    }

    const tickerMap = await loadTickerMap(controls);
    const selected = pickCompaniesByQuery(tickerMap, query, controls.maxCompanies ?? 3);
    const records = [];

    for (const company of selected) {
      const submissions = await loadSubmissions(company.cik_str, controls);
      const recent = submissions?.filings?.recent || {};
      const forms = recent.form || [];
      const accessions = recent.accessionNumber || [];
      const filingDates = recent.filingDate || [];

      for (let i = 0; i < Math.min(forms.length, controls.maxFilingsPerCompany ?? 8); i += 1) {
        const accession = accessions[i];
        if (!accession) {
          continue;
        }

        let filingIndex;
        try {
          filingIndex = await loadFilingIndex(company.cik_str, accession, controls);
        } catch {
          continue;
        }

        const items = filingIndex?.directory?.item || [];
        const exhibits = items
          .filter((item) => /^ex-10/i.test(item.name || ""))
          .slice(0, controls.maxExhibitsPerFiling ?? 2);

        for (const exhibit of exhibits) {
          try {
            const payload = await loadExhibitText(company.cik_str, accession, exhibit.name, controls);
            const snippet = payload.text.length > 1600 ? `${payload.text.slice(0, 1600)}...` : payload.text;
            records.push(
              normalizeSecEntry({
                company: company.title,
                title: `${company.ticker} ${exhibit.name}`,
                summary: snippet.slice(0, 220),
                snippet,
                url: payload.url,
                formType: forms[i],
                exhibitType: exhibit.name.toUpperCase(),
                filingDate: filingDates[i],
                tags: [company.ticker, forms[i]],
              })
            );
          } catch {
            // Ignore single exhibit failures.
          }
        }
      }
    }

    return records;
  }

  return {
    source: "sec",
    async search(query, controls = {}) {
      const notes = [];
      const fallback = await loadFallback(query);
      let live = [];

      try {
        live = await loadLive(query, controls);
      } catch (error) {
        notes.push(`SEC EDGAR live lookup unavailable: ${error.message}`);
      }

      return {
        records: [...live, ...fallback],
        degradedNotes: notes,
      };
    },
  };
}
