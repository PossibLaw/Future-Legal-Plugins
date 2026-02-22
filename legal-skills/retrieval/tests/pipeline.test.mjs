import test from "node:test";
import assert from "node:assert/strict";
import { runUnifiedSearch } from "../pipeline.mjs";
import { HashEmbeddingClient, InMemoryVectorStore } from "../vector.mjs";

const mockRecords = {
  skills: [
    {
      id: "skills:1",
      source: "skills",
      title: "Contract Review Workflow",
      summary: "Use a risk checklist.",
      snippet: "Start with indemnification, liability cap, and termination rights.",
      url: "https://agentskills.legal/skills/contract-review",
      metadata: { topic: "workflow" },
    },
  ],
  contractcodex: [
    {
      id: "contractcodex:1",
      source: "contractcodex",
      title: "Mutual NDA sample",
      summary: "Mutual NDA clause examples.",
      snippet: "Each party shall indemnify the other for third-party claims from disclosure breaches.",
      url: "https://www.contractcodex.com/nda",
      metadata: { topic: "confidentiality" },
    },
  ],
  sec: [
    {
      id: "sec:1",
      source: "sec",
      title: "EX-10.1 Indemnification",
      summary: "Public company contract exhibit.",
      snippet: "The Company shall defend and indemnify against specified third-party claims.",
      url: "https://data.sec.gov/Archives/edgar/data/1/2/ex-10.htm",
      metadata: { topic: "public company contract exhibit", company: "Acme Corp" },
    },
  ],
};

function makeAdapter(source, shouldFail = false) {
  return {
    source,
    async search() {
      if (shouldFail) {
        throw new Error(`${source} unavailable`);
      }

      return { records: mockRecords[source], degradedNotes: [] };
    },
  };
}

test("runUnifiedSearch returns mixed evidence pack for scope=all", async () => {
  const pack = await runUnifiedSearch({
    query: "indemnification",
    sourceScope: "all",
    adapters: {
      skills: makeAdapter("skills"),
      contractcodex: makeAdapter("contractcodex"),
      sec: makeAdapter("sec"),
    },
    embedder: new HashEmbeddingClient(),
    vectorStore: new InMemoryVectorStore(),
    maxEvidence: 8,
  });

  assert.equal(pack.mode, "normal");
  assert.ok(pack.evidence.length >= 2);
  assert.ok(new Set(pack.evidence.map((item) => item.source)).size >= 2);
});

test("runUnifiedSearch enters degraded mode if one source fails", async () => {
  const pack = await runUnifiedSearch({
    query: "termination rights",
    sourceScope: "all",
    adapters: {
      skills: makeAdapter("skills"),
      contractcodex: makeAdapter("contractcodex", true),
      sec: makeAdapter("sec"),
    },
    embedder: new HashEmbeddingClient(),
    vectorStore: new InMemoryVectorStore(),
    maxEvidence: 8,
  });

  assert.equal(pack.mode, "degraded");
  assert.ok(pack.degradedNotes.some((note) => note.includes("contractcodex")));
});
