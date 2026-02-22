import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { normalizeContractCodexEntry } from "../normalize.mjs";
import { fetchWithRetry } from "../resilience.mjs";

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

function parseUrlsFromSiteMap(markdown) {
  return Array.from(new Set((String(markdown).match(/https:\/\/www\.contractcodex\.com\/[^\s)"']+/g) || [])));
}

function parseContractCodexPage(html, url) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const text = stripHtml(html);
  const snippet = text.length > 1400 ? `${text.slice(0, 1400)}...` : text;

  return {
    title: headingMatch ? stripHtml(headingMatch[1]) : titleMatch ? stripHtml(titleMatch[1]) : "ContractCodex Exemplar",
    summary: snippet.slice(0, 220),
    snippet,
    url,
    topic: "contract exemplar",
  };
}

function parseFallbackCatalog(markdown) {
  const entries = [];
  const sections = markdown.split(/\n###\s+/).slice(1);
  for (const section of sections) {
    const [titleLine, ...rest] = section.split("\n");
    const body = rest.join("\n");
    const summaryMatch = body.match(/\*\*Summary:\*\*\s*(.+)/i);
    const urlMatch = body.match(/\*\*URL:\*\*\s*(https?:\/\/\S+)/i);
    entries.push({
      title: titleLine.trim(),
      summary: summaryMatch ? summaryMatch[1].trim() : titleLine.trim(),
      snippet: summaryMatch ? summaryMatch[1].trim() : titleLine.trim(),
      url: urlMatch ? urlMatch[1].trim() : "https://www.contractcodex.com",
      topic: "contract exemplar",
      tags: ["fallback-catalog"],
    });
  }

  return entries;
}

function dedupe(records) {
  const deduped = [];
  const seen = new Set();
  for (const record of records) {
    const key = `${record.url}|${createHash("sha1").update(record.snippet).digest("hex").slice(0, 12)}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(record);
    }
  }

  return deduped;
}

export function createContractCodexAdapter(options = {}) {
  const fetcher = options.fetcher ?? globalThis.fetch;
  const enabled = options.enabled ?? true;
  const fallbackPath =
    options.fallbackPath ?? "legal-skills/skills/legal-assistant/references/contractcodex-index.md";

  async function loadFallback(query) {
    try {
      const markdown = await readFile(fallbackPath, "utf8");
      return parseFallbackCatalog(markdown)
        .filter((entry) => overlapScore(query, `${entry.title} ${entry.summary}`) > 0 || query.length < 4)
        .map((entry) => normalizeContractCodexEntry(entry));
    } catch {
      return [];
    }
  }

  async function loadLive(query, controls) {
    if (!fetcher) {
      return [];
    }

    const siteMapResponse = await fetchWithRetry("https://www.contractcodex.com/site-map", {}, {
      fetcher,
      retries: controls.retries,
      timeoutMs: controls.timeoutMs,
      breaker: controls.breaker,
    });
    const siteMapText = await siteMapResponse.text();
    const allUrls = parseUrlsFromSiteMap(siteMapText);

    const candidateUrls = allUrls
      .filter((url) => overlapScore(query, decodeURIComponent(url).replace(/[\/-]/g, " ")) > 0)
      .slice(0, 8);

    const records = [];
    for (const url of candidateUrls) {
      const response = await fetchWithRetry(url, {}, {
        fetcher,
        retries: controls.retries,
        timeoutMs: controls.timeoutMs,
        breaker: controls.breaker,
      });
      const html = await response.text();
      records.push(normalizeContractCodexEntry(parseContractCodexPage(html, url)));
    }

    return records;
  }

  return {
    source: "contractcodex",
    async search(query, controls = {}) {
      if (!enabled) {
        return {
          records: [],
          degradedNotes: ["ContractCodex source disabled by ENABLE_CONTRACTCODEX=false."],
        };
      }

      const notes = [];
      const fallback = await loadFallback(query);
      let live = [];

      try {
        live = await loadLive(query, controls);
      } catch (error) {
        notes.push(`ContractCodex live lookup unavailable: ${error.message}`);
      }

      return {
        records: dedupe([...live, ...fallback]),
        degradedNotes: notes,
      };
    },
  };
}
