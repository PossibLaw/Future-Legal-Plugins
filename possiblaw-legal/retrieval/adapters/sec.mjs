import { readFile } from "node:fs/promises";
import { normalizeSecEntry } from "../normalize.mjs";
import { fetchWithRetry, RpsLimiter } from "../resilience.mjs";
import { resolvePluginPath } from "../paths.mjs";
import { stripHtml } from "../html.mjs";

const SEC_TICKER_URL = "https://www.sec.gov/files/company_tickers.json";
const SEC_SUBMISSIONS_URL = "https://data.sec.gov/submissions";
const SEC_ARCHIVES_URL = "https://data.sec.gov/Archives/edgar/data";
const SEC_EFTS_URL = "https://efts.sec.gov/LATEST/search-index";

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
  const userAgent = options.userAgent || "PossibLawLegalSkills/1.3.2 (contact: support@possiblaw.com)";
  const rps = options.rps ?? 5;
  const limiter = new RpsLimiter(rps);
  const fallbackPath =
    options.fallbackPath ?? resolvePluginPath("skills", "legal", "references", "sec-exhibits-index.md");

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

  function buildEftsDocUrl(hit) {
    const s = hit._source;
    const cik = String(s.ciks?.[0] || "").replace(/^0+/, "");
    const accessionNoDashes = String(s.adsh || "").replace(/-/g, "");
    const filename = String(hit._id || "").split(":")[1] || "";
    if (!cik || !accessionNoDashes || !filename) {
      return null;
    }
    return `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}/${filename}`;
  }

  function parseEftsDisplayName(displayName) {
    const match = String(displayName || "").match(/^(.+?)\s*\(([^)]+)\)/);
    if (match) {
      return { company: match[1].trim(), ticker: match[2].split(",")[0].trim() };
    }
    return { company: String(displayName || "Public company").trim(), ticker: "" };
  }

  async function loadEftsSearch(query, controls = {}) {
    if (!fetcher) {
      return [];
    }

    const params = new URLSearchParams({ q: query });
    if (controls.startdt) {
      params.set("dateRange", "custom");
      params.set("startdt", controls.startdt);
      params.set("enddt", controls.enddt || new Date().toISOString().slice(0, 10));
    }

    const url = `${SEC_EFTS_URL}?${params}`;
    const response = await secFetch(url, controls);
    const payload = await response.json();
    const hits = payload?.hits?.hits || [];
    const maxResults = controls.maxEftsResults ?? 10;

    const records = [];
    for (const hit of hits.slice(0, maxResults)) {
      const s = hit._source;
      if (!s) continue;

      const docUrl = buildEftsDocUrl(hit);
      if (!docUrl) continue;

      const fileType = String(s.file_type || "");
      if (!/^EX-10/i.test(fileType)) continue;

      const { company, ticker } = parseEftsDisplayName(s.display_names?.[0]);
      const fileDesc = String(s.file_description || fileType);

      records.push(
        normalizeSecEntry({
          company,
          title: `${ticker || company} ${fileDesc}`.trim(),
          summary: `${company} — ${s.form || ""} filing (${s.file_date || "unknown date"}). Exhibit: ${fileType}.`,
          snippet: `${company} — ${s.form || ""} filing (${s.file_date || "unknown date"}). Exhibit: ${fileType}. Use fetch-extract to retrieve provision text.`,
          url: docUrl,
          formType: s.form || "",
          exhibitType: fileType,
          filingDate: s.file_date || "",
          tags: [ticker, s.form, "efts"].filter(Boolean),
        })
      );
    }

    return records;
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

  async function fetchDocumentText(url, controls = {}) {
    const response = await secFetch(url, controls);
    const body = await response.text();
    return stripHtml(body);
  }

  return {
    source: "sec",
    secFetch,
    fetchDocumentText,
    async search(query, controls = {}) {
      const notes = [];
      const fallback = await loadFallback(query);
      let live = [];

      // Try EFTS full-text search first (topic-based)
      try {
        live = await loadEftsSearch(query, controls);
      } catch (error) {
        notes.push(`SEC EFTS search unavailable: ${error.message}`);
      }

      // Fall back to ticker-based search if EFTS returned no EX-10 results
      if (!live.length) {
        try {
          live = await loadLive(query, controls);
        } catch (error) {
          notes.push(`SEC EDGAR ticker lookup unavailable: ${error.message}`);
        }
      }

      return {
        records: [...live, ...fallback],
        degradedNotes: notes,
      };
    },
  };
}
