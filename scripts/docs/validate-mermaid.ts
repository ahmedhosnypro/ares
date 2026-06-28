#!/usr/bin/env bun

import { glob } from "glob";
import { readFile } from "node:fs/promises";
import { appendFileSync, mkdirSync, writeFileSync, existsSync as _existsSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";
import ora from "ora";
import { compileMermaidDiagram, isMmdcAvailable, type MermaidCompileResult } from "./lib/mermaid-compiler";

export interface MermaidValidationResult {
  filePath: string;
  lineNumber: number;
  diagramType: string;
  content: string;
  errors: Array<{
    message: string;
    severity: "error" | "warning";
  }>;
}

const MERMAID_REGEX = /```mermaid\s*\n([\s\S]+?)\n```/g;
const DIAGRAM_TYPE_REGEX = /^\s*(?:%%[^\n]*%%\s*\n\s*)*(\w+)\b/;
const HARDCODED_COLOR_REGEX = /(fill:\s*#[a-fA-F0-9]{3,6}|stroke:\s*#[a-fA-F0-9]{3,6})/g;
const BR_TAG_REGEX = /<br\s*\/?>/g;
const COMMIT_ID_REGEX = /commit\s+id:\s*".+?"/g;

let mmdcAvailableCache: boolean | null = null;

async function checkMmdcAvailable(): Promise<boolean> {
  if (mmdcAvailableCache !== null) return mmdcAvailableCache;
  mmdcAvailableCache = await isMmdcAvailable();
  return mmdcAvailableCache;
}

function lintStyleWarnings(diagramType: string, content: string): Array<{ message: string; severity: "warning" }> {
  const warnings: Array<{ message: string; severity: "warning" }> = [];
  const lines = content.split("\n");

  const hardcodedColors = content.match(HARDCODED_COLOR_REGEX);
  if (hardcodedColors && hardcodedColors.length > 0) {
    warnings.push({
      message: `Hardcoded colors found: ${hardcodedColors.join(", ")}. Use theme variables instead.`,
      severity: "warning",
    });
  }

  const brTags = content.match(BR_TAG_REGEX);
  if (brTags && brTags.length > 0) {
    warnings.push({
      message: `Found <br/> tags in node labels. Replace with '\\n' for newlines.`,
      severity: "warning",
    });
  }

  if (diagramType === "gantt") {
    const dateFormatLine = lines.find(line => line.trim().startsWith("dateFormat"));
    if (!dateFormatLine) {
      warnings.push({
        message: "Missing dateFormat in gantt chart.",
        severity: "warning",
      });
    }
  }

  if (diagramType === "gitGraph") {
    const commitLines = lines.filter(line => line.trim().startsWith("commit"));
    for (const commitLine of commitLines) {
      const commitMatch = commitLine.match(COMMIT_ID_REGEX);
      if (commitMatch?.[0]) {
        const commitId = commitMatch[0].split(":")[1]?.trim().replace(/["]/g, "") ?? "";
        if (commitId.includes(" ")) {
          warnings.push({
            message: `Invalid commit ID '${commitId}'. Commit IDs cannot contain spaces.`,
            severity: "warning",
          });
        }
      }
    }
  }

  return warnings;
}

function lintStructuralErrors(diagramType: string, content: string): Array<{ message: string; severity: "error" }> {
  const errors: Array<{ message: string; severity: "error" }> = [];
  const lines = content.split("\n");

  switch (diagramType) {
    case "pie": {
      const values = lines
        .filter(line => line.trim().includes(":"))
        .map(line => line.trim())
        .flatMap(line => line.split(":")[1]?.split(",") || [])
        .map(val => parseFloat(val.trim()));

      const sum = values.reduce((acc, val) => acc + val, 0);
      if (Math.abs(sum - 100) > 0.1) {
        errors.push({
          message: `Pie chart values sum to ${String(sum)}% but should sum to 100%.`,
          severity: "error",
        });
      }
      break;
    }

    case "gitGraph": {
      const branchLines = lines.filter(line => line.trim().startsWith("branch "));
      if (branchLines.length === 0) {
        errors.push({
          message: "No branches defined in gitGraph. Define branches explicitly.",
          severity: "error",
        });
      }
      break;
    }

    case "quadrantChart": {
      const xAxisLine = lines.find(line => line.trim().startsWith("x-axis"));
      const yAxisLine = lines.find(line => line.trim().startsWith("y-axis"));
      if (!xAxisLine || !yAxisLine) {
        errors.push({
          message: "Missing x-axis or y-axis labels in quadrantChart.",
          severity: "error",
        });
      }
      const hasQuadrantLabels = lines.some(line => /^quadrant-[1234]\s+\S/.test(line.trim()));
      const hasInvalidQuadrant = lines.some(line => line.trim().startsWith("quadrant-") && line.includes("["));
      if (!hasQuadrantLabels || hasInvalidQuadrant) {
        errors.push({
          message:
            "Invalid quadrantChart format. Define quadrants as 'quadrant-1 Critical' (NOT 'quadrant-1[Critical] : 1').",
          severity: "error",
        });
      }
      break;
    }

    default:
      break;
  }

  return errors;
}

function compileErrorsToValidationErrors(
  compileResult: MermaidCompileResult
): Array<{ message: string; severity: "error" | "warning" }> {
  if (compileResult.success) return [];

  if (compileResult.infrastructureError) {
    return compileResult.errors.map(err => ({
      message: err.line > 0 ? `Mermaid infrastructure error on line ${String(err.line)}: ${err.message}` : err.message,
      severity: "warning" as const,
    }));
  }

  return compileResult.errors.map(err => ({
    message: err.line > 0 ? `Mermaid parse error on line ${String(err.line)}: ${err.message}` : err.message,
    severity: "error" as const,
  }));
}

export async function validateMermaidDiagram(
  filePath: string,
  lineNumber: number,
  diagramType: string,
  content: string,
  useCompiler: boolean = true
): Promise<MermaidValidationResult> {
  const errors: Array<{
    message: string;
    severity: "error" | "warning";
  }> = [];

  const styleWarnings = lintStyleWarnings(diagramType, content);
  errors.push(...styleWarnings);

  if (useCompiler) {
    const compilerAvailable = await checkMmdcAvailable();
    if (compilerAvailable) {
      const compileResult = await compileMermaidDiagram(content);
      const compileErrors = compileErrorsToValidationErrors(compileResult);
      errors.push(...compileErrors);
    } else {
      const structuralErrors = lintStructuralErrors(diagramType, content);
      errors.push(...structuralErrors);
    }
  } else {
    const structuralErrors = lintStructuralErrors(diagramType, content);
    errors.push(...structuralErrors);
  }

  return {
    filePath,
    lineNumber,
    diagramType,
    content,
    errors,
  };
}

export async function extractMermaidDiagrams(
  filePath: string,
  useCompiler: boolean = true
): Promise<MermaidValidationResult[]> {
  const content = await readFile(filePath, "utf-8");
  const diagrams: MermaidValidationResult[] = [];
  let match: RegExpExecArray | null;

  while ((match = MERMAID_REGEX.exec(content)) !== null) {
    const diagramContent = match[1];
    if (diagramContent === undefined) continue;

    const startLine = content.substring(0, match.index).split("\n").length;
    const diagramTypeMatch = diagramContent.match(DIAGRAM_TYPE_REGEX);
    const diagramType = diagramTypeMatch?.[1] ?? "unknown";

    diagrams.push(await validateMermaidDiagram(filePath, startLine, diagramType, diagramContent, useCompiler));
  }

  return diagrams;
}

export async function validateAllDiagrams(
  directory: string,
  useCompiler: boolean = true
): Promise<{ results: MermaidValidationResult[]; totalErrors: number; totalWarnings: number }> {
  const mdFiles = await glob("**/*.md", {
    cwd: directory,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  const results: MermaidValidationResult[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const filePath of mdFiles) {
    const fileResults = await extractMermaidDiagrams(filePath, useCompiler);
    results.push(...fileResults);
  }

  for (const result of results) {
    for (const error of result.errors) {
      if (error.severity === "error") totalErrors++;
      else totalWarnings++;
    }
  }

  return { results, totalErrors, totalWarnings };
}

export const MERMAID_ERROR_LOG = resolve(import.meta.dirname, "mermaid-errors.log");

export function clearErrorLog(): void {
  writeFileSync(MERMAID_ERROR_LOG, "", "utf-8");
}

function appendToErrorLog(results: MermaidValidationResult[]): void {
  const dir = resolve(import.meta.dirname);
  mkdirSync(dir, { recursive: true });

  const timestamp = new Date().toISOString();
  let logContent = `\n=== Mermaid Validation - ${timestamp} ===\n`;

  for (const result of results) {
    if (result.errors.length === 0) continue;

    const fileName = result.filePath.split(/[/\\]/).pop() ?? result.filePath;
    const errorEntries = result.errors.filter(e => e.severity === "error").map(e => `  [${e.severity}] ${e.message}`);

    if (errorEntries.length > 0) {
      logContent += `\nFile: ${fileName}:${String(result.lineNumber)}\n`;
      logContent += `Diagram: ${result.diagramType}\n`;
      logContent += errorEntries.join("\n") + "\n";
    }
  }

  const errorCount = results.reduce((sum, r) => sum + r.errors.filter(e => e.severity === "error").length, 0);
  logContent += `\nTotal errors: ${String(errorCount)}\n`;

  appendFileSync(MERMAID_ERROR_LOG, logContent, "utf-8");
}

async function runValidation(): Promise<void> {
  const args = process.argv.slice(2);
  const noCompiler = args.includes("--no-compiler");
  const useCompiler = !noCompiler;
  const logFlag = args.indexOf("--log");
  const logToFile = logFlag !== -1;
  const logPath =
    logFlag !== -1 && args[logFlag + 1] && args[logFlag + 1] !== undefined && !args[logFlag + 1]?.startsWith("--")
      ? resolve(args[logFlag + 1])
      : MERMAID_ERROR_LOG;
  const clearLog = args.includes("--clear-log");

  if (clearLog) {
    clearErrorLog();
    console.log(chalk.dim(`Cleared error log: ${logPath}`));
  }

  const spinner = ora(
    useCompiler
      ? "Validating Mermaid diagrams (mmdc compilation + style lint)..."
      : "Validating Mermaid diagrams (regex lint only)..."
  ).start();
  try {
    const compilerAvailable = useCompiler ? await checkMmdcAvailable() : false;

    if (useCompiler && !compilerAvailable) {
      spinner.warn("mmdc not available, falling back to regex-only validation");
    }

    const { results, totalErrors, totalWarnings } = await validateAllDiagrams(
      resolve(import.meta.dirname, "./generated"),
      useCompiler
    );

    spinner.stop();
    console.log(chalk.bold("\nMermaid Diagram Validation Report"));
    console.log(chalk.gray("-".repeat(50)));

    const mode = useCompiler && compilerAvailable ? "mmdc compilation + style lint" : "regex lint only";
    console.log(chalk.dim(`Mode: ${mode}`));
    console.log("");

    for (const result of results) {
      if (result.errors.length === 0) continue;

      console.log(chalk.bold(`File: ${result.filePath}:${String(result.lineNumber)}`));
      console.log(chalk.italic(`Diagram Type: ${result.diagramType}`));
      console.log("Content:");
      console.log(
        chalk.gray(
          result.content
            .split("\n")
            .map(l => `   ${l}`)
            .join("\n")
        )
      );
      console.log("Errors:");

      for (const error of result.errors) {
        const message =
          error.severity === "error" ? chalk.red(`  ❌ ${error.message}`) : chalk.yellow(`  ⚠️ ${error.message}`);
        console.log(message);
      }
      console.log("");
    }

    console.log(chalk.gray("-".repeat(50)));
    console.log(chalk.bold(`Summary:`));
    console.log(chalk.red(`Errors: ${String(totalErrors)}`));
    console.log(chalk.yellow(`Warnings: ${String(totalWarnings)}`));
    console.log("");

    if (totalErrors === 0) {
      console.log(chalk.green("✅ All diagrams are valid and will render correctly."));
    } else {
      console.log(chalk.red(`❌ Found ${String(totalErrors)} errors. Diagrams with errors will not render.`));
    }

    if (logToFile) {
      appendToErrorLog(results);
      console.log(chalk.dim(`Errors appended to: ${logPath}`));
    }

    if (totalErrors > 0) {
      process.exit(1);
    }
  } catch (error) {
    spinner.fail("Validation failed");
    console.error(error);
    process.exit(1);
  }
}

if (import.meta.main) {
  void runValidation();
}
