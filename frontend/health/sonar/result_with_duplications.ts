#!/usr/bin/env bun
/* eslint-disable no-console */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 🔍 Fetch SonarQube issues AND duplication metrics
 *
 * This script fetches both:
 * 1. File-level code quality issues (bugs, code smells, vulnerabilities)
 * 2. Project-level duplication metrics (duplicated blocks, lines, files)
 *
 * Usage:
 *   bun run health/sonar/result_with_duplications.ts
 */

interface SonarIssue {
  key: string;
  rule: string;
  severity: string;
  component: string;
  line?: number;
  message: string;
  type: string;
  status: string;
  textRange?: {
    startLine: number;
    endLine: number;
    startOffset: number;
    endOffset: number;
  };
}

interface SonarResponse {
  total: number;
  p: number;
  ps: number;
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  issues: SonarIssue[];
}

interface SonarMeasure {
  metric: string;
  value?: string;
  periods?: Array<{ index: number; value: string }>;
}

interface SonarMeasuresResponse {
  component: {
    key: string;
    name: string;
    measures: SonarMeasure[];
  };
}

interface DuplicationBlock {
  from: number;
  size: number;
  _ref?: string;
}

interface DuplicationGroup {
  blocks: DuplicationBlock[];
}

interface SonarDuplicationsResponse {
  duplications: DuplicationGroup[];
  files: Record<
    string,
    {
      key: string;
      name: string;
    }
  >;
}

const SEVERITY_MAP: Record<string, string> = {
  BLOCKER: "error",
  CRITICAL: "error",
  MAJOR: "warning",
  MINOR: "warning",
  INFO: "info",
};

const SEVERITY_SYMBOLS: Record<string, string> = {
  error: "✖",
  warning: "⚠",
  info: "ℹ",
};

// ANSI color codes
const COLORS = {
  RED: "\x1b[0;31m",
  YELLOW: "\x1b[1;33m",
  BLUE: "\x1b[0;34m",
  GREEN: "\x1b[0;32m",
  CYAN: "\x1b[0;36m",
  MAGENTA: "\x1b[0;35m",
  NC: "\x1b[0m", // No Color
};

const SEVERITY_COLORS: Record<string, string> = {
  error: COLORS.RED,
  warning: COLORS.YELLOW,
  info: COLORS.BLUE,
};

/**
 * 🎨 Format issue in ESLint style
 */
function formatIssue(issue: SonarIssue): string {
  const severity = SEVERITY_MAP[issue.severity] ?? "warning";
  const symbol = SEVERITY_SYMBOLS[severity] ?? "•";
  const color = SEVERITY_COLORS[severity] ?? COLORS.NC;

  const line = issue.line ?? issue.textRange?.startLine ?? 0;
  const column = issue.textRange?.startOffset ?? 0;

  return `  ${COLORS.NC}${String(line)}:${String(column)}  ${color}${symbol}${COLORS.NC}  ${issue.message}  ${COLORS.NC}${issue.rule}`;
}

/**
 * 📊 Group issues by file
 */
function groupIssuesByFile(issues: SonarIssue[], projectKey: string): Map<string, SonarIssue[]> {
  const grouped = new Map<string, SonarIssue[]>();

  for (const issue of issues) {
    const filePath = issue.component.replace(`${projectKey}:`, "");
    const fileIssues = grouped.get(filePath) ?? [];
    fileIssues.push(issue);
    grouped.set(filePath, fileIssues);
  }

  // Sort issues within each file by line number
  for (const [filePath, fileIssues] of grouped) {
    fileIssues.sort((a, b) => {
      const lineA = a.line ?? a.textRange?.startLine ?? 0;
      const lineB = b.line ?? b.textRange?.startLine ?? 0;
      return lineA - lineB;
    });
    grouped.set(filePath, fileIssues);
  }

  return grouped;
}

/**
 * 📈 Calculate summary statistics
 */
function calculateSummary(issues: SonarIssue[]): { errors: number; warnings: number; infos: number } {
  let errors = 0;
  let warnings = 0;
  let infos = 0;

  for (const issue of issues) {
    const severity = SEVERITY_MAP[issue.severity] ?? "warning";
    if (severity === "error") {
      errors++;
    } else if (severity === "warning") {
      warnings++;
    } else {
      infos++;
    }
  }

  return { errors, warnings, infos };
}

/**
 * 🎨 Print issues in ESLint format
 */
function printIssues(issues: SonarIssue[], projectKey: string): void {
  if (issues.length === 0) {
    console.log(`\n${COLORS.GREEN}✨ No code quality issues found!${COLORS.NC}\n`);
    return;
  }

  const grouped = groupIssuesByFile(issues, projectKey);
  const sortedFiles = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));

  console.log(`\n${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}`);
  console.log(`${COLORS.CYAN}  CODE QUALITY ISSUES${COLORS.NC}`);
  console.log(`${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}`);

  for (const filePath of sortedFiles) {
    const fileIssues = grouped.get(filePath);
    if (!fileIssues) continue;

    console.log(`\n${COLORS.NC}${filePath}`);
    for (const issue of fileIssues) {
      console.log(formatIssue(issue));
    }
  }

  const summary = calculateSummary(issues);
  const totalProblems = summary.errors + summary.warnings + summary.infos;
  console.log("");
  console.log(
    `${COLORS.RED}✖ ${String(totalProblems)} problems ${COLORS.NC}(${COLORS.RED}${String(summary.errors)} errors${COLORS.NC}, ${COLORS.YELLOW}${String(summary.warnings)} warnings${COLORS.NC}, ${COLORS.BLUE}${String(summary.infos)} infos${COLORS.NC})`
  );
  console.log("");
}

function getDensityColor(density: number): string {
  if (density > 3) return COLORS.RED;
  if (density > 0) return COLORS.YELLOW;
  return COLORS.GREEN;
}

/**
 * 📊 Print duplication metrics
 */
function printDuplicationMetrics(measures: SonarMeasure[]): void {
  const metricsMap = new Map(measures.map(m => [m.metric, m]));

  console.log(`${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}`);
  console.log(`${COLORS.CYAN}  CODE DUPLICATION METRICS${COLORS.NC}`);
  console.log(`${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}\n`);

  // Overall Code section
  console.log(`${COLORS.MAGENTA}Overall Code:${COLORS.NC}`);
  const duplicatedLinesDensity = metricsMap.get("duplicated_lines_density")?.value;
  if (duplicatedLinesDensity) {
    const density = parseFloat(duplicatedLinesDensity);
    console.log(`  Density:           ${getDensityColor(density)}${density.toFixed(1)}%${COLORS.NC}`);
  }

  const duplicatedLines = metricsMap.get("duplicated_lines")?.value;
  if (duplicatedLines) console.log(`  Duplicated Lines:  ${COLORS.NC}${duplicatedLines}`);

  const duplicatedBlocks = metricsMap.get("duplicated_blocks")?.value;
  if (duplicatedBlocks) console.log(`  Duplicated Blocks: ${COLORS.NC}${duplicatedBlocks}`);

  const duplicatedFiles = metricsMap.get("duplicated_files")?.value;
  if (duplicatedFiles) console.log(`  Duplicated Files:  ${COLORS.NC}${duplicatedFiles}`);

  // New Code section
  const newDensityRaw = metricsMap.get("new_duplicated_lines_density")?.periods?.[0]?.value;
  const newLines = metricsMap.get("new_duplicated_lines")?.periods?.[0]?.value;
  const newBlocks = metricsMap.get("new_duplicated_blocks")?.periods?.[0]?.value;

  if (newDensityRaw || newLines || newBlocks) {
    console.log(`\n${COLORS.MAGENTA}New Code:${COLORS.NC}`);
    if (newDensityRaw) {
      const density = parseFloat(newDensityRaw);
      console.log(`  Density:           ${getDensityColor(density)}${density.toFixed(1)}%${COLORS.NC}`);
    }
    if (newLines) console.log(`  Duplicated Lines:  ${COLORS.NC}${newLines}`);
    if (newBlocks) console.log(`  Duplicated Blocks: ${COLORS.NC}${newBlocks}`);
  }

  console.log("");
}

async function printFileDuplications(
  file: { key: string; path: string; measures: SonarMeasure[] },
  token: string,
  sonarHost: string
): Promise<void> {
  const blocksMeasure = file.measures.find(m => m.metric === "duplicated_blocks");
  const blockCount = blocksMeasure?.value ? parseInt(blocksMeasure.value) : 0;

  console.log(`${COLORS.NC}${file.path} ${COLORS.YELLOW}(${String(blockCount)} duplicated blocks)${COLORS.NC}`);

  const dupUrl = new URL(`${sonarHost}/api/duplications/show`);
  dupUrl.searchParams.set("key", file.key);

  const authHeader = "Basic " + btoa(token + ":");
  const response = await fetch(dupUrl.toString(), { headers: { Authorization: authHeader } });

  if (response.ok) {
    const dupData = (await response.json()) as SonarDuplicationsResponse;
    for (const [index, group] of dupData.duplications.entries()) {
      console.log(`  ${COLORS.MAGENTA}Duplication Group ${String(index + 1)}:${COLORS.NC}`);
      for (const block of group.blocks) {
        const refFile = block._ref ? dupData.files[block._ref] : null;
        const refPath = refFile ? refFile.name || block._ref || "unknown" : file.path;
        console.log(
          `    ${COLORS.CYAN}→${COLORS.NC} ${refPath} (lines ${String(block.from)}-${String(block.from + block.size - 1)})`
        );
      }
    }
  }
}

/**
 * 🔍 Fetch and print duplicated blocks details
 */
async function fetchAndPrintDuplicatedBlocks(token: string, projectKey: string, sonarHost: string): Promise<void> {
  const measuresUrl = new URL(`${sonarHost}/api/measures/component_tree`);
  measuresUrl.searchParams.set("component", projectKey);
  measuresUrl.searchParams.set("metricKeys", "duplicated_blocks");
  measuresUrl.searchParams.set("ps", "500");

  const authHeader = "Basic " + btoa(token + ":");
  const response = await fetch(measuresUrl.toString(), { headers: { Authorization: authHeader } });

  if (!response.ok) {
    console.error(`${COLORS.YELLOW}⚠${COLORS.NC} Could not fetch duplicated blocks details`);
    return;
  }

  interface ComponentTreeResponse {
    components: Array<{
      key: string;
      name: string;
      qualifier: string;
      path: string;
      measures: SonarMeasure[];
    }>;
  }

  const data = (await response.json()) as ComponentTreeResponse;
  const filesWithDuplications = data.components.filter(comp => {
    const blocks = comp.measures.find(m => m.metric === "duplicated_blocks");
    const hasBlocks = blocks?.value && parseInt(blocks.value) > 0;
    return hasBlocks && comp.qualifier === "FIL";
  });

  if (filesWithDuplications.length === 0) return;

  console.log(`${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}`);
  console.log(`${COLORS.CYAN}  DUPLICATED BLOCKS DETAILS${COLORS.NC}`);
  console.log(`${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}\n`);

  for (const file of filesWithDuplications) {
    await printFileDuplications(file, token, sonarHost);
    console.log("");
  }
}

/**
 * 🌐 Fetch issues from SonarQube API
 */
async function fetchIssues(
  token: string,
  projectKey: string,
  sonarHost: string,
  statuses: string[] = ["OPEN", "CONFIRMED"]
): Promise<SonarIssue[]> {
  const allIssues: SonarIssue[] = [];
  let page = 1;
  const pageSize = 500;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const url = new URL(`${sonarHost}/api/issues/search`);
    url.searchParams.set("componentKeys", projectKey);
    url.searchParams.set("statuses", statuses.join(","));
    url.searchParams.set("p", String(page));
    url.searchParams.set("ps", String(pageSize));

    const authHeader = "Basic " + btoa(token + ":");
    const response = await fetch(url.toString(), { headers: { Authorization: authHeader } });

    if (!response.ok) {
      throw new Error(`SonarQube API error: ${String(response.status)} ${response.statusText}`);
    }

    const data = (await response.json()) as SonarResponse;
    allIssues.push(...data.issues);

    const totalPages = Math.ceil(data.paging.total / pageSize);
    console.error(
      `${COLORS.BLUE}ℹ${COLORS.NC} Fetched issues page ${String(page)}/${String(totalPages)} (${String(allIssues.length)}/${String(data.paging.total)} issues)`
    );

    if (allIssues.length >= data.paging.total) break;
    page++;
  }

  return allIssues;
}

/**
 * 📊 Fetch duplication metrics from SonarQube API
 */
async function fetchDuplicationMetrics(token: string, projectKey: string, sonarHost: string): Promise<SonarMeasure[]> {
  const url = new URL(`${sonarHost}/api/measures/component`);
  url.searchParams.set("component", projectKey);
  url.searchParams.set(
    "metricKeys",
    [
      "duplicated_lines_density",
      "duplicated_lines",
      "duplicated_blocks",
      "duplicated_files",
      "new_duplicated_lines_density",
      "new_duplicated_lines",
      "new_duplicated_blocks",
    ].join(",")
  );

  const authHeader = "Basic " + btoa(token + ":");
  const response = await fetch(url.toString(), { headers: { Authorization: authHeader } });

  if (!response.ok) {
    throw new Error(`SonarQube API error: ${String(response.status)} ${response.statusText}`);
  }

  const data = (await response.json()) as SonarMeasuresResponse;
  return data.component.measures;
}

/**
 * 📄 Read token from file
 */
async function readTokenFromFile(filePath: string): Promise<string | null> {
  try {
    const content = await readFile(filePath, "utf8");
    return content.trim();
  } catch {
    return null;
  }
}

/**
 * 🚀 Main execution
 */
async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const tokenFile = join(scriptDir, ".sonar-token");
  const projectKey = "cad";
  const sonarHost = "http://localhost:9000";

  const token = (await readTokenFromFile(tokenFile)) ?? "";

  if (!token) {
    console.error(`${COLORS.RED}✖${COLORS.NC} Error: SonarQube token not found`);
    process.exit(1);
  }

  try {
    const [issues, duplicationMetrics] = await Promise.all([
      fetchIssues(token, projectKey, sonarHost),
      fetchDuplicationMetrics(token, projectKey, sonarHost),
    ]);

    printDuplicationMetrics(duplicationMetrics);
    await fetchAndPrintDuplicatedBlocks(token, projectKey, sonarHost);
    printIssues(issues, projectKey);

    console.log(`\n  View detailed report: ${COLORS.BLUE}${sonarHost}/dashboard?id=${projectKey}${COLORS.NC}\n`);
  } catch (error) {
    console.error(`\n${COLORS.RED}✖${COLORS.NC} Error:`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

void main();
