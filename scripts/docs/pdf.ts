#!/usr/bin/env bun

import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import {
  logStep,
  logInfo,
  logSuccess,
  logError,
  logWarn,
  printBanner,
} from "./lib/logger";

const MIKTEX_BIN =
  "C:\\Users\\PC\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64";
const QUARTO_EXE =
  process.env.QUARTO_PATH ||
  "C:\\Users\\PC\\AppData\\Local\\Programs\\Quarto\\bin\\quarto.exe";

const ROOT_DIR = import.meta.dirname;
const PDF_DIR = resolve(ROOT_DIR, "_pdf");

function ensureMiktexOnPath(): void {
  if (!process.env.PATH?.includes("MiKTeX")) {
    process.env.PATH = `${MIKTEX_BIN};${process.env.PATH}`;
  }
}

function findQuarto(): string {
  if (existsSync(QUARTO_EXE)) return QUARTO_EXE;
  ensureMiktexOnPath();
  try {
    const which = execSync("where.exe quarto", { encoding: "utf-8" })
      .trim()
      .split("\n")[0]
      ?.trim();
    if (which && existsSync(which)) return which;
  } catch {}
  throw new Error(
    "Quarto CLI not found. Install from https://quarto.org or set QUARTO_PATH env var."
  );
}

function countPdfPages(pdfPath: string): number {
  const buf = readFileSync(pdfPath);
  const text = buf.toString("latin1");
  const pageObjMatches = text.match(/\/Type\s*\/Page(?!\s*s)\b/g);
  if (pageObjMatches && pageObjMatches.length > 0) return pageObjMatches.length;
  const countMatch = text.match(/\/N\s+(\d+)/);
  if (countMatch?.[1]) return parseInt(countMatch[1], 10);
  return 0;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const countOnly = args.includes("--count-only");
  const clean = args.includes("--clean");

  printBanner();

  ensureMiktexOnPath();
  const quarto = findQuarto();
  logInfo(`Quarto: ${quarto}`);
  logInfo(`Quarto version: ${execSync(`"${quarto}" --version`, { encoding: "utf-8" }).trim()}`);

  const pdfFile = resolve(PDF_DIR, "ares-docs.pdf");
  if (countOnly && existsSync(pdfFile)) {
    const pages = countPdfPages(pdfFile);
    logSuccess(`PDF page count: ${String(pages)}`);
    return;
  }

  if (clean && existsSync(PDF_DIR)) {
    logInfo("Cleaning previous build...");
    execSync(`Remove-Item -Recurse -Force "${PDF_DIR}"`, {
      shell: "pwsh",
      stdio: "pipe",
    });
  }

  logStep("Rendering PDF with Quarto");
  logInfo(`Working dir: ${ROOT_DIR}`);

  try {
    execSync(`"${quarto}" render --to pdf`, {
      cwd: ROOT_DIR,
      encoding: "utf-8",
      stdio: "inherit",
      timeout: 10 * 60 * 1000,
      env: { ...process.env, PATH: process.env.PATH },
    });
  } catch {
    logError("Quarto render failed. See output above for LaTeX errors.");
    process.exit(1);
  }

  if (existsSync(pdfFile)) {
    const pages = countPdfPages(pdfFile);
    const sizeBytes = statSync(pdfFile).size;
    const sizeMB = (sizeBytes / 1024 / 1024).toFixed(1);
    logSuccess(`PDF generated: ${pdfFile} (${sizeMB} MB)`);
    logSuccess(`Accurate page count: ${String(pages)} A4 pages`);
  } else {
    logError("PDF file not found after render. Check Quarto output for errors.");
    process.exit(1);
  }
}

try {
  await main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  logError(`PDF generation failed: ${message}`);
  process.exit(1);
}
