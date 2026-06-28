import { resolve, join } from "node:path";
import { runCli, type CliOptions } from "repomix";
import type { DocEnvConfig } from "./config";
import { calculateTokenBudget, needsContextSplit, formatTokenCount, calculateSplitChunks } from "./token-utils";
import { logInfo, logSuccess, logWarn, startSpinner, stopSpinner } from "./logger";

export interface PackResult {
  content: string;
  totalFiles: number;
  totalTokens: number;
  totalCharacters: number;
  wasCompressed: boolean;
  splitChunks: number;
}

const TEMP_OUTPUT_FILENAME = "repomix-output.md";

async function readPackOutput(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  return await file.text();
}

async function cleanUpOutput(filePath: string): Promise<void> {
  try {
    const file = Bun.file(filePath);
    const exists = await file.exists();
    if (exists) {
      await Bun.write(filePath, "");
    }
  } catch {
    // ignore cleanup errors
  }
}

export async function packRepository(
  config: DocEnvConfig,
  forceCompress = false,
  includePatterns?: string[]
): Promise<PackResult> {
  const budget = calculateTokenBudget(config.MAX_INPUT_TOKENS, config.MAX_OUTPUT_TOKENS);
  const outputDir = resolve(import.meta.dirname, config.OUTPUT_DIR);
  const outputPath = join(outputDir, TEMP_OUTPUT_FILENAME);
  const repoRoot = resolve(import.meta.dirname, "../../..");

  logInfo(`Repository root: ${repoRoot}`);
  logInfo(
    `Token budget: ${formatTokenCount(budget.usableContextTokens)} usable / ${formatTokenCount(budget.maxInputTokens)} max`
  );

  if (includePatterns && includePatterns.length > 0) {
    logInfo(`Include patterns: ${includePatterns.join(", ")}`);
  }

  const shouldCompress = forceCompress || config.COMPRESS_CONTEXT;
  startSpinner(`Packing repository (compress: ${String(shouldCompress)})...`);

  const cliOptions: CliOptions = {
    output: outputPath,
    style: "markdown",
    compress: shouldCompress,
    quiet: true,
    removeEmptyLines: config.REMOVE_EMPTY_LINES,
    removeComments: config.REMOVE_COMMENTS,
    fileSummary: true,
    directoryStructure: true,
    topFilesLen: 10,
    tokenCountEncoding: "o200k_base",
  };

  if (includePatterns && includePatterns.length > 0) {
    cliOptions.include = includePatterns.join(",");
  }

  const result = await runCli([repoRoot], repoRoot, cliOptions);

  if (!result || !("packResult" in result)) {
    stopSpinner(false, "Repomix returned no result");
    throw new Error("Repomix failed to pack the repository. Check your configuration.");
  }

  const packResult = result.packResult;
  stopSpinner(true, `Packed ${String(packResult.totalFiles)} files`);

  logInfo(`Total tokens: ${formatTokenCount(packResult.totalTokens)}`);
  logInfo(`Total characters: ${packResult.totalCharacters.toLocaleString()}`);

  if (packResult.totalTokens === 0 || packResult.totalCharacters === 0) {
    throw new Error("Repomix returned empty output. Check your include/ignore patterns.");
  }

  const content = await readPackOutput(outputPath);

  const needsSplit = needsContextSplit(packResult.totalTokens, budget);
  const splitChunks = needsSplit ? calculateSplitChunks(packResult.totalTokens, budget) : 1;

  if (needsSplit) {
    logWarn(
      `Context exceeds token budget (${formatTokenCount(packResult.totalTokens)} > ${formatTokenCount(budget.usableContextTokens)})`
    );
    logInfo(`Would need ${String(splitChunks)} chunks for full context`);

    if (!shouldCompress) {
      logInfo("Retrying with code compression enabled...");
      return packRepository(config, true, includePatterns);
    }

    logWarn("Proceeding with full context (model may handle large contexts)");
  } else {
    logSuccess(
      `Context fits within token budget (${formatTokenCount(packResult.totalTokens)} <= ${formatTokenCount(budget.usableContextTokens)})`
    );
  }

  await cleanUpOutput(outputPath);

  return {
    content,
    totalFiles: packResult.totalFiles,
    totalTokens: packResult.totalTokens,
    totalCharacters: packResult.totalCharacters,
    wasCompressed: shouldCompress,
    splitChunks,
  };
}
