function normalizeText(text) {
  return String(text || "").replace(/\r\n?/g, "\n").replace(/\s+/g, " ").trim();
}

function clauseSplit(text) {
  return normalizeText(text)
    .split(/(?<=[.;:])\s+(?=[A-Z0-9(])/)
    .map((piece) => piece.trim())
    .filter(Boolean);
}

function overlapTail(text, overlapChars) {
  if (!text || overlapChars <= 0) {
    return "";
  }

  return text.slice(Math.max(0, text.length - overlapChars)).trim();
}

export function chunkTextPreserveClauses(text, options = {}) {
  const targetMin = options.targetMin ?? 500;
  const targetMax = options.targetMax ?? 900;
  const overlapChars = options.overlapChars ?? 120;

  const clauses = clauseSplit(text);
  if (clauses.length === 0) {
    return [];
  }

  const chunks = [];
  let current = "";

  for (const clause of clauses) {
    const candidate = current ? `${current} ${clause}` : clause;
    if (candidate.length <= targetMax) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current.trim());
    }

    const tail = overlapTail(current, overlapChars);
    current = tail ? `${tail} ${clause}`.trim() : clause;

    while (current.length > targetMax) {
      chunks.push(current.slice(0, targetMax).trim());
      const remainder = current.slice(targetMax - overlapChars).trim();
      current = remainder;
    }
  }

  if (current) {
    chunks.push(current.trim());
  }

  if (chunks.length > 1 && chunks[chunks.length - 1].length < targetMin) {
    const merged = `${chunks[chunks.length - 2]} ${chunks[chunks.length - 1]}`.trim();
    if (merged.length <= targetMax) {
      chunks[chunks.length - 2] = merged;
      chunks.pop();
    }
  }

  return chunks;
}
