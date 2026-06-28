#!/usr/bin/env bun

try {
  await import("./index.ts");
} catch (error) {
  console.error("Failed to run docs generator:", error);
  process.exit(1);
}
