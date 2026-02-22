import test from "node:test";
import assert from "node:assert/strict";
import { CircuitBreaker, withTimeout } from "../resilience.mjs";

test("CircuitBreaker opens after threshold", () => {
  const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 60_000 });
  assert.equal(breaker.canRequest(), true);
  breaker.markFailure();
  breaker.markFailure();
  assert.equal(breaker.canRequest(), false);
});

test("withTimeout rejects slow operations", async () => {
  await assert.rejects(
    withTimeout(new Promise((resolve) => setTimeout(resolve, 50)), 10, "timeout"),
    /timeout/
  );
});
