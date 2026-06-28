import { resolve, join } from "node:path";
import { readdir, unlink } from "node:fs/promises";
import { logInfo, logSuccess, logWarn } from "./logger";
import { formatFileSize } from "./output";

export interface AggregateResult {
  filePath: string;
  sizeBytes: number;
  lineCount: number;
  partsAggregated: number;
  partsDeleted: number;
}

function stripDuplicateChapterHeading(content: string, isFirstPart: boolean, chapterHeadingPattern: string): string {
  if (isFirstPart) return content;

  const headingRegex = new RegExp(
    `^#\\s+${chapterHeadingPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n?`,
    "i"
  );
  return content.replace(headingRegex, "").trimStart();
}

export async function aggregateChapterParts(
  outputDir: string,
  baseFilename: string,
  expectedParts?: number,
  keepParts: boolean = false
): Promise<AggregateResult> {
  const dir = resolve(import.meta.dirname, outputDir);
  const baseName = baseFilename.replace(/\.md$/, "");

  const dirEntries = await readdir(dir);
  const partPattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.part(\\d+)\\.md$`);

  const partFiles: { index: number; filename: string }[] = [];

  for (const entry of dirEntries) {
    const match = entry.match(partPattern);
    if (match?.[1]) {
      partFiles.push({
        index: parseInt(match[1], 10),
        filename: entry,
      });
    }
  }

  partFiles.sort((a, b) => a.index - b.index);

  if (partFiles.length === 0) {
    throw new Error(`No part files found for '${baseFilename}' in ${dir}`);
  }

  if (expectedParts !== undefined && partFiles.length !== expectedParts) {
    logWarn(
      `Expected ${String(expectedParts)} part files but found ${String(partFiles.length)} for '${baseFilename}'`
    );
  }

  logInfo(`Aggregating ${String(partFiles.length)} parts for '${baseFilename}'...`);

  const parts: string[] = [];
  const chapterHeadingPattern = baseName.replace(/_/g, "[\\s_]+").replace(/\d+/g, "\\d+");

  for (let i = 0; i < partFiles.length; i++) {
    const partEntry = partFiles[i];
    if (!partEntry) continue;
    const partPath = join(dir, partEntry.filename);
    const file = Bun.file(partPath);
    const content = await file.text();
    const cleaned = stripDuplicateChapterHeading(content.trim(), i === 0, chapterHeadingPattern);
    parts.push(cleaned);
  }

  const aggregated = parts.join("\n\n");
  const finalPath = join(dir, baseFilename);

  await Bun.write(finalPath, aggregated);

  const finalFile = Bun.file(finalPath);
  const sizeBytes = finalFile.size;
  const lineCount = aggregated.split("\n").length;

  let partsDeleted = 0;
  if (!keepParts) {
    const deletePromises = partFiles.map(async (partEntry) => {
      const partPath = join(dir, partEntry.filename);
      try {
        await unlink(partPath);
        return true;
      } catch {
        logWarn(`Failed to delete part file: ${partEntry.filename}`);
        return false;
      }
    });
    const deleteResults = await Promise.all(deletePromises);
    partsDeleted = deleteResults.filter(Boolean).length;
  }

  logSuccess(
    `Aggregated ${String(partFiles.length)} parts → ${finalPath} ` +
      `(${formatFileSize(sizeBytes)}, ${String(lineCount)} lines)`
  );

  return {
    filePath: finalPath,
    sizeBytes,
    lineCount,
    partsAggregated: partFiles.length,
    partsDeleted,
  };
}
