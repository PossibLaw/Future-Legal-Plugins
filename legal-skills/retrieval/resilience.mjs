export class CircuitBreaker {
  constructor({ failureThreshold = 3, cooldownMs = 30_000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.failures = 0;
    this.lastFailureAt = 0;
  }

  canRequest() {
    if (this.failures < this.failureThreshold) {
      return true;
    }

    return Date.now() - this.lastFailureAt > this.cooldownMs;
  }

  markSuccess() {
    this.failures = 0;
    this.lastFailureAt = 0;
  }

  markFailure() {
    this.failures += 1;
    this.lastFailureAt = Date.now();
  }
}

export class RpsLimiter {
  constructor(rps = 5) {
    this.intervalMs = Math.ceil(1000 / rps);
    this.nextAt = 0;
  }

  async waitTurn() {
    const now = Date.now();
    const delay = Math.max(0, this.nextAt - now);
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.nextAt = Date.now() + this.intervalMs;
  }
}

export async function withTimeout(task, timeoutMs, timeoutMessage = "Operation timed out") {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([task, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchWithRetry(url, options = {}, controls = {}) {
  const fetcher = controls.fetcher ?? globalThis.fetch;
  if (!fetcher) {
    throw new Error("No fetch implementation provided");
  }

  const retries = controls.retries ?? 2;
  const timeoutMs = controls.timeoutMs ?? 8_000;
  const breaker = controls.breaker;

  if (breaker && !breaker.canRequest()) {
    throw new Error(`Circuit breaker open for ${url}`);
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await withTimeout(fetcher(url, options), timeoutMs, `Timeout fetching ${url}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      if (breaker) {
        breaker.markSuccess();
      }

      return response;
    } catch (error) {
      lastError = error;
      if (breaker) {
        breaker.markFailure();
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}
