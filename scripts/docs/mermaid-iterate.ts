#!/usr/bin/env bun

import { resolve } from "node:path";
import chalk from "chalk";
import { loadConfig, validateConfig, type DocEnvConfig } from "./lib/config";
import { getMermaidSystemPromptSection } from "./lib/mermaid-rules";
import { extractMermaidDiagrams, type MermaidValidationResult } from "./validate-mermaid";
import { generateChapter } from "./lib/ai-client";
import { packRepository, type PackResult } from "./lib/repomix";
import { writeChapterFile } from "./lib/output";
import { getChapterById, type ChapterConfig } from "./chapters";
import {
  printBanner,
  logStep,
  logInfo,
  logSuccess,
  logError,
  logWarn,
  logDebug,
  logSubstep,
  setDebugMode,
  startSpinner,
  stopSpinner,
} from "./lib/logger";

interface IterateOptions {
  chapterId: string;
  maxIterations: number;
  dryRun: boolean;
  debug: boolean;
}

interface CategorizedErrors {
  brTags: boolean;
  pieSumNot100: boolean;
  gitGraphNoBranches: boolean;
  gitGraphCommitIdSpaces: boolean;
  quadrantChartMissingAxes: boolean;
  quadrantChartInvalidFormat: boolean;
  ganttMissingDateFormat: boolean;
  hardcodedHexColors: boolean;
  mermaidSyntaxError: boolean;
}

interface IterationResult {
  iteration: number;
  errorsBefore: number;
  errorsAfter: number;
  improvements: string[];
}

function parseArgs(): IterateOptions {
  const args = process.argv.slice(2);

  let chapterId = "";
  let maxIterations = 3;
  let dryRun = false;
  let debug = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === "--chapter" && nextArg) {
      chapterId = nextArg;
    } else if (arg === "--max-iterations" && nextArg) {
      maxIterations = parseInt(nextArg, 10);
      if (Number.isNaN(maxIterations) || maxIterations < 1) {
        console.error(chalk.red("Error: --max-iterations must be a positive integer"));
        process.exit(1);
      }
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--debug") {
      debug = true;
    }
  }

  if (!chapterId) {
    console.error(chalk.red("Error: --chapter <id> is required"));
    console.log("\nUsage: bun run mermaid-iterate.ts --chapter <id> [--max-iterations 3] [--dry-run] [--debug]");
    process.exit(1);
  }

  return { chapterId, maxIterations, dryRun, debug };
}

function categorizeErrors(results: MermaidValidationResult[]): CategorizedErrors {
  const categories: CategorizedErrors = {
    brTags: false,
    pieSumNot100: false,
    gitGraphNoBranches: false,
    gitGraphCommitIdSpaces: false,
    quadrantChartMissingAxes: false,
    quadrantChartInvalidFormat: false,
    ganttMissingDateFormat: false,
    hardcodedHexColors: false,
    mermaidSyntaxError: false,
  };

  for (const result of results) {
    for (const error of result.errors) {
      const msg = error.message.toLowerCase();

      if (msg.includes("<br") || msg.includes("br/>") || msg.includes("br>")) {
        categories.brTags = true;
      }
      if (result.diagramType === "pie" && msg.includes("sum to") && msg.includes("100")) {
        categories.pieSumNot100 = true;
      }
      if (result.diagramType === "gitGraph" && msg.includes("no branches")) {
        categories.gitGraphNoBranches = true;
      }
      if (result.diagramType === "gitGraph" && msg.includes("commit id") && msg.includes("spaces")) {
        categories.gitGraphCommitIdSpaces = true;
      }
      if (result.diagramType === "quadrantChart" && msg.includes("missing x-axis or y-axis")) {
        categories.quadrantChartMissingAxes = true;
      }
      if (result.diagramType === "quadrantChart" && msg.includes("invalid quadrantchart format")) {
        categories.quadrantChartInvalidFormat = true;
      }
      if (result.diagramType === "gantt" && msg.includes("missing dateformat")) {
        categories.ganttMissingDateFormat = true;
      }
      if (msg.includes("hardcoded color") || msg.includes("fill:#") || msg.includes("stroke:#")) {
        categories.hardcodedHexColors = true;
      }
      if (
        error.severity === "error" &&
        (msg.includes("parse error") || msg.includes("lexical error") || msg.includes("mermaid parse error"))
      ) {
        categories.mermaidSyntaxError = true;
      }
    }
  }

  return categories;
}

function buildImprovements(categories: CategorizedErrors, iteration: number): string[] {
  const improvements: string[] = [];
  const prefix = `[Iteration ${String(iteration)} correction]`;

  if (categories.brTags) {
    improvements.push(
      `${prefix} REMINDER: <br/> and <br> tags are NOT valid in Mermaid. You MUST use \\n for line breaks. This is a syntax error that breaks rendering.`
    );
  }
  if (categories.pieSumNot100) {
    improvements.push(
      `${prefix} REMINDER: Pie chart values MUST sum to exactly 100. Double-check your arithmetic before writing the pie chart. Calculate the sum mentally and adjust values.`
    );
  }
  if (categories.gitGraphNoBranches) {
    improvements.push(
      `${prefix} REMINDER: gitGraph diagrams require at least one 'branch' statement. Without branches, gitGraph won't render correctly.`
    );
  }
  if (categories.gitGraphCommitIdSpaces) {
    improvements.push(
      `${prefix} REMINDER: gitGraph commit IDs must not contain spaces. Use hyphens or camelCase. Example: commit id: "Feature-Login" NOT commit id: "Feature Login".`
    );
  }
  if (categories.quadrantChartMissingAxes) {
    improvements.push(
      `${prefix} REMINDER: quadrantChart requires both x-axis and y-axis declarations. Format: x-axis Low --> High`
    );
  }
  if (categories.quadrantChartInvalidFormat) {
    improvements.push(
      `${prefix} REMINDER: quadrantChart quadrants must use format 'quadrant-1 Label' NOT 'quadrant-1[Label]' or 'quadrant-1 Label : 1'.`
    );
  }
  if (categories.ganttMissingDateFormat) {
    improvements.push(
      `${prefix} REMINDER: gantt charts require a dateFormat declaration on the first line. Example: dateFormat YYYY-MM-DD`
    );
  }
  if (categories.hardcodedHexColors) {
    improvements.push(
      `${prefix} REMINDER: Do NOT use hardcoded hex colors (e.g., fill:#f9f, stroke:#333). Mermaid classDef and style lines should use semantic class names only.`
    );
  }
  if (categories.mermaidSyntaxError) {
    improvements.push(
      `${prefix} CRITICAL: One or more Mermaid diagrams FAILED TO COMPILE (parse/lexical error detected by mmdc). You must carefully review and fix the Mermaid syntax. Common causes: invalid arrow syntax, unclosed brackets, missing keywords, incorrect indentation, or unsupported features. Use only the standard Mermaid syntax documented at https://mermaid.js.org/`
    );
  }

  return improvements;
}

function buildImprovedMermaidSection(improvements: string[]): string {
  const baseSection = getMermaidSystemPromptSection();

  if (improvements.length === 0) {
    return baseSection;
  }

  const improvementsBlock = improvements.map(imp => `- ${imp}`).join("\n");

  return `${baseSection}\n\nADDITIONAL RULES (based on previous validation errors):\n${improvementsBlock}`;
}

function countErrors(results: MermaidValidationResult[]): {
  errors: number;
  warnings: number;
} {
  let errors = 0;
  let warnings = 0;

  for (const result of results) {
    for (const error of result.errors) {
      if (error.severity === "error") {
        errors++;
      } else {
        warnings++;
      }
    }
  }

  return { errors, warnings };
}

function logValidationResults(results: MermaidValidationResult[]): void {
  const { errors, warnings } = countErrors(results);
  const diagramsWithError = results.filter(r => r.errors.length > 0);

  logInfo(`Diagrams checked: ${String(results.length)}`);
  logInfo(
    `Errors: ${String(errors)}, Warnings: ${String(warnings)}, Diagrams with issues: ${String(diagramsWithError.length)}`
  );

  for (const result of diagramsWithError) {
    const fileName = result.filePath.split(/[/\\]/).pop() ?? result.filePath;
    logSubstep(
      `${fileName}:${String(result.lineNumber)} (${result.diagramType}) — ${String(result.errors.length)} issue(s)`
    );
    for (const err of result.errors) {
      const label = err.severity === "error" ? chalk.red("  ERROR:") : chalk.yellow("  WARN:");
      console.log(`    ${label} ${err.message}`);
    }
  }
}

async function validateChapterFile(chapter: ChapterConfig, config: DocEnvConfig): Promise<MermaidValidationResult[]> {
  const outputDir = resolve(import.meta.dirname, config.OUTPUT_DIR);
  const filePath = resolve(outputDir, chapter.filename);

  logDebug(`Validating file: ${filePath}`);

  try {
    const results = await extractMermaidDiagrams(filePath, true);
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError(`Failed to validate ${chapter.filename}: ${message}`);
    return [];
  }
}

async function regenerateChapter(
  config: DocEnvConfig,
  chapter: ChapterConfig,
  improvedMermaidSection: string,
  iteration: number
): Promise<{ success: boolean; content?: string; error?: string }> {
  const effectiveSystemPrompt = `${chapter.systemPrompt}\n\n${improvedMermaidSection}`;

  logInfo(`Iteration ${String(iteration)}: Regenerating ${chapter.title}...`);
  logDebug(`System prompt length: ${String(effectiveSystemPrompt.length)} chars (with improved mermaid rules)`);

  let packResult: PackResult;
  try {
    startSpinner("Packing repository context...");
    packResult = await packRepository(config, false, chapter.includePatterns);
    stopSpinner(true, `Packed ${String(packResult.totalFiles)} files (${String(packResult.totalTokens)} tokens)`);
  } catch (error) {
    stopSpinner(false, "Context packing failed");
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `Context packing failed: ${message}` };
  }

  startSpinner("Generating chapter with improved mermaid rules...");
  try {
    const result = await generateChapter(
      config,
      effectiveSystemPrompt,
      chapter.userPrompt,
      packResult.content,
      config.GENERATION_TIMEOUT
    );

    stopSpinner(true, `Generated ${String(result.content.length)} chars (finish: ${result.finishReason})`);

    return { success: true, content: result.content };
  } catch (error) {
    stopSpinner(false, "Generation failed");
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `Generation failed: ${message}` };
  }
}

async function runIteration(
  config: DocEnvConfig,
  chapter: ChapterConfig,
  iteration: number,
  maxIterations: number,
  accumulatedImprovements: string[],
  preValidatedResults?: MermaidValidationResult[]
): Promise<IterationResult> {
  logStep(`Improvement Iteration ${String(iteration)}/${String(maxIterations)}`);

  let results: MermaidValidationResult[];
  let errorsBefore: number;

  if (preValidatedResults) {
    results = preValidatedResults;
    const errorCount = countErrors(results);
    errorsBefore = errorCount.errors;
    logInfo("Using pre-validated results (skipping redundant validation)...");
  } else {
    logInfo("Validating current generated file...");
    results = await validateChapterFile(chapter, config);
    const errorCount = countErrors(results);
    errorsBefore = errorCount.errors;
  }

  logValidationResults(results);

  if (errorsBefore === 0) {
    logSuccess("No errors found — diagrams are valid!");
    return { iteration, errorsBefore: 0, errorsAfter: 0, improvements: [] };
  }

  logWarn(`Found ${String(errorsBefore)} error(s) — analyzing for targeted improvements...`);

  const categories = categorizeErrors(results);
  const newImprovements = buildImprovements(categories, iteration);

  logInfo(`Generated ${String(newImprovements.length)} targeted improvement rule(s):`);
  for (const imp of newImprovements) {
    logSubstep(imp);
  }
  accumulatedImprovements.push(...newImprovements);

  const improvedSection = buildImprovedMermaidSection(accumulatedImprovements);

  logDebug(`Improved mermaid section length: ${String(improvedSection.length)} chars`);

  const regenResult = await regenerateChapter(config, chapter, improvedSection, iteration);

  if (!regenResult.success || !regenResult.content) {
    logError(`Regeneration failed: ${regenResult.error ?? "Unknown error"}`);
    return {
      iteration,
      errorsBefore,
      errorsAfter: errorsBefore,
      improvements: newImprovements,
    };
  }

  const writeResult = await writeChapterFile(config.OUTPUT_DIR, chapter.filename, regenResult.content);

  logSuccess(`Written ${writeResult.filePath} (${String(writeResult.lineCount)} lines)`);

  logInfo("Re-validating after regeneration...");
  const postResults = await validateChapterFile(chapter, config);
  const postErrorCount = countErrors(postResults);

  logValidationResults(postResults);

  const errorsAfter = postErrorCount.errors;

  if (errorsAfter === 0) {
    logSuccess("All errors resolved after regeneration!");
  } else if (errorsAfter < errorsBefore) {
    logWarn(`Errors reduced from ${String(errorsBefore)} to ${String(errorsAfter)}, but some remain.`);
  } else {
    logWarn(`Errors not reduced (${String(errorsBefore)} → ${String(errorsAfter)}). Different approach may be needed.`);
  }

  return { iteration, errorsBefore, errorsAfter, improvements: newImprovements };
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.debug) {
    setDebugMode(true);
  }

  printBanner();
  console.log(chalk.cyan("  Mermaid Diagram Validation & Prompt Improvement Loop"));
  console.log("");

  let config: DocEnvConfig;
  try {
    config = loadConfig();
    validateConfig(config);
    logSuccess("Configuration loaded and validated");
    logInfo(`Model: ${config.AI_MODEL}`);
    logInfo(`Output directory: ${config.OUTPUT_DIR}`);
    logInfo(`Max iterations: ${String(options.maxIterations)}`);
    if (options.dryRun) {
      logInfo("Mode: DRY RUN (validate only, no regeneration)");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError(`Configuration error: ${message}`);
    process.exit(1);
  }

  const chapter = getChapterById(options.chapterId);
  if (!chapter) {
    logError(`Chapter '${options.chapterId}' not found. Available IDs: 1, 2, 3, 4, 5, appendix-a, appendix-b`);
    process.exit(1);
  }

  if (!chapter.includeDiagrams) {
    logError(
      `Chapter '${chapter.id}' (${chapter.title}) does not have includeDiagrams enabled. This script only works with diagram chapters.`
    );
    process.exit(1);
  }

  logStep("Initial Validation");

  const initialResults = await validateChapterFile(chapter, config);
  const initialErrorCount = countErrors(initialResults);

  logValidationResults(initialResults);

  if (initialErrorCount.errors === 0) {
    logSuccess("No mermaid errors found — nothing to improve!");
    return;
  }

  logWarn(
    `Found ${String(initialErrorCount.errors)} error(s) across ${String(initialResults.filter(r => r.errors.some(e => e.severity === "error")).length)} diagram(s)`
  );

  if (options.dryRun) {
    logStep("Dry Run Complete");
    logInfo("Skipped regeneration (dry-run mode). Run without --dry-run to iterate.");
    return;
  }

  const iterationResults: IterationResult[] = [];
  const accumulatedImprovements: string[] = [];
  let carryResults: MermaidValidationResult[] | undefined = initialResults;

  for (let i = 1; i <= options.maxIterations; i++) {
    const iterResult = await runIteration(
      config,
      chapter,
      i,
      options.maxIterations,
      accumulatedImprovements,
      carryResults
    );
    iterationResults.push(iterResult);
    carryResults = undefined;

    if (iterResult.errorsAfter === 0) {
      break;
    }
  }

  logStep("Final Summary");

  const lastIteration = iterationResults[iterationResults.length - 1];
  const finalErrorCount = lastIteration?.errorsAfter ?? initialErrorCount.errors;

  console.log("");
  console.log(chalk.bold("Iteration History:"));
  console.log(chalk.gray("-".repeat(60)));

  for (const iter of iterationResults) {
    const trend =
      iter.errorsAfter === 0
        ? chalk.green("RESOLVED")
        : iter.errorsAfter < iter.errorsBefore
          ? chalk.yellow("IMPROVED")
          : chalk.red("NO CHANGE");

    console.log(
      `  Iteration ${String(iter.iteration)}: ${String(iter.errorsBefore)} → ${String(iter.errorsAfter)} errors  ${trend}`
    );
    if (iter.improvements.length > 0) {
      console.log(chalk.dim(`    Rules added: ${String(iter.improvements.length)}`));
    }
  }

  console.log(chalk.gray("-".repeat(60)));

  if (finalErrorCount === 0) {
    console.log("");
    console.log(
      chalk.green.bold(`  SUCCESS — All mermaid errors resolved after ${String(iterationResults.length)} iteration(s)!`)
    );
    console.log("");
  } else {
    console.log("");
    console.log(
      chalk.red.bold(
        `  FAILURE — ${String(finalErrorCount)} error(s) remain after ${String(options.maxIterations)} iteration(s)`
      )
    );
    console.log(chalk.yellow("  Consider manually updating the mermaid rules in scripts/docs/lib/mermaid-rules.ts"));
    console.log("");
    process.exit(1);
  }
}

try {
  await main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  logError(`Mermaid iteration failed: ${message}`);
  if (error instanceof Error && error.stack) {
    logDebug(error.stack);
  }
  process.exit(1);
}
