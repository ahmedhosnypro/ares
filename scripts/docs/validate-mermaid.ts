#!/usr/bin/env bun

import { glob } from "glob";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import chalk from "chalk";
import ora from "ora";

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

export async function validateMermaidDiagram(
  filePath: string,
  lineNumber: number,
  diagramType: string,
  content: string,
): Promise<MermaidValidationResult> {
  const errors: Array<{
    message: string;
    severity: "error" | "warning";
  }> = [];
  const lines = content.split("\n");

  if (content.includes("%%{init:")) {
    errors.push({
      message: "Deprecated init directive '%%{init:}' found. Use '%%init%%' instead.",
      severity: "warning",
    });
  }

  const hardcodedColors = content.match(HARDCODED_COLOR_REGEX);
  if (hardcodedColors && hardcodedColors.length > 0) {
    errors.push({
      message: `Hardcoded colors found: ${hardcodedColors.join(", ")}. Use theme variables instead.`,
      severity: "warning",
    });
  }

  const brTags = content.match(BR_TAG_REGEX);
  if (brTags && brTags.length > 0) {
    errors.push({
      message: `Found <br/> tags in node labels. Replace with '\\n' for newlines.`,
      severity: "warning",
    });
  }

  switch (diagramType) {
    case "pie": {
      const values = lines
        .filter((line) => line.trim().includes(":"))
        .map((line) => line.trim())
        .flatMap((line) => line.split(":")[1]?.split(",") || [])
        .map((val) => parseFloat(val.trim()));

      const sum = values.reduce((acc, val) => acc + val, 0);
      if (Math.abs(sum - 100) > 0.1) {
        errors.push({
          message: `Pie chart values sum to ${sum}% but should sum to 100%.`,
          severity: "error",
        });
      }
      break;
    }

    case "gitGraph": {
      const branchLines = lines.filter((line) => line.trim().startsWith("branch "));
      if (branchLines.length === 0) {
        errors.push({
          message: "No branches defined in gitGraph. Define branches explicitly.",
          severity: "error",
        });
      }

      const commitLines = lines.filter((line) => line.trim().startsWith("commit"));
      for (const commitLine of commitLines) {
        const commitMatch = commitLine.match(COMMIT_ID_REGEX);
        if (commitMatch?.[0]) {
          const commitId = commitMatch[0].split(":")[1]?.trim().replace(/["]/g, "") ?? "";
          if (commitId?.includes(" ")) {
            errors.push({
              message: `Invalid commit ID '${commitId}'. Commit IDs cannot contain spaces.`,
              severity: "error",
            });
          }
        }
      }
      break;
    }

    case "quadrantChart": {
      const xAxisLine = lines.find((line) => line.trim().startsWith("x-axis"));
      const yAxisLine = lines.find((line) => line.trim().startsWith("y-axis"));
      if (!xAxisLine || !yAxisLine) {
        errors.push({
          message: "Missing x-axis or y-axis labels in quadrantChart.",
          severity: "error",
        });
      }
      const hasQuadrantLabels = lines.some((line) => /^quadrant-[1234]\s+\S/.test(line.trim()));
      const hasInvalidQuadrant = lines.some((line) => line.trim().startsWith("quadrant-") && line.includes("["));
      if (!hasQuadrantLabels || hasInvalidQuadrant) {
        errors.push({
          message: "Invalid quadrantChart format. Define quadrants as 'quadrant-1 Critical' (NOT 'quadrant-1[Critical] : 1').",
          severity: "error",
        });
      }
      break;
    }

    case "gantt": {
      const dateFormatLine = lines.find((line) => line.trim().startsWith("dateFormat"));
      if (!dateFormatLine) {
        errors.push({
          message: "Missing dateFormat in gantt chart.",
          severity: "warning",
        });
      }
      break;
    }

    default:
      break;
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
): Promise<MermaidValidationResult[]> {
  const content = await readFile(filePath, "utf-8");
  const diagrams: MermaidValidationResult[] = [];
  let match: RegExpExecArray | null;

  while ((match = MERMAID_REGEX.exec(content)) !== null) {
    const diagramContent = match[1];
    if (diagramContent === undefined) continue;

    const startLine = content.substring(0, match.index ?? 0).split("\n").length;
    const diagramTypeMatch = diagramContent.match(DIAGRAM_TYPE_REGEX);
    const diagramType = diagramTypeMatch?.[1] ?? "unknown";

    diagrams.push(
      await validateMermaidDiagram(filePath, startLine, diagramType, diagramContent),
    );
  }

  return diagrams;
}

export async function validateAllDiagrams(
  directory: string,
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
    const fileResults = await extractMermaidDiagrams(filePath);
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

async function runValidation(): Promise<void> {
  const spinner = ora("Validating Mermaid diagrams...").start();
  try {
    const { results, totalErrors, totalWarnings } = await validateAllDiagrams(
      resolve(import.meta.dirname, "./generated"),
    );

    spinner.stop();
    console.log(chalk.bold("\nMermaid Diagram Validation Report"));
    console.log(chalk.gray("-".repeat(50)));

    for (const result of results) {
      if (result.errors.length === 0) continue;

      console.log(chalk.bold(`File: ${result.filePath}:${result.lineNumber}`));
      console.log(chalk.italic(`Diagram Type: ${result.diagramType}`));
      console.log("Content:");
      console.log(chalk.gray(result.content.split("\n").map((l) => `   ${l}`).join("\n")));
      console.log("Errors:");

      for (const error of result.errors) {
        const message = error.severity === "error"
          ? chalk.red(`  ❌ ${error.message}`)
          : chalk.yellow(`  ⚠️ ${error.message}`);
        console.log(message);
      }
      console.log("");
    }

    console.log(chalk.gray("-".repeat(50)));
    console.log(chalk.bold(`Summary:`));
    console.log(chalk.red(`Errors: ${totalErrors}`));
    console.log(chalk.yellow(`Warnings: ${totalWarnings}`));
    console.log("");

    if (totalErrors === 0) {
      console.log(chalk.green("✅ All diagrams are valid and will render correctly."));
    } else {
      console.log(chalk.red(`❌ Found ${totalErrors} errors. Diagrams with errors will not render.`));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail("Validation failed");
    console.error(error);
    process.exit(1);
  }
}

if (import.meta.main) {
  runValidation();
}
