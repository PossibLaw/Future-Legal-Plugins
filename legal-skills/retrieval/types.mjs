export const SOURCE_SCOPES = ["skills", "contractcodex", "sec", "all"];

export const RECORD_SOURCES = ["skills", "contractcodex", "sec"];

export function isSourceScope(value) {
  return SOURCE_SCOPES.includes(value);
}

export function normalizeSourceScope(value) {
  if (!value) {
    return "all";
  }

  const normalized = String(value).trim().toLowerCase();
  if (isSourceScope(normalized)) {
    return normalized;
  }

  throw new Error(`Unsupported source scope: ${value}`);
}

export function assertContextRecord(record) {
  const required = ["id", "source", "title", "summary", "snippet", "url", "metadata"];
  for (const field of required) {
    if (record[field] === undefined || record[field] === null || record[field] === "") {
      throw new Error(`ContextRecord missing required field: ${field}`);
    }
  }

  if (!RECORD_SOURCES.includes(record.source)) {
    throw new Error(`ContextRecord has unsupported source: ${record.source}`);
  }

  if (typeof record.metadata !== "object") {
    throw new Error("ContextRecord metadata must be an object");
  }

  return record;
}

export const SOURCE_PRIORS = {
  skills: 0.9,
  contractcodex: 0.95,
  sec: 0.9,
};
