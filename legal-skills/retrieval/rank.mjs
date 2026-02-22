import { SOURCE_PRIORS } from "./types.mjs";

function tokenize(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1)
  );
}

export function keywordOverlap(query, text) {
  const q = tokenize(query);
  const t = tokenize(text);
  if (q.size === 0 || t.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of q) {
    if (t.has(token)) {
      overlap += 1;
    }
  }

  return overlap / q.size;
}

export function hybridScore({ semanticScore, keywordScore, source }) {
  const sourcePrior = SOURCE_PRIORS[source] ?? 0.85;
  const score = 0.55 * semanticScore + 0.3 * keywordScore + 0.15 * sourcePrior;
  return Number(score.toFixed(6));
}

function fitReason(item) {
  const metadata = item.record.metadata || {};
  const topic = metadata.topic || "relevant legal context";
  const company = metadata.company ? `; company: ${metadata.company}` : "";
  return `High semantic and keyword alignment on ${topic}${company}.`;
}

export function rankEvidence(query, vectorMatches, options = {}) {
  const sourceScope = options.sourceScope ?? "all";
  const limit = Math.min(options.limit ?? 8, 12);

  const scored = vectorMatches
    .filter((item) => sourceScope === "all" || item.record.source === sourceScope)
    .map((item) => {
      const body = `${item.record.title} ${item.record.summary} ${item.record.snippet}`;
      const keywordScore = keywordOverlap(query, body);
      return {
        record: item.record,
        semanticScore: item.semanticScore,
        keywordScore,
        finalScore: hybridScore({ semanticScore: item.semanticScore, keywordScore, source: item.record.source }),
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit)
    .map((item, index) => ({
      rank: index + 1,
      source: item.record.source,
      title: item.record.title,
      snippet: item.record.snippet,
      url: item.record.url,
      fitReason: fitReason({ record: item.record, score: item.finalScore }),
      scores: {
        semantic: item.semanticScore,
        keyword: item.keywordScore,
        final: item.finalScore,
      },
    }));

  return scored;
}
