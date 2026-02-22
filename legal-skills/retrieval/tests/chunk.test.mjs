import test from "node:test";
import assert from "node:assert/strict";
import { chunkTextPreserveClauses } from "../chunk.mjs";

test("chunkTextPreserveClauses splits long clause text with overlap", () => {
  const base = "Indemnification applies to all third-party claims and includes defense obligations.";
  const text = new Array(40).fill(base).join(" ");

  const chunks = chunkTextPreserveClauses(text, {
    targetMin: 500,
    targetMax: 900,
    overlapChars: 120,
  });

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 900));
});
