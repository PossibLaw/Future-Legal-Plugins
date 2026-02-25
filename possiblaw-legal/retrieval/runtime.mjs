import { readFile } from "node:fs/promises";
import { runUnifiedSearch } from "./pipeline.mjs";
import { assertContextRecord, normalizeSourceScope } from "./types.mjs";
import { normalizeBySource } from "./normalize.mjs";
import { stripHtml } from "./html.mjs";
import { fetchWithRetry, RpsLimiter } from "./resilience.mjs";
import { loadConfig } from "./config.mjs";
import { createSecAdapter } from "./adapters/sec.mjs";

const VALID_FORMATS = new Set(["json", "markdown"]);
const VALID_MODES = new Set(["search", "search-preview", "fetch", "fetch-extract"]);

function parseInteger(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected positive integer, got: ${value}`);
  }

  return Math.trunc(parsed);
}

async function readStdinText() {
  if (process.stdin.isTTY) {
    return "";
  }

  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8").trim();
}

function usageText() {
  return [
    "Usage:",
    "  node retrieval/run-search.mjs --query \"indemnification\" --source sec --json",
    "",
    "Modes:",
    "  search (default)    Search across sources and return ranked evidence",
    "  search-preview      Search SEC and fetch provision previews for top results",
    "  fetch               Fetch a single SEC EDGAR document by URL",
    "  fetch-extract       Fetch a document and extract sections matching a keyword",
    "",
    "Search options:",
    "  --query <text>            Required legal task or clause text",
    "  --source <scope>          skills | contractcodex | sec | all (default: all)",
    "  --max-evidence <n>        Max evidence rows (default: 8, hard max: 12)",
    "",
    "Search-preview options:",
    "  --mode search-preview     Search SEC and auto-fetch provision previews",
    "  --query <text>            Required legal task or clause text",
    "  --preview-batch <n>       How many results to preview-fetch (default: 3)",
    "  --preview-chars <n>       Max chars for each preview snippet (default: 400)",
    "",
    "Fetch / fetch-extract options:",
    "  --mode <mode>             search | search-preview | fetch | fetch-extract",
    "  --url <edgar-url>         SEC EDGAR document URL (required for fetch modes)",
    "  --extract <keyword>       Keyword to extract sections for (required for fetch-extract)",
    "  --context-chars <n>       Characters of context around keyword (default: 3000)",
    "",
    "Output options:",
    "  --format <format>         json | markdown (default: markdown)",
    "  --json                    Alias for --format json",
    "  --pretty                  Pretty-print JSON output",
    "  --mock-data <path>        Optional JSON file for deterministic local runs/tests",
    "  --help                    Show this help text",
    "",
    "Examples:",
    "  # Search SEC for indemnification clauses",
    "  node retrieval/run-search.mjs --query \"indemnification\" --source sec --json --pretty",
    "",
    "  # Search with provision previews",
    "  node retrieval/run-search.mjs --mode search-preview --query \"indemnification AI\" --json --pretty",
    "",
    "  # Fetch full document text",
    "  node retrieval/run-search.mjs --mode fetch --url \"https://www.sec.gov/Archives/...\" --json --pretty",
    "",
    "  # Extract indemnification sections from a document",
    "  node retrieval/run-search.mjs --mode fetch-extract --url \"https://www.sec.gov/Archives/...\" --extract \"indemnification\" --json --pretty",
    "",
    "Stdin JSON mode:",
    "  echo '{\"query\":\"nda clause\",\"sourceScope\":\"all\"}' | node retrieval/run-search.mjs --json",
  ].join("\n");
}

export function parseRuntimeArgs(argv = process.argv.slice(2)) {
  const options = {
    mode: "search",
    query: undefined,
    sourceScope: "all",
    maxEvidence: 8,
    format: "markdown",
    pretty: false,
    mockDataPath: undefined,
    url: undefined,
    extract: undefined,
    contextChars: 3000,
    previewBatch: 3,
    previewChars: 400,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    switch (arg) {
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--mode":
        options.mode = argv[i + 1];
        i += 1;
        break;
      case "--query":
      case "-q":
        options.query = argv[i + 1];
        i += 1;
        break;
      case "--source":
      case "-s":
        options.sourceScope = argv[i + 1];
        i += 1;
        break;
      case "--max-evidence":
      case "-k":
        options.maxEvidence = argv[i + 1];
        i += 1;
        break;
      case "--format":
      case "-f":
        options.format = argv[i + 1];
        i += 1;
        break;
      case "--json":
        options.format = "json";
        break;
      case "--pretty":
        options.pretty = true;
        break;
      case "--mock-data":
        options.mockDataPath = argv[i + 1];
        i += 1;
        break;
      case "--url":
        options.url = argv[i + 1];
        i += 1;
        break;
      case "--extract":
        options.extract = argv[i + 1];
        i += 1;
        break;
      case "--context-chars":
        options.contextChars = argv[i + 1];
        i += 1;
        break;
      case "--preview-batch":
        options.previewBatch = argv[i + 1];
        i += 1;
        break;
      case "--preview-chars":
        options.previewChars = argv[i + 1];
        i += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.mode = String(options.mode || "search").toLowerCase();
  if (!VALID_MODES.has(options.mode)) {
    throw new Error(`Unsupported mode: ${options.mode}. Use: ${[...VALID_MODES].join(", ")}`);
  }

  if (options.mode === "search") {
    options.sourceScope = normalizeSourceScope(options.sourceScope);
    options.maxEvidence = Math.min(parseInteger(options.maxEvidence, 8), 12);
  }

  options.contextChars = parseInteger(options.contextChars, 3000);
  options.previewBatch = parseInteger(options.previewBatch, 3);
  options.previewChars = parseInteger(options.previewChars, 400);
  options.format = String(options.format || "markdown").toLowerCase();
  if (!VALID_FORMATS.has(options.format)) {
    throw new Error(`Unsupported format: ${options.format}`);
  }

  return options;
}

function coalesceRuntimeInput(cli, payload = {}) {
  const resolved = {
    mode: cli.mode ?? "search",
    query: cli.query ?? payload.query,
    sourceScope: normalizeSourceScope(cli.sourceScope ?? payload.sourceScope ?? "all"),
    maxEvidence: Math.min(parseInteger(cli.maxEvidence ?? payload.maxEvidence, 8), 12),
    format: cli.format ?? payload.format ?? "markdown",
    pretty: Boolean(cli.pretty ?? payload.pretty),
    mockDataPath: cli.mockDataPath ?? payload.mockDataPath,
    url: cli.url ?? payload.url,
    extract: cli.extract ?? payload.extract,
    contextChars: parseInteger(cli.contextChars ?? payload.contextChars, 3000),
    previewBatch: parseInteger(cli.previewBatch ?? payload.previewBatch, 3),
    previewChars: parseInteger(cli.previewChars ?? payload.previewChars, 400),
  };

  if (resolved.mode === "search" || resolved.mode === "search-preview") {
    if (!resolved.query || !String(resolved.query).trim()) {
      throw new Error("Missing required query. Pass --query or provide JSON on stdin with {\"query\": ... }.");
    }
  }

  if (resolved.mode === "fetch" || resolved.mode === "fetch-extract") {
    if (!resolved.url || !String(resolved.url).startsWith("https://")) {
      throw new Error("--url is required for fetch modes and must start with https://");
    }
  }

  if (resolved.mode === "fetch-extract") {
    if (!resolved.extract || !String(resolved.extract).trim()) {
      throw new Error("--extract <keyword> is required for fetch-extract mode.");
    }
  }

  return resolved;
}

async function loadMockDataset(path) {
  const text = await readFile(path, "utf8");
  const payload = JSON.parse(text);
  const supported = ["skills", "contractcodex", "sec"];

  const out = {};
  for (const source of supported) {
    const rows = Array.isArray(payload[source]) ? payload[source] : [];
    out[source] = rows.map((row) => {
      if (row && row.id && row.source && row.title && row.summary && row.snippet && row.url && row.metadata) {
        return assertContextRecord(row);
      }

      return normalizeBySource(source, row || {});
    });
  }

  return out;
}

function createMockAdapters(mockData) {
  return {
    skills: {
      source: "skills",
      async search() {
        return { records: mockData.skills, degradedNotes: [] };
      },
    },
    contractcodex: {
      source: "contractcodex",
      async search() {
        return { records: mockData.contractcodex, degradedNotes: [] };
      },
    },
    sec: {
      source: "sec",
      async search() {
        return { records: mockData.sec, degradedNotes: [] };
      },
    },
  };
}

export function formatPromptPackMarkdown(pack) {
  const lines = [];
  lines.push("What this means");
  lines.push(pack.synthesis);
  lines.push("");
  lines.push("Best evidence");

  if (!pack.evidence.length) {
    lines.push("No evidence found. Try narrowing by clause type or broadening source scope.");
  }

  for (const item of pack.evidence) {
    lines.push(`${item.rank}. [${item.source}] ${item.title}`);
    lines.push(`   Snippet: ${item.snippet}`);
    lines.push(`   Citation: ${item.url}`);
    lines.push(`   Fit: ${item.fitReason}`);
  }

  if (pack.mode === "degraded" && pack.degradedNotes?.length) {
    lines.push("");
    lines.push("Degraded mode notes");
    for (const note of pack.degradedNotes) {
      lines.push(`- ${note}`);
    }
  }

  lines.push("");
  lines.push("Copy/paste context block");
  lines.push("```text");
  lines.push(pack.promptContextBlock);
  lines.push("```");

  return lines.join("\n");
}

export function extractSections(fullText, keyword, contextChars = 3000) {
  const lowerText = fullText.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const sections = [];
  let startFrom = 0;

  while (sections.length < 3) {
    const idx = lowerText.indexOf(lowerKeyword, startFrom);
    if (idx === -1) break;

    // Walk backward to find a section heading
    const headingPattern = /(?:^|\n\n)\s*(?:SECTION|ARTICLE|Section|Article|\d+\.\s|[A-Z][A-Z\s]{4,}(?:\n|$))/;
    let sectionStart = idx;
    const lookback = fullText.slice(Math.max(0, idx - contextChars), idx);
    const headingMatch = lookback.match(/(?:^|\n\n)\s*(?:SECTION|ARTICLE|Section|Article|\d+\.\s|[A-Z][A-Z\s]{4,})(?:\n|[^\n])/);
    if (headingMatch) {
      sectionStart = Math.max(0, idx - contextChars) + headingMatch.index;
    } else {
      // Fall back to double-newline boundary
      const doubleNewline = lookback.lastIndexOf("\n\n");
      if (doubleNewline !== -1) {
        sectionStart = Math.max(0, idx - contextChars) + doubleNewline + 2;
      } else {
        sectionStart = Math.max(0, idx - Math.floor(contextChars / 2));
      }
    }

    // Walk forward to section boundary or contextChars
    let sectionEnd = Math.min(fullText.length, idx + lowerKeyword.length + contextChars);
    const afterKeyword = fullText.slice(idx + lowerKeyword.length, sectionEnd);
    const nextHeading = afterKeyword.search(/\n\n\s*(?:SECTION|ARTICLE|Section|Article|\d+\.\s|[A-Z][A-Z\s]{4,})(?:\n|[^\n])/);
    if (nextHeading !== -1) {
      sectionEnd = idx + lowerKeyword.length + nextHeading;
    }

    const text = fullText.slice(sectionStart, sectionEnd).trim();
    if (text.length > 0) {
      sections.push({
        index: sections.length,
        charCount: text.length,
        text,
      });
    }

    startFrom = sectionEnd;
  }

  return {
    found: sections.length > 0,
    keyword,
    sections,
  };
}

async function runFetchMode(resolved) {
  const config = loadConfig();
  const limiter = new RpsLimiter(config.secRps);
  await limiter.waitTurn();

  const response = await fetchWithRetry(
    resolved.url,
    { headers: { "User-Agent": config.secUserAgent, Accept: "text/html,*/*" } },
    { timeoutMs: 15000 }
  );
  const body = await response.text();
  const text = stripHtml(body);

  const result = { url: resolved.url, charCount: text.length, text };

  if (resolved.format === "json") {
    return {
      exitCode: 0,
      output: JSON.stringify(result, null, resolved.pretty ? 2 : 0),
      format: "json",
      data: result,
    };
  }

  return {
    exitCode: 0,
    output: `Document: ${resolved.url}\nLength: ${text.length} characters\n\n${text}`,
    format: "markdown",
    data: result,
  };
}

async function runFetchExtractMode(resolved) {
  const config = loadConfig();
  const limiter = new RpsLimiter(config.secRps);
  await limiter.waitTurn();

  const response = await fetchWithRetry(
    resolved.url,
    { headers: { "User-Agent": config.secUserAgent, Accept: "text/html,*/*" } },
    { timeoutMs: 15000 }
  );
  const body = await response.text();
  const fullText = stripHtml(body);
  const extracted = extractSections(fullText, resolved.extract, resolved.contextChars);

  const result = { url: resolved.url, ...extracted };

  if (resolved.format === "json") {
    return {
      exitCode: 0,
      output: JSON.stringify(result, null, resolved.pretty ? 2 : 0),
      format: "json",
      data: result,
    };
  }

  if (!extracted.found) {
    return {
      exitCode: 0,
      output: `No sections containing "${resolved.extract}" found in ${resolved.url}`,
      format: "markdown",
      data: result,
    };
  }

  const lines = [`Extracted "${resolved.extract}" from: ${resolved.url}`, ""];
  for (const section of extracted.sections) {
    lines.push(`--- Section ${section.index + 1} (${section.charCount} chars) ---`);
    lines.push(section.text);
    lines.push("");
  }
  lines.push("This is a factual excerpt from a publicly filed SEC exhibit. This is not legal advice.");

  return {
    exitCode: 0,
    output: lines.join("\n"),
    format: "markdown",
    data: result,
  };
}

const LEGAL_STOPWORDS = new Set([
  "clause", "clauses", "provision", "provisions", "professional", "services",
  "agreement", "agreements", "contract", "contracts", "section", "sections",
  "article", "articles", "terms", "conditions", "obligations", "rights",
  "the", "a", "an", "in", "of", "for", "and", "or", "with", "to", "from",
]);

export function deriveKeyword(query) {
  const words = String(query || "")
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean)
    .filter((w) => !LEGAL_STOPWORDS.has(w));

  return words[0] || String(query || "").trim().split(/\s+/)[0] || "";
}

async function runSearchPreviewMode(resolved) {
  const config = loadConfig();
  const adapter = createSecAdapter({
    userAgent: config.secUserAgent,
    rps: config.secRps,
  });

  const searchResult = await adapter.search(resolved.query, {
    retries: config.fetchRetries,
    timeoutMs: config.fetchTimeoutMs,
  });

  const keyword = deriveKeyword(resolved.query);
  const records = searchResult.records;
  const previewBatch = resolved.previewBatch;
  const previewChars = resolved.previewChars;

  const enriched = [];
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    let preview = null;
    let previewKeyword = keyword;

    if (i < previewBatch && keyword) {
      try {
        const text = await adapter.fetchDocumentText(record.url, {
          timeoutMs: config.fetchTimeoutMs,
        });
        const extracted = extractSections(text, keyword, previewChars);
        if (extracted.found && extracted.sections.length > 0) {
          const section = extracted.sections[0].text;
          preview = section.length > previewChars
            ? section.slice(0, previewChars) + "..."
            : section;
        }
      } catch {
        // Preview fetch failed — leave preview null
      }
    }

    enriched.push({
      rank: i + 1,
      source: record.source,
      title: record.title,
      snippet: record.snippet,
      url: record.url,
      preview,
      previewKeyword,
      metadata: record.metadata,
    });
  }

  const result = {
    query: resolved.query,
    keyword,
    previewBatch,
    totalResults: records.length,
    results: enriched,
    degradedNotes: searchResult.degradedNotes || [],
  };

  if (resolved.format === "json") {
    return {
      exitCode: 0,
      output: JSON.stringify(result, null, resolved.pretty ? 2 : 0),
      format: "json",
      data: result,
    };
  }

  const lines = [
    `SEC EDGAR results for "${resolved.query}" (keyword: "${keyword}")`,
    `Showing previews for top ${Math.min(previewBatch, records.length)} of ${records.length} results.`,
    "",
  ];

  for (const item of enriched) {
    const meta = item.metadata || {};
    lines.push(`${item.rank}. ${meta.company || item.title}`);
    lines.push(`   Filing: ${meta.formType || "N/A"} | Date: ${meta.filingDate || "N/A"} | Exhibit: ${meta.exhibitType || "N/A"}`);
    lines.push(`   URL: ${item.url}`);
    if (item.preview) {
      lines.push(`   Preview: ${item.preview}`);
    } else if (item.rank <= previewBatch) {
      lines.push(`   Preview: No matching "${keyword}" section found in document.`);
    } else {
      lines.push(`   Preview: Not yet loaded. Ask to load more previews.`);
    }
    lines.push("");
  }

  lines.push("This is a factual excerpt from a publicly filed SEC exhibit. This is not legal advice.");

  return {
    exitCode: 0,
    output: lines.join("\n"),
    format: "markdown",
    data: result,
  };
}

export async function runRuntime(argv = process.argv.slice(2), stdinText) {
  const cli = parseRuntimeArgs(argv);
  if (cli.help) {
    return {
      exitCode: 0,
      output: usageText(),
      format: "text",
    };
  }

  const inputText = stdinText !== undefined ? String(stdinText).trim() : await readStdinText();
  let stdinPayload = {};

  if (inputText) {
    try {
      stdinPayload = JSON.parse(inputText);
    } catch (error) {
      throw new Error(`Failed to parse stdin JSON: ${error.message}`);
    }
  }

  const resolved = coalesceRuntimeInput(cli, stdinPayload);

  if (resolved.mode === "fetch") {
    return runFetchMode(resolved);
  }

  if (resolved.mode === "fetch-extract") {
    return runFetchExtractMode(resolved);
  }

  if (resolved.mode === "search-preview") {
    return runSearchPreviewMode(resolved);
  }

  // Default: search mode
  const searchOptions = {
    query: resolved.query,
    sourceScope: resolved.sourceScope,
    maxEvidence: resolved.maxEvidence,
  };

  if (resolved.mockDataPath) {
    const dataset = await loadMockDataset(resolved.mockDataPath);
    searchOptions.adapters = createMockAdapters(dataset);
  }

  const pack = await runUnifiedSearch(searchOptions);
  if (resolved.format === "json") {
    return {
      exitCode: 0,
      output: JSON.stringify(pack, null, resolved.pretty ? 2 : 0),
      format: "json",
      data: pack,
    };
  }

  return {
    exitCode: 0,
    output: formatPromptPackMarkdown(pack),
    format: "markdown",
    data: pack,
  };
}

export { usageText, LEGAL_STOPWORDS };
