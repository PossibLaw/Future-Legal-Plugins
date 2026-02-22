import { createHash } from "node:crypto";

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function termHash(term, dims) {
  const digest = createHash("sha1").update(term).digest();
  return digest.readUInt16BE(0) % dims;
}

export class HashEmbeddingClient {
  constructor(dims = 256) {
    this.dims = dims;
  }

  embed(text) {
    const vector = new Array(this.dims).fill(0);
    const tokens = tokenize(text);

    for (const token of tokens) {
      const idx = termHash(token, this.dims);
      vector[idx] += 1;
    }

    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => value / norm);
  }
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += (a[i] || 0) * (b[i] || 0);
    normA += (a[i] || 0) * (a[i] || 0);
    normB += (b[i] || 0) * (b[i] || 0);
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom ? dot / denom : 0;
}

export class InMemoryVectorStore {
  constructor() {
    this.items = new Map();
  }

  upsert(records, embedder) {
    for (const record of records) {
      const content = `${record.title}\n${record.summary}\n${record.snippet}`;
      const vector = embedder.embed(content);
      this.items.set(record.id, { record, vector });
    }
  }

  query(queryText, options = {}) {
    const topK = options.topK ?? 40;
    const scope = options.scope ?? "all";
    const embedder = options.embedder;
    if (!embedder) {
      throw new Error("InMemoryVectorStore.query requires options.embedder");
    }

    const qvec = embedder.embed(queryText);
    const scored = [];

    for (const { record, vector } of this.items.values()) {
      if (scope !== "all" && record.source !== scope) {
        continue;
      }

      scored.push({
        record,
        semanticScore: cosineSimilarity(qvec, vector),
      });
    }

    scored.sort((a, b) => b.semanticScore - a.semanticScore);
    return scored.slice(0, topK);
  }
}
