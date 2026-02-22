import { readFile } from "node:fs/promises";
import { normalizeSkillsCandidate } from "../normalize.mjs";
import { fetchWithRetry } from "../resilience.mjs";

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

function parseHeadingFallback(markdown, sourceName) {
  const rows = [];
  const sections = markdown.split(/\n###\s+/).slice(1);
  for (const section of sections) {
    const [slugLine, ...rest] = section.split("\n");
    const slug = slugLine.trim();
    const body = rest.join("\n");

    const nameMatch = body.match(/\*\*Name:\*\*\s*(.+)/i);
    const categoryMatch = body.match(/\*\*Category:\*\*\s*(.+)/i);
    const summaryMatch = body.match(/\*\*Summary:\*\*\s*(.+)/i) || body.match(/\*\*Expected intent:\*\*\s*(.+)/i);
    const urlMatch = body.match(/\*\*URL:\*\*\s*(https?:\/\/\S+)/i);

    rows.push({
      slug,
      name: nameMatch ? nameMatch[1].trim() : slug.replace(/-/g, " "),
      summary: summaryMatch ? summaryMatch[1].trim() : `${slug.replace(/-/g, " ")} (${sourceName} fallback)`,
      category: categoryMatch ? categoryMatch[1].trim() : "Legal",
      url: urlMatch ? urlMatch[1].trim() : sourceName === "Lawvable" ? "https://www.lawvable.com/en" : `https://agentskills.legal/skills/${slug}`,
      tags: ["fallback-catalog"],
    });
  }

  return rows;
}

export function createSkillsAdapter(options = {}) {
  const fetcher = options.fetcher ?? globalThis.fetch;
  const catalogPaths = options.catalogPaths ?? [
    "legal-skills/skills/legal-assistant/references/agentskills-index.md",
    "legal-skills/skills/legal-assistant/references/lawvable-index.md",
  ];

  async function loadFallbackRecords(query) {
    const records = [];
    for (const path of catalogPaths) {
      try {
        const content = await readFile(path, "utf8");
        const sourceName = path.includes("lawvable") ? "Lawvable" : "Case.dev Agent Skills";
        const parsed = parseHeadingFallback(content, sourceName)
          .map((entry) => ({ ...entry, source: "skills" }))
          .filter((entry) => overlapScore(query, `${entry.name} ${entry.summary} ${entry.category}`) > 0 || query.length < 4)
          .map((entry) => normalizeSkillsCandidate(entry));

        records.push(...parsed);
      } catch {
        // Ignore missing fallback files.
      }
    }

    return records;
  }

  async function loadLiveAgentSkills(query, controls = {}) {
    if (!fetcher) {
      return [];
    }

    const url = `https://api.case.dev/skills/resolve?q=${encodeURIComponent(query)}`;
    const response = await fetchWithRetry(url, {}, {
      fetcher,
      retries: controls.retries,
      timeoutMs: controls.timeoutMs,
      breaker: controls.breaker,
    });

    const data = await response.json();
    const rows = Array.isArray(data.results) ? data.results : [];
    return rows.map((row) =>
      normalizeSkillsCandidate({
        slug: row.slug,
        name: row.name,
        summary: row.summary,
        category: row.legal_context?.practice_areas?.[0],
        tags: row.tags,
        url: row.slug ? `https://agentskills.legal/skills/${row.slug}` : undefined,
      })
    );
  }

  return {
    source: "skills",
    async search(query, controls = {}) {
      const notes = [];
      const fallback = await loadFallbackRecords(query);
      let live = [];

      try {
        live = await loadLiveAgentSkills(query, controls);
      } catch (error) {
        notes.push(`Skills live API unavailable: ${error.message}`);
      }

      const merged = [...live, ...fallback];
      const deduped = [];
      const seen = new Set();
      for (const record of merged) {
        const key = `${record.title.toLowerCase()}|${record.url}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(record);
        }
      }

      return {
        records: deduped,
        degradedNotes: notes,
      };
    },
  };
}
