import test from "node:test";
import assert from "node:assert/strict";
import { buildPromptReadyPack } from "../output.mjs";

test("buildPromptReadyPack returns prompt context and synthesis", () => {
  const pack = buildPromptReadyPack({
    query: "indemnification",
    sourceScope: "all",
    evidence: [
      {
        rank: 1,
        source: "contractcodex",
        title: "Indemnity Example",
        snippet: "Vendor indemnifies customer for third-party IP claims.",
        url: "https://www.contractcodex.com/example",
        fitReason: "Keyword and semantic match.",
      },
    ],
  });

  assert.equal(pack.mode, "normal");
  assert.ok(pack.synthesis.includes("Not legal advice"));
  assert.ok(pack.promptContextBlock.includes("Citation:"));
});

test("buildPromptReadyPack fails when citation is missing", () => {
  assert.throws(
    () =>
      buildPromptReadyPack({
        query: "liability",
        sourceScope: "all",
        evidence: [
          {
            rank: 1,
            source: "sec",
            title: "EX-10",
            snippet: "liability clause",
            url: "",
            fitReason: "match",
          },
        ],
      }),
    /missing a valid citation URL/
  );
});
