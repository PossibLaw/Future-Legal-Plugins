function ensureCitation(item) {
  if (!item.url || !/^https?:\/\//.test(item.url)) {
    throw new Error(`Evidence item at rank ${item.rank} is missing a valid citation URL`);
  }
}

function toSentenceList(items) {
  if (items.length === 0) {
    return "No matching evidence was found from the selected sources.";
  }

  const top = items.slice(0, 3).map((item) => `${item.source} #${item.rank}`);
  return `Top signals came from ${top.join(", ")}.`;
}

function buildPromptContextBlock(query, evidence) {
  const lines = [
    "Use only the cited evidence below. Do not fabricate clauses.",
    `User query: ${query}`,
    "Evidence:",
  ];

  for (const item of evidence) {
    lines.push(`- [${item.source}] ${item.title}`);
    lines.push(`  Snippet: ${item.snippet}`);
    lines.push(`  Citation: ${item.url}`);
  }

  lines.push("Task: Provide context, explain common patterns, and propose alternatives with citation references.");
  return lines.join("\n");
}

export function buildPromptReadyPack({ query, sourceScope, evidence, mode = "normal", degradedNotes = [] }) {
  for (const item of evidence) {
    ensureCitation(item);
  }

  const synthesis = [
    `What this means: ${toSentenceList(evidence)}`,
    mode === "degraded" && degradedNotes.length
      ? `Degraded mode: ${degradedNotes.join("; ")}`
      : null,
    "Not legal advice. Validate with qualified counsel before relying on any provision.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    query,
    sourceScope,
    synthesis,
    evidence,
    promptContextBlock: buildPromptContextBlock(query, evidence),
    mode,
    degradedNotes: degradedNotes.length ? degradedNotes : undefined,
  };
}
