import { resolve, join } from "node:path";
import { logSuccess } from "./logger";

export interface WriteResult {
  filePath: string;
  sizeBytes: number;
  lineCount: number;
}

export function cleanMarkdownResponse(raw: string): string {
  let cleaned = raw.trim();

  const fencedMatch = cleaned.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/);
  if (fencedMatch?.[1]) {
    cleaned = fencedMatch[1].trim();
  }

  return cleaned;
}

export function validateChapterOutput(content: string, expectedHeading: string): boolean {
  const lines = content.split("\n");
  const firstHeading = lines.find(line => line.startsWith("#"));
  if (!firstHeading) return false;
  return firstHeading.toLowerCase().includes(expectedHeading.toLowerCase());
}

async function writeMarkdownFile(outputDir: string, filename: string, content: string): Promise<WriteResult> {
  const dir = resolve(import.meta.dirname, outputDir);
  const filePath = join(dir, filename);

  const cleaned = cleanMarkdownResponse(content);
  const lineCount = cleaned.split("\n").length;

  await Bun.write(filePath, cleaned);

  const file = Bun.file(filePath);
  const sizeBytes = file.size;

  return { filePath, sizeBytes, lineCount };
}

export async function writeChapterFile(outputDir: string, filename: string, content: string): Promise<WriteResult> {
  return writeMarkdownFile(outputDir, filename, content);
}

export async function writeChapterPartFile(
  outputDir: string,
  baseFilename: string,
  partIndex: number,
  content: string
): Promise<WriteResult> {
  const baseName = baseFilename.replace(/\.md$/, "");
  const partFilename = `${baseName}.part${String(partIndex + 1)}.md`;
  return writeMarkdownFile(outputDir, partFilename, content);
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${String(bytes)} B`;
}

export function logWriteResult(result: WriteResult): void {
  logSuccess(`Written ${result.filePath} (${formatFileSize(result.sizeBytes)}, ${String(result.lineCount)} lines)`);
}
