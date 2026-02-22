#!/usr/bin/env node
import { runRuntime } from "./runtime.mjs";

async function main() {
  try {
    const result = await runRuntime(process.argv.slice(2));
    if (result.output) {
      process.stdout.write(`${result.output}\n`);
    }
    process.exit(result.exitCode);
  } catch (error) {
    process.stderr.write(`ERROR: ${error.message}\n`);
    process.exit(2);
  }
}

await main();
