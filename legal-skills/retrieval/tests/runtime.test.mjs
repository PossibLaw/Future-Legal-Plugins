import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { parseRuntimeArgs, runRuntime, formatPromptPackMarkdown } from "../runtime.mjs";

test("parseRuntimeArgs parses source, max evidence, and json alias", () => {
  const parsed = parseRuntimeArgs(["--query", "indemnification", "--source", "sec", "--max-evidence", "11", "--json"]);
  assert.equal(parsed.query, "indemnification");
  assert.equal(parsed.sourceScope, "sec");
  assert.equal(parsed.maxEvidence, 11);
  assert.equal(parsed.format, "json");
});

test("formatPromptPackMarkdown includes required sections", () => {
  const output = formatPromptPackMarkdown({
    synthesis: "Top signals from sec #1.",
    evidence: [
      {
        rank: 1,
        source: "sec",
        title: "EX-10.1",
        snippet: "The Company shall indemnify...",
        url: "https://data.sec.gov/Archives/example",
        fitReason: "Semantic and keyword match",
      },
    ],
    mode: "normal",
    promptContextBlock: "Use cited evidence only.",
  });

  assert.ok(output.includes("What this means"));
  assert.ok(output.includes("Best evidence"));
  assert.ok(output.includes("Copy/paste context block"));
});

test("runRuntime supports stdin JSON and mock data", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "legal-runtime-test-"));
  const mockPath = path.join(dir, "mock-data.json");

  await writeFile(
    mockPath,
    JSON.stringify({
      skills: [
        {
          name: "Contract Review",
          summary: "Review clause workflow",
          slug: "contract-review",
        },
      ],
      contractcodex: [
        {
          title: "Indemnity clause example",
          summary: "Vendor indemnity sample",
          snippet: "Vendor indemnifies customer for third-party claims.",
          url: "https://www.contractcodex.com/example",
        },
      ],
      sec: [
        {
          company: "Acme Corp",
          exhibitType: "EX-10.1",
          filingDate: "2025-01-01",
          snippet: "The Company indemnifies counterparties under specified events.",
          url: "https://data.sec.gov/Archives/edgar/data/1/2/ex-10.htm",
        },
      ],
    })
  );

  const result = await runRuntime(
    ["--json", "--pretty", "--mock-data", mockPath],
    JSON.stringify({ query: "indemnification", sourceScope: "all", maxEvidence: 8 })
  );

  assert.equal(result.exitCode, 0);
  const payload = JSON.parse(result.output);
  assert.equal(payload.query, "indemnification");
  assert.ok(Array.isArray(payload.evidence));
  assert.ok(payload.evidence.length > 0);
});

test("runRuntime returns help output", async () => {
  const result = await runRuntime(["--help"], "");
  assert.equal(result.exitCode, 0);
  assert.ok(result.output.includes("Usage:"));
});
