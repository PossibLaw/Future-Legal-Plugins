import { readFile } from "node:fs/promises";
import { runUnifiedSearch } from "./pipeline.mjs";
import { assertContextRecord, normalizeSourceScope } from "./types.mjs";
import { normalizeBySource } from "./normalize.mjs";

const VALID_FORMATS = new Set(["json", "markdown"]);

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
    "  node legal-skills/retrieval/run-search.mjs --query \"indemnification\" --source all --json",
    "",
    "Options:",
    "  --query <text>            Required legal task or clause text",
    "  --source <scope>          skills | contractcodex | sec | all (default: all)",
    "  --max-evidence <n>        Max evidence rows (default: 8, hard max: 12)",
    "  --format <format>         json | markdown (default: markdown)",
    "  --json                    Alias for --format json",
    "  --pretty                  Pretty-print JSON output",
    "  --mock-data <path>        Optional JSON file for deterministic local runs/tests",
    "  --help                    Show this help text",
    "",
    "Stdin JSON mode:",
    "  echo '{\"query\":\"nda clause\",\"sourceScope\":\"all\"}' | node legal-skills/retrieval/run-search.mjs --json",
  ].join("\n");
}

export function parseRuntimeArgs(argv = process.argv.slice(2)) {
  const options = {
    query: undefined,
    sourceScope: "all",
    maxEvidence: 8,
    format: "markdown",
    pretty: false,
    mockDataPath: undefined,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    switch (arg) {
      case "--help":
      case "-h":
        options.help = true;
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
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.sourceScope = normalizeSourceScope(options.sourceScope);
  options.maxEvidence = Math.min(parseInteger(options.maxEvidence, 8), 12);
  options.format = String(options.format || "markdown").toLowerCase();
  if (!VALID_FORMATS.has(options.format)) {
    throw new Error(`Unsupported format: ${options.format}`);
  }

  return options;
}

function coalesceRuntimeInput(cli, payload = {}) {
  const resolved = {
    query: cli.query ?? payload.query,
    sourceScope: normalizeSourceScope(cli.sourceScope ?? payload.sourceScope ?? "all"),
    maxEvidence: Math.min(parseInteger(cli.maxEvidence ?? payload.maxEvidence, 8), 12),
    format: cli.format ?? payload.format ?? "markdown",
    pretty: Boolean(cli.pretty ?? payload.pretty),
    mockDataPath: cli.mockDataPath ?? payload.mockDataPath,
  };

  if (!resolved.query || !String(resolved.query).trim()) {
    throw new Error("Missing required query. Pass --query or provide JSON on stdin with {\"query\": ... }.");
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

export { usageText };
