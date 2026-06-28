import { loadConfig, validateConfig, type DocEnvConfig } from "./lib/config";
import { packRepository, type PackResult } from "./lib/repomix";
import { generateChapter } from "./lib/ai-client";
import { writeChapterFile, writeChapterPartFile, logWriteResult, validateChapterOutput } from "./lib/output";
import { calculateTokenBudget, formatTokenCount } from "./lib/token-utils";
import { splitChapterIntoParts, type ChapterSplit } from "./lib/chapter-splitter";
import { aggregateChapterParts } from "./lib/aggregate";
import { CHAPTERS, getChapterById, getChaptersByIds, type ChapterConfig } from "./chapters";
import { getMermaidSystemPromptSection } from "./lib/mermaid-rules";
import { validateAllDiagrams, clearErrorLog, MERMAID_ERROR_LOG } from "./validate-mermaid";
import { resolve, join } from "node:path";
import { readdir, unlink } from "node:fs/promises";
import { existsSync, readFileSync, appendFileSync, mkdirSync } from "node:fs";
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

export interface GenerateOptions {
  all: boolean;
  chapters: string[];
  dryRun: boolean;
  debug: boolean;
  forceCompress: boolean;
  help: boolean;
  keepParts: boolean;
  splitThreshold: number | null;
  timeout: number | null;
  aggregateOnly: boolean;
  aggregateFile: string | null;
  aggregateParts: number | null;
  includeDiagrams: boolean | null;
  pageTarget: number | null;
  validateMermaid: boolean;
  clearMermaidLog: boolean;
}

function parseArgs(): GenerateOptions {
  const args = process.argv.slice(2);

  let splitThreshold: number | null = null;
  let timeout: number | null = null;
  let aggregateFile: string | null = null;
  let aggregateParts: number | null = null;
  let includeDiagrams: boolean | null = null;
  let pageTarget: number | null = null;

  for (let i = 0; i < args.length; i++) {
    const nextArg = args[i + 1];
    if (args[i] === "--split-threshold" && nextArg) {
      splitThreshold = parseFloat(nextArg);
    }
    if (args[i] === "--timeout" && nextArg) {
      timeout = parseInt(nextArg, 10);
    }
    if (args[i] === "--aggregate" && nextArg) {
      aggregateFile = nextArg;
      const partsIdx = args.indexOf("--parts");
      const partsVal = partsIdx !== -1 ? args[partsIdx + 1] : undefined;
      if (partsVal) {
        aggregateParts = parseInt(partsVal, 10);
      }
    }
    if (args[i] === "--include-diagrams") {
      includeDiagrams = true;
    }
    if (args[i] === "--no-diagrams") {
      includeDiagrams = false;
    }
    if (args[i] === "--page-target" && nextArg) {
      pageTarget = parseInt(nextArg, 10);
    }
  }

  const aggregateOnly = args.includes("--aggregate") && !args.includes("--all") && parseChapterArgs(args).length === 0;

  return {
    all: args.includes("--all"),
    chapters: parseChapterArgs(args),
    dryRun: args.includes("--dry-run"),
    debug: args.includes("--debug"),
    forceCompress: args.includes("--compress"),
    help: args.includes("--help") || args.includes("-h"),
    keepParts: args.includes("--keep-parts"),
    splitThreshold,
    timeout,
    aggregateOnly,
    aggregateFile,
    aggregateParts,
    includeDiagrams,
    pageTarget,
    validateMermaid: args.includes("--validate-mermaid") || args.includes("--mermaid-check"),
    clearMermaidLog: args.includes("--clear-mermaid-log"),
  };
}

function parseChapterArgs(args: string[]): string[] {
  const chapters: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--chapter" && args[i + 1]) {
      const chapterId = args[i + 1];
      if (chapterId) {
        chapters.push(chapterId);
      }
    }
  }
  return chapters;
}

function printHelp(): void {
  printBanner();
  console.log(`
Ares Documentation Generator

Usage:
  bun run generate.ts [options]

Options:
  --all                      Generate all chapters
  --chapter <id>             Generate specific chapter (1-5, appendix-a, appendix-b)
                            Can be used multiple times: --chapter 3 --chapter 4
  --compress                 Force code compression in repomix output
  --dry-run                  Pack repository and count tokens without calling AI
  --debug                    Enable debug logging
  --keep-parts               Keep intermediate .partN.md files after aggregation
  --split-threshold <ratio>  Adjust token estimation per section (default: 0.15)
  --timeout <minutes>        Override streaming timeout per part (default: 10)
  --include-diagrams         Enable Mermaid diagram generation in chapters
  --no-diagrams              Disable Mermaid diagram generation
  --page-target <n>          Target A4 page count for validation (default: 200, uses PDF if available)
  --aggregate <filename>     Aggregate existing part files into a final chapter
  --parts <n>                Expected number of parts (used with --aggregate)
  --validate-mermaid         Run mermaid validation after generation, log errors
  --clear-mermaid-log        Clear mermaid error log before generation
  --help, -h                 Show this help message

Chapter IDs:
  1          Chapter 1: Introduction
  2          Chapter 2: Background Materials
  3          Chapter 3: System Design
  4          Chapter 4: Results and Discussion
  5          Chapter 5: Conclusion and Future Work
  appendix-a Appendix A: File Structure & Execution
  appendix-b Appendix B: References

Examples:
  bun run generate.ts --all                      # Generate everything
  bun run generate.ts --chapter 3                # Generate chapter 3 only
  bun run generate.ts --chapter 3 --chapter 4     # Generate chapters 3 and 4
  bun run generate.ts --dry-run                   # Check token counts only
  bun run generate.ts --compress --debug         # Compress with debug info
  bun run generate.ts --chapter 3 --keep-parts    # Keep part files after aggregation
  bun run generate.ts --all --include-diagrams    # Generate all with Mermaid diagrams
  bun run generate.ts --aggregate chapter_3_system_design.md --parts 2

PDF Generation (accurate page count):
  bun run pdf                                    # Render all chapters to PDF via Quarto
  bun run pdf --count-only                       # Count pages of existing PDF only
  bun run pdf --clean                            # Clean rebuild

Configuration:
  Copy .env.example to .env and fill in your API credentials.
  Set MAX_INPUT_TOKENS to match your AI model's context window.
  Set MAX_OUTPUT_TOKENS to control output length per part (default: 65536).
`);
}

function selectChapters(options: GenerateOptions): ChapterConfig[] {
  if (options.all) return CHAPTERS;
  if (options.chapters.length > 0) {
    const selected = getChaptersByIds(options.chapters);
    const notFound = options.chapters.filter(id => !getChapterById(id));
    for (const id of notFound) {
      logWarn(`Chapter '${id}' not found, skipping`);
    }
    return selected;
  }
  return CHAPTERS;
}

async function packForChapter(
  config: DocEnvConfig,
  chapter: ChapterConfig,
  forceCompress: boolean
): Promise<PackResult> {
  logInfo(`Packing context for: ${chapter.title}`);
  logInfo(`Include patterns: ${chapter.includePatterns.join(", ")}`);

  const packResult = await packRepository(config, forceCompress, chapter.includePatterns);

  logInfo(`Files packed: ${String(packResult.totalFiles)}`);
  logInfo(`Total tokens: ${formatTokenCount(packResult.totalTokens)}`);
  logInfo(`Compressed: ${packResult.wasCompressed ? "yes" : "no"}`);

  return packResult;
}

async function cleanupOrphanPartFiles(outputDir: string, baseFilename: string, partCount: number): Promise<void> {
  const dir = resolve(import.meta.dirname, outputDir);
  const baseName = baseFilename.replace(/\.md$/, "");

  try {
    const entries = await readdir(dir);
    const promises: Promise<void>[] = [];

    for (const entry of entries) {
      for (let i = 1; i <= partCount; i++) {
        const partName = `${baseName}.part${String(i)}.md`;
        if (entry === partName) {
          promises.push(unlink(join(dir, partName)).catch(() => {}));
        }
      }
    }

    await Promise.all(promises);
    logInfo(`Cleaned up orphan part files for ${baseFilename}`);
  } catch {
    logWarn(`Failed to clean up orphan part files for ${baseFilename}`);
  }
}

async function generateOnePart(
  config: DocEnvConfig,
  split: ChapterSplit,
  context: string,
  timeoutMinutes?: number
): Promise<{ success: boolean; content?: string; error?: string }> {
  startSpinner(`Streaming part ${String(split.index + 1)}/${String(split.total)}...`);

  try {
    const result = await generateChapter(config, split.systemPrompt, split.userPrompt, context, timeoutMinutes);

    stopSpinner(
      true,
      `Part ${String(split.index + 1)} done (${result.finishReason}, ${String(result.content.length)} chars)`
    );
    return { success: true, content: result.content };
  } catch (error) {
    stopSpinner(false, `Part ${String(split.index + 1)} failed`);
    const message = error instanceof Error ? error.message : "Unknown error";
    logError(`Failed to generate part ${String(split.index + 1)}: ${message}`);
    if (error instanceof Error && error.stack) {
      logDebug(error.stack);
    }
    return { success: false, error: message };
  }
}

async function generateOneChapter(
  config: DocEnvConfig,
  chapter: ChapterConfig,
  packResult: PackResult,
  options: GenerateOptions
): Promise<{ success: boolean; error?: string }> {
  logStep(`Generating ${chapter.title}`);

  const effectiveChapter = chapter.includeDiagrams
    ? { ...chapter, systemPrompt: `${chapter.systemPrompt}\n\n${getMermaidSystemPromptSection()}` }
    : chapter;

  const splits = splitChapterIntoParts(effectiveChapter, config, packResult);

  const timeoutMinutes = options.timeout ?? config.GENERATION_TIMEOUT;

  if (splits.length === 1) {
    const split = splits[0];
    if (!split) throw new Error("Split array reported length 1 but element is undefined");
    logInfo("Single part — generating directly...");

    const partResult = await generateOnePart(config, split, packResult.content, timeoutMinutes);

    if (!partResult.success || !partResult.content) {
      return { success: false, error: partResult.error };
    }

    const writeResult = await writeChapterFile(config.OUTPUT_DIR, chapter.filename, partResult.content);

    const headingPart = chapter.heading.split(":")[0] ?? "";
    const isValid = validateChapterOutput(partResult.content, headingPart);
    if (!isValid) {
      logWarn(`Output heading may not match expected: '${chapter.heading}'`);
    }

    logWriteResult(writeResult);
    return { success: true };
  }

  logInfo(`Chapter split into ${String(splits.length)} parts — generating each with streaming...`);

  const partResults: { success: boolean; content?: string; error?: string }[] = [];

  for (const split of splits) {
    logSubstep(`Part ${String(split.index + 1)}/${String(splits.length)}: ${split.sections.join(", ")}`);
    const result = await generateOnePart(config, split, packResult.content, timeoutMinutes);
    partResults.push(result);

    if (result.success && result.content) {
      const writeResult = await writeChapterPartFile(config.OUTPUT_DIR, chapter.filename, split.index, result.content);
      logWriteResult(writeResult);
    }
  }

  const failCount = partResults.filter(r => !r.success).length;
  if (failCount > 0) {
    logError(`${String(failCount)} of ${String(splits.length)} parts failed for ${chapter.title}`);
    const failedPartIndices = partResults.map((r, i) => (!r.success ? i : -1)).filter(i => i >= 0);
    logWarn(`Failed parts: ${failedPartIndices.map(i => String(i + 1)).join(", ")}`);

    await cleanupOrphanPartFiles(config.OUTPUT_DIR, chapter.filename, splits.length);
    return { success: false, error: `${String(failCount)} parts failed` };
  }

  logInfo("All parts generated — aggregating...");

  try {
    const aggregateResult = await aggregateChapterParts(
      config.OUTPUT_DIR,
      chapter.filename,
      splits.length,
      options.keepParts
    );

    logSuccess(
      `Aggregated ${String(aggregateResult.partsAggregated)} parts → ${chapter.filename} ` +
        `(${String(aggregateResult.lineCount)} lines)`
    );

    if (!options.keepParts && aggregateResult.partsDeleted > 0) {
      logInfo(`Cleaned up ${String(aggregateResult.partsDeleted)} part files`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError(`Aggregation failed: ${message}`);
    logWarn("Part files remain in output directory for manual inspection");
    return { success: false, error: `Aggregation failed: ${message}` };
  }

  return { success: true };
}

async function dryRunChapter(
  config: DocEnvConfig,
  chapter: ChapterConfig,
  forceCompress: boolean
): Promise<PackResult> {
  logStep(`Dry Run - ${chapter.title}`);
  return packForChapter(config, chapter, forceCompress);
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  maxConcurrency: number
): Promise<(T | undefined)[]> {
  if (tasks.length === 0) return [];

  const results: (T | undefined)[] = Array.from({ length: tasks.length }, () => undefined as T | undefined);
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      const task = tasks[index];

      if (!task) continue;

      try {
        results[index] = await task();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        logError(`Task ${String(index)} failed: ${message}`);
      }

      if (nextIndex < tasks.length) {
        void runNext();
      }
    }
  }

  const initialWorkers = Math.min(maxConcurrency, tasks.length);
  const workers = Array.from({ length: initialWorkers }, () => runNext());

  await Promise.all(workers);
  return results;
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.debug) {
    setDebugMode(true);
  }

  printBanner();

  let config: DocEnvConfig;
  try {
    config = loadConfig();
    validateConfig(config);
    logSuccess("Configuration loaded and validated");
    logInfo(`API endpoint: ${config.CUSTOM_API_ENDPOINT}`);
    logInfo(`Model: ${config.AI_MODEL}`);
    logInfo(`Max input tokens: ${String(config.MAX_INPUT_TOKENS)}`);
    logInfo(`Max output tokens: ${String(config.MAX_OUTPUT_TOKENS)}`);
    logInfo(`Generation timeout: ${String(config.GENERATION_TIMEOUT)}min`);
    logInfo(`Output directory: ${config.OUTPUT_DIR}`);

    logInfo(`Concurrency: ${String(config.CONCURRENCY)}`);
    if (options.splitThreshold !== null) {
      logInfo(`Split threshold: ${String(options.splitThreshold)}`);
    }
    if (options.keepParts) {
      logInfo("Keep parts: yes");
    }
    const effectiveDiagrams = options.includeDiagrams ?? config.INCLUDE_DIAGRAMS;
    logInfo(`Include diagrams: ${effectiveDiagrams ? "yes" : "no"}`);
    const effectivePageTarget = options.pageTarget ?? config.PAGE_TARGET;
    logInfo(`Page target: ${String(effectivePageTarget)} A4 pages`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError(`Configuration error: ${message}`);
    logInfo("Copy .env.example to .env and fill in your credentials.");
    process.exit(1);
  }

  if (options.aggregateOnly && options.aggregateFile) {
    logStep("Aggregation Mode");
    try {
      const result = await aggregateChapterParts(
        config.OUTPUT_DIR,
        options.aggregateFile,
        options.aggregateParts ?? undefined,
        options.keepParts
      );
      logSuccess(`Aggregated: ${String(result.partsAggregated)} parts → ${result.filePath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logError(`Aggregation failed: ${message}`);
      process.exit(1);
    }
    return;
  }

  const chapters = selectChapters(options);
  if (chapters.length === 0) {
    logError("No chapters selected. Use --all or --chapter <id>");
    process.exit(1);
  }

  logInfo(`Chapters to generate: ${String(chapters.length)}`);
  for (const ch of chapters) {
    logSubstep(`${ch.id}: ${ch.title}`);
  }

  if (options.dryRun) {
    const budget = calculateTokenBudget(config.MAX_INPUT_TOKENS, config.MAX_OUTPUT_TOKENS);
    logStep("Dry Run - Packing Per-Chapter Context");

    for (const chapter of chapters) {
      const packResult = await dryRunChapter(config, chapter, options.forceCompress);
      const fits = packResult.totalTokens <= budget.usableContextTokens;
      const status = fits ? "FITS" : "EXCEEDS";
      logInfo(
        `  ${chapter.id}: ${formatTokenCount(packResult.totalTokens)} tokens - ${status} budget (${formatTokenCount(budget.usableContextTokens)})`
      );
      if (!fits) {
        logWarn(`  Chapter ${chapter.id} context exceeds budget. Consider more specific include patterns.`);
      }

      const splits = splitChapterIntoParts(chapter, config, packResult);
      if (splits.length > 1) {
        logInfo(`  Will split into ${String(splits.length)} parts for generation`);
      }
    }

    process.exit(0);
  }

  logStep("Packing All Chapter Contexts");

  const packResults: (PackResult | null)[] = Array.from({ length: chapters.length }, () => null as PackResult | null);
  const packTasks = chapters.map(async (chapter, index) => {
    try {
      packResults[index] = await packForChapter(config, chapter, options.forceCompress);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logError(`Failed to pack context for ${chapter.title}: ${message}`);
      packResults[index] = null;
    }
  });

  await Promise.all(packTasks);

  const successfulPacks = packResults.filter(r => r !== null).length;
  if (successfulPacks === 0) {
    logError("No chapter contexts were packed successfully. Aborting.");
    process.exit(1);
  }

  logStep(`Generating Chapters (Concurrency: ${String(config.CONCURRENCY)})`);

  const generationTasks = chapters.map((chapter, index) => async () => {
    const packResult = packResults[index];
    if (!packResult) {
      logError(`Skipping ${chapter.title} - context packing failed`);
      return { success: false, error: "Context packing failed" };
    }
    return generateOneChapter(config, chapter, packResult, options);
  });

  const results = await runWithConcurrency(generationTasks, config.CONCURRENCY);

  type GenResult = { success: boolean; error?: string };
  const typedResults: GenResult[] = results.map(r => r ?? { success: false, error: "Task returned undefined" });
  const successCount = typedResults.filter(r => r.success).length;
  const failCount = typedResults.filter(r => !r.success).length;
  const undefCount = results.filter(r => r === undefined).length;

  logStep("Generation Summary");
  logSuccess(`Generated: ${String(successCount)} chapter(s)`);
  if (failCount > 0) {
    logError(`Failed: ${String(failCount)} chapter(s)`);
    const failedChapters = chapters.filter((_, i) => !typedResults[i]?.success);
    if (failedChapters.length > 0) {
      logWarn("Failed chapters:");
      for (const ch of failedChapters) {
        logWarn(`  - ${ch.title}`);
      }
    }
  }
  logInfo(`Output directory: ${config.OUTPUT_DIR}`);

  logInfo(`Output directory: ${config.OUTPUT_DIR}`);

  if (options.validateMermaid || options.clearMermaidLog) {
    if (options.clearMermaidLog) {
      clearErrorLog();
      logInfo("Cleared mermaid error log");
    }

    logStep("Mermaid Validation (post-generation)");

    const diagramChapters = chapters.filter(ch => ch.includeDiagrams);
    if (diagramChapters.length === 0) {
      logWarn("No diagram chapters found in this run — skipping mermaid validation");
    } else {
      const outputDir = resolve(import.meta.dirname, config.OUTPUT_DIR);
      const { results, totalErrors, totalWarnings } = await validateAllDiagrams(outputDir, true);

      if (totalErrors > 0) {
        logWarn(`Found ${String(totalErrors)} mermaid error(s), ${String(totalWarnings)} warning(s)`);
        logInfo(`Appending errors to: ${MERMAID_ERROR_LOG}`);

        const timestamp = new Date().toISOString();
        let logContent = `\n=== Post-Generation Validation - ${timestamp} ===\n`;

        for (const result of results) {
          if (result.errors.length === 0) continue;
          const fileName = result.filePath.split(/[/\\]/).pop() ?? result.filePath;
          const errorEntries = result.errors
            .filter(e => e.severity === "error")
            .map(e => `  [${e.severity}] ${e.message}`);
          if (errorEntries.length > 0) {
            logContent += `\nFile: ${fileName}:${String(result.lineNumber)}\n`;
            logContent += `Diagram: ${result.diagramType}\n`;
            logContent += errorEntries.join("\n") + "\n";
          }
        }
        logContent += `\nTotal errors: ${String(totalErrors)}\n`;

        const logDir = resolve(import.meta.dirname);
        mkdirSync(logDir, { recursive: true });
        appendFileSync(MERMAID_ERROR_LOG, logContent, "utf-8");
        logInfo(`Error log updated: ${MERMAID_ERROR_LOG}`);
      } else {
        logSuccess(`All mermaid diagrams valid (${String(totalWarnings)} style warnings)`);
      }

      const diagramsWithErrors = results.filter(r => r.errors.some(e => e.severity === "error"));
      if (diagramsWithErrors.length > 0) {
        logWarn(`Diagrams with errors: ${String(diagramsWithErrors.length)}`);
        for (const r of diagramsWithErrors) {
          const fileName = r.filePath.split(/[/\\]/).pop() ?? r.filePath;
          const errorCount = r.errors.filter(e => e.severity === "error").length;
          logSubstep(`${fileName}:${String(r.lineNumber)} (${r.diagramType}) — ${String(errorCount)} error(s)`);
        }
        logInfo("Run `bun run mermaid-iterate --chapter <id>` to auto-fix via prompt improvement");
      }
    }
  }

  if (undefCount > 0) {
    logWarn(`${String(undefCount)} chapter(s) did not return a result. Check error logs above.`);
  }

  const effectivePageTarget = options.pageTarget ?? config.PAGE_TARGET;
  if (effectivePageTarget > 0) {
    logStep("Page Count Check (PDF-based)");
    const pdfFile = resolve(import.meta.dirname, "_pdf", "ares-docs.pdf");
    try {
      if (existsSync(pdfFile)) {
        const buf = readFileSync(pdfFile);
        const text = buf.toString("latin1");
        const pageMatches = text.match(/\/Type\s*\/Page\b(?!\s*s)/g);
        const pageCount = pageMatches ? pageMatches.length : 0;
        logInfo(`Accurate A4 page count (from PDF): ${String(pageCount)}`);
        if (pageCount < effectivePageTarget) {
          logWarn(
            `Actual ${String(pageCount)} pages is below target of ${String(effectivePageTarget)}. Consider increasing MAX_OUTPUT_TOKENS or expanding chapter prompts.`
          );
        } else {
          logSuccess(`Actual ${String(pageCount)} pages meets target of ${String(effectivePageTarget)}`);
        }
      } else {
        logWarn("PDF not found at _pdf/ares-docs.pdf. Run `bun run pdf` first to get an accurate page count.");
        logInfo("Falling back to character-based estimation...");
        const outputDir = resolve(import.meta.dirname, config.OUTPUT_DIR);
        const entries = await readdir(outputDir);
        const mdFiles = entries.filter(e => e.endsWith(".md") && !e.includes(".part"));
        let totalChars = 0;
        for (const f of mdFiles) {
          const filePath = join(outputDir, f);
          const file = Bun.file(filePath);
          const text = await file.text();
          totalChars += text.length;
        }
        const estimatedPages = Math.round(totalChars / 3000);
        logInfo(`Total characters across ${String(mdFiles.length)} files: ${totalChars.toLocaleString()}`);
        logInfo(`Estimated A4 pages (approx 3000 chars/page): ${String(estimatedPages)}`);
        if (estimatedPages < effectivePageTarget) {
          logWarn(
            `Estimated ${String(estimatedPages)} pages is below target of ${String(effectivePageTarget)}. Consider increasing MAX_OUTPUT_TOKENS or expanding chapter prompts.`
          );
        } else {
          logSuccess(`Estimated ${String(estimatedPages)} pages meets target of ${String(effectivePageTarget)}`);
        }
      }
    } catch {
      logWarn("Could not read PDF page count. Run `bun run pdf` first for accurate results.");
    }
  }
}

try {
  await main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  logError(`Generation failed: ${message}`);
  if (error instanceof Error && error.stack) {
    logDebug(error.stack);
  }
  process.exit(1);
}
