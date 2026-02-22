export function loadConfig(env = process.env) {
  return {
    enableContractCodex: String(env.ENABLE_CONTRACTCODEX ?? "true").toLowerCase() !== "false",
    secUserAgent: env.SEC_USER_AGENT || "PossibLawLegalSkills/1.3.0 (contact: support@possiblaw.com)",
    secRps: Number(env.SEC_RPS || 5),
    fetchTimeoutMs: Number(env.FETCH_TIMEOUT_MS || 8000),
    fetchRetries: Number(env.FETCH_RETRIES || 2),
  };
}
