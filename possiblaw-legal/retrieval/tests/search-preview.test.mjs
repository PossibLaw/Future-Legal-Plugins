import test from "node:test";
import assert from "node:assert/strict";
import { deriveKeyword, parseRuntimeArgs, extractSections } from "../runtime.mjs";

// --- deriveKeyword tests ---

test("deriveKeyword extracts first meaningful word from query", () => {
  assert.equal(deriveKeyword("indemnification clauses AI professional services"), "indemnification");
});

test("deriveKeyword strips legal stopwords", () => {
  assert.equal(deriveKeyword("clause for limitation of liability"), "limitation");
});

test("deriveKeyword returns first query word when all are stopwords", () => {
  assert.equal(deriveKeyword("the clause"), "the");
});

test("deriveKeyword handles single word", () => {
  assert.equal(deriveKeyword("indemnification"), "indemnification");
});

test("deriveKeyword handles empty string", () => {
  assert.equal(deriveKeyword(""), "");
});

test("deriveKeyword handles null/undefined", () => {
  assert.equal(deriveKeyword(null), "");
  assert.equal(deriveKeyword(undefined), "");
});

test("deriveKeyword keeps domain-specific terms like AI, IP, NDA", () => {
  assert.equal(deriveKeyword("AI indemnification"), "ai");
  assert.equal(deriveKeyword("intellectual property assignment"), "intellectual");
  assert.equal(deriveKeyword("NDA confidentiality"), "nda");
});

test("deriveKeyword handles mixed case", () => {
  assert.equal(deriveKeyword("Indemnification Clauses"), "indemnification");
});

test("deriveKeyword handles punctuation in query", () => {
  assert.equal(deriveKeyword("indemnification, limitation of liability"), "indemnification");
});

// --- parseRuntimeArgs tests for search-preview ---

test("parseRuntimeArgs parses search-preview mode with defaults", () => {
  const parsed = parseRuntimeArgs(["--mode", "search-preview", "--query", "indemnification AI", "--json"]);
  assert.equal(parsed.mode, "search-preview");
  assert.equal(parsed.query, "indemnification AI");
  assert.equal(parsed.previewBatch, 3);
  assert.equal(parsed.previewChars, 400);
  assert.equal(parsed.format, "json");
});

test("parseRuntimeArgs parses custom preview-batch and preview-chars", () => {
  const parsed = parseRuntimeArgs([
    "--mode", "search-preview",
    "--query", "limitation of liability",
    "--preview-batch", "5",
    "--preview-chars", "600",
    "--json",
  ]);
  assert.equal(parsed.previewBatch, 5);
  assert.equal(parsed.previewChars, 600);
});

test("parseRuntimeArgs defaults preview-batch to 3 for search mode too", () => {
  const parsed = parseRuntimeArgs(["--query", "test", "--json"]);
  assert.equal(parsed.previewBatch, 3);
  assert.equal(parsed.previewChars, 400);
});

// --- extractSections with short previewChars ---

test("extractSections respects short contextChars for preview use", () => {
  const text = [
    "ARTICLE I - DEFINITIONS",
    "",
    "Terms used herein shall have the meanings set forth.",
    "",
    "ARTICLE II - INDEMNIFICATION",
    "",
    "The Company shall indemnify and hold harmless the Director against all claims, damages, and expenses arising from their service. This indemnification covers legal fees, settlements, and judgments.",
    "",
    "ARTICLE III - LIMITATION OF LIABILITY",
    "",
    "Neither party shall be liable for indirect damages.",
  ].join("\n");

  const result = extractSections(text, "indemnification", 400);
  assert.ok(result.found);
  assert.ok(result.sections.length >= 1);
  assert.ok(result.sections[0].text.toLowerCase().includes("indemnification"));
});

test("extractSections returns empty when keyword not found", () => {
  const text = "This document contains no relevant provisions.";
  const result = extractSections(text, "indemnification", 400);
  assert.equal(result.found, false);
  assert.equal(result.sections.length, 0);
});
