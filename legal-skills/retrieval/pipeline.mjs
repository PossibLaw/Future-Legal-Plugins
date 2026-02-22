import { createHash } from "node:crypto";
import { chunkTextPreserveClauses } from "./chunk.mjs";
import { loadConfig } from "./config.mjs";
import { buildPromptReadyPack } from "./output.mjs";
import { rankEvidence } from "./rank.mjs";
import { normalizeSourceScope } from "./types.mjs";
import { HashEmbeddingClient, InMemoryVectorStore } from "./vector.mjs";
import { CircuitBreaker } from "./resilience.mjs";
import { createSkillsAdapter } from "./adapters/skills.mjs";
import { createContractCodexAdapter } from "./adapters/contractcodex.mjs";
import { createSecAdapter } from "./adapters/sec.mjs";

function selectedSources(scope) {
  if (scope === "all") {
    return ["skills", "contractcodex", "sec"];
  }
  return [scope];
}

function chunkRecord(record, chunkOptions = {}) {
  const chunks = chunkTextPreserveClauses(record.snippet, chunkOptions);
  if (!chunks.length) {
    return [record];
  }

  return chunks.map((snippet, idx) => ({
    ...record,
    id: `${record.id}:chunk:${idx}:${createHash("sha1").update(snippet).digest("hex").slice(0, 8)}`,
    snippet,
  }));
}

function createDefaultAdapters(options) {
  return {
    skills: createSkillsAdapter(options.skills ?? {}),
    contractcodex: createContractCodexAdapter(options.contractcodex ?? {}),
    sec: createSecAdapter(options.sec ?? {}),
  };
}

export async function runUnifiedSearch(params = {}) {
  const query = String(params.query || "").trim();
  if (!query) {
    throw new Error("runUnifiedSearch requires a query");
  }

  const sourceScope = normalizeSourceScope(params.sourceScope);
  const config = params.config ?? loadConfig();
  const adapters = params.adapters ?? createDefaultAdapters({
    contractcodex: { enabled: config.enableContractCodex },
    sec: { userAgent: config.secUserAgent, rps: config.secRps },
  });

  const embedder = params.embedder ?? new HashEmbeddingClient();
  const vectorStore = params.vectorStore ?? new InMemoryVectorStore();
  const breaker = params.breaker ?? new CircuitBreaker();

  const results = [];
  const degradedNotes = [];
  const sources = selectedSources(sourceScope);

  for (const source of sources) {
    const adapter = adapters[source];
    if (!adapter) {
      degradedNotes.push(`Adapter for source '${source}' is not configured.`);
      continue;
    }

    try {
      const response = await adapter.search(query, {
        retries: config.fetchRetries,
        timeoutMs: config.fetchTimeoutMs,
        breaker,
      });

      const chunked = response.records.flatMap((record) => chunkRecord(record, params.chunkOptions));
      results.push(...chunked);

      if (Array.isArray(response.degradedNotes)) {
        degradedNotes.push(...response.degradedNotes);
      }
    } catch (error) {
      degradedNotes.push(`${source} source unavailable: ${error.message}`);
    }
  }

  vectorStore.upsert(results, embedder);
  const vectorMatches = vectorStore.query(query, {
    topK: params.topK ?? 50,
    scope: sourceScope,
    embedder,
  });

  const evidence = rankEvidence(query, vectorMatches, {
    sourceScope,
    limit: params.maxEvidence ?? 8,
  });

  const mode = degradedNotes.length ? "degraded" : "normal";
  return buildPromptReadyPack({
    query,
    sourceScope,
    evidence,
    mode,
    degradedNotes,
  });
}
