import { spawn } from "node:child_process";
import { resolve } from "node:path";

/**
 * 🚀 Ares Safe Dev Mode
 * Runs Next.js with strict memory limits and forces the Bun runtime.
 */

const MEMORY_LIMIT_MB = 1024;
const MEMORY_LIMIT_BYTES = MEMORY_LIMIT_MB * 1024 * 1024;

const env: NodeJS.ProcessEnv = {
  ...process.env,
  BUN_JSC_gcMaxHeapSize: String(MEMORY_LIMIT_BYTES),
  NODE_ENV: "development",
};

const nextBin = resolve("node_modules/next/dist/bin/next");

console.log(`\n🛡️  Starting Ares in Safe Mode...`);
console.log(`📦 Runtime: Bun`);
console.log(`🧠 Memory Limit: ${MEMORY_LIMIT_MB}MB`);
console.log(`🌐 Port: 3000\n`);

const child = spawn("bun", ["--smol", nextBin, "dev", "--port", "3000"], {
  stdio: "inherit",
  env,
  shell: true,
});

child.on("exit", (code: number | null) => {
  process.exit(code ?? 0);
});
