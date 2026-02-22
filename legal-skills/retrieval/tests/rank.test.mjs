import test from "node:test";
import assert from "node:assert/strict";
import { hybridScore, rankEvidence } from "../rank.mjs";

test("hybridScore is deterministic", () => {
  const scoreA = hybridScore({ semanticScore: 0.7, keywordScore: 0.5, source: "sec" });
  const scoreB = hybridScore({ semanticScore: 0.7, keywordScore: 0.5, source: "sec" });
  assert.equal(scoreA, scoreB);
});

test("rankEvidence enforces source scope", () => {
  const matches = [
    {
      semanticScore: 0.9,
      record: {
        source: "skills",
        title: "Skills item",
        summary: "workflow",
        snippet: "workflow guidance",
        url: "https://agentskills.legal/skills/x",
      },
    },
    {
      semanticScore: 0.92,
      record: {
        source: "sec",
        title: "SEC item",
        summary: "exhibit",
        snippet: "indemnification exhibit",
        url: "https://data.sec.gov/Archives/x",
      },
    },
  ];

  const ranked = rankEvidence("indemnification", matches, {
    sourceScope: "sec",
    limit: 8,
  });

  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].source, "sec");
});
