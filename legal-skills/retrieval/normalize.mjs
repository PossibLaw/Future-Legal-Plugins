import { createHash } from "node:crypto";
import { assertContextRecord } from "./types.mjs";

function hash(input) {
  return createHash("sha1").update(input).digest("hex").slice(0, 16);
}

function collapseWhitespace(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function defaultSummary(text) {
  const clean = collapseWhitespace(text);
  if (!clean) {
    return "No summary available.";
  }

  return clean.length <= 220 ? clean : `${clean.slice(0, 217)}...`;
}

function safeUrl(rawUrl) {
  const url = String(rawUrl || "").trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "https://example.invalid/missing-source";
  }

  return url;
}

function buildId(source, basis) {
  return `${source}:${hash(basis)}`;
}

export function normalizeSkillsCandidate(raw) {
  const name = collapseWhitespace(raw.name || raw.title || raw.slug || "Untitled skill");
  const summary = defaultSummary(raw.summary || raw.description || raw.intent || name);
  const snippet = collapseWhitespace(raw.content || raw.summary || raw.description || name);
  const url = safeUrl(raw.url || (raw.slug ? `https://agentskills.legal/skills/${raw.slug}` : ""));

  return assertContextRecord({
    id: buildId("skills", `${name}|${url}|${snippet}`),
    source: "skills",
    title: name,
    summary,
    snippet,
    url,
    metadata: {
      topic: collapseWhitespace(raw.category || raw.practice_area || "legal workflow"),
      tags: Array.isArray(raw.tags) ? raw.tags.map((tag) => collapseWhitespace(tag)).filter(Boolean) : [],
    },
  });
}

export function normalizeContractCodexEntry(raw) {
  const title = collapseWhitespace(raw.title || raw.heading || "ContractCodex exemplar");
  const summary = defaultSummary(raw.summary || raw.snippet || raw.body || title);
  const snippet = collapseWhitespace(raw.snippet || raw.body || raw.summary || title);
  const url = safeUrl(raw.url);

  return assertContextRecord({
    id: buildId("contractcodex", `${title}|${url}|${snippet}`),
    source: "contractcodex",
    title,
    summary,
    snippet,
    url,
    metadata: {
      topic: collapseWhitespace(raw.topic || raw.category || "contract exemplar"),
      jurisdiction: collapseWhitespace(raw.jurisdiction || ""),
      tags: Array.isArray(raw.tags) ? raw.tags.map((tag) => collapseWhitespace(tag)).filter(Boolean) : [],
    },
  });
}

export function normalizeSecEntry(raw) {
  const company = collapseWhitespace(raw.company || raw.companyName || "Public company");
  const exhibitType = collapseWhitespace(raw.exhibitType || raw.documentType || "EX-10");
  const filingDate = collapseWhitespace(raw.filingDate || raw.date || "");
  const title = collapseWhitespace(raw.title || `${company} ${exhibitType} filing excerpt`);
  const summary = defaultSummary(raw.summary || raw.snippet || raw.body || title);
  const snippet = collapseWhitespace(raw.snippet || raw.body || raw.summary || title);
  const url = safeUrl(raw.url);

  return assertContextRecord({
    id: buildId("sec", `${company}|${title}|${url}|${snippet}`),
    source: "sec",
    title,
    summary,
    snippet,
    url,
    metadata: {
      company,
      formType: collapseWhitespace(raw.formType || ""),
      exhibitType,
      filingDate,
      topic: collapseWhitespace(raw.topic || "public company contract exhibit"),
      tags: Array.isArray(raw.tags) ? raw.tags.map((tag) => collapseWhitespace(tag)).filter(Boolean) : [],
    },
  });
}

export function normalizeBySource(source, raw) {
  switch (source) {
    case "skills":
      return normalizeSkillsCandidate(raw);
    case "contractcodex":
      return normalizeContractCodexEntry(raw);
    case "sec":
      return normalizeSecEntry(raw);
    default:
      throw new Error(`Unsupported normalization source: ${source}`);
  }
}
