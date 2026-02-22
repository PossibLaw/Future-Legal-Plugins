import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSkillsCandidate, normalizeContractCodexEntry, normalizeSecEntry } from "../normalize.mjs";

test("normalizeSkillsCandidate produces ContextRecord", () => {
  const record = normalizeSkillsCandidate({
    slug: "contract-review",
    name: "Contract Review",
    summary: "Analyze contract risk.",
  });

  assert.equal(record.source, "skills");
  assert.ok(record.id.startsWith("skills:"));
  assert.equal(record.title, "Contract Review");
  assert.ok(record.url.includes("agentskills.legal"));
});

test("normalizeContractCodexEntry produces ContextRecord", () => {
  const record = normalizeContractCodexEntry({
    title: "NDA Clause",
    summary: "Mutual confidentiality obligations.",
    url: "https://www.contractcodex.com/example",
  });

  assert.equal(record.source, "contractcodex");
  assert.ok(record.id.startsWith("contractcodex:"));
  assert.equal(record.metadata.topic, "contract exemplar");
});

test("normalizeSecEntry captures SEC metadata", () => {
  const record = normalizeSecEntry({
    company: "Acme Inc.",
    exhibitType: "EX-10.1",
    filingDate: "2025-03-14",
    snippet: "Limitation of liability...",
    url: "https://data.sec.gov/Archives/.../ex-10.htm",
  });

  assert.equal(record.source, "sec");
  assert.equal(record.metadata.company, "Acme Inc.");
  assert.equal(record.metadata.exhibitType, "EX-10.1");
});
