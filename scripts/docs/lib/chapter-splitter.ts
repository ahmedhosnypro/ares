import type { ChapterConfig } from "../chapters";
import type { PackResult } from "./repomix";
import type { DocEnvConfig } from "./config";
import {
  calculateTokenBudget,
  estimateOutputTokensForChapter,
  needsOutputSplit,
  calculateOutputSplitCount,
  formatTokenCount,
} from "./token-utils";
import { logInfo, logDebug, logWarn } from "./logger";

export interface ChapterSplit {
  index: number;
  total: number;
  sections: string[];
  systemPrompt: string;
  userPrompt: string;
  filename: string;
}

export function extractSectionsFromPrompt(userPrompt: string): string[] {
  const sections: string[] = [];
  const lines = userPrompt.split("\n");
  let currentSection: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+([\d.]+|\w\.\d+)\s+(.+)$/);
    if (sectionMatch) {
      if (currentSection !== null) {
        sections.push(currentContent.join("\n").trim());
      }
      currentSection = sectionMatch[0];
      currentContent = [line];
    } else if (currentSection !== null) {
      currentContent.push(line);
    }
  }

  if (currentSection !== null && currentContent.length > 0) {
    sections.push(currentContent.join("\n").trim());
  }

  if (sections.length === 0) {
    logWarn("No ##-level sections found in user prompt, falling back to full prompt as single section");
    sections.push(userPrompt.trim());
  }

  return sections;
}

export function extractSectionHeadings(userPrompt: string): string[] {
  const headings: string[] = [];
  const lines = userPrompt.split("\n");

  for (const line of lines) {
    const match = line.match(/^##\s+([\d.]+|\w\.\d+)\s+(.+)$/);
    if (match) {
      headings.push(line.trim());
    }
  }

  return headings;
}

function groupSectionsIntoParts(
  sections: string[],
  maxParts: number
): string[][] {
  if (maxParts <= 1) return [sections];

  const parts: string[][] = [];
  const sectionsPerPart = Math.ceil(sections.length / maxParts);

  for (let i = 0; i < sections.length; i += sectionsPerPart) {
    const partSections = sections.slice(i, i + sectionsPerPart);
    if (partSections.length > 0) {
      parts.push(partSections);
    }
  }

  return parts;
}

function buildSplitUserPrompt(
  originalPrompt: string,
  partSections: string[],
  partIndex: number,
  totalParts: number,
  chapterHeading: string
): string {
  const introLine = originalPrompt.split("\n").find(line => line.trim().length > 0 && !line.startsWith("#") && !line.startsWith("##"));
  const intro = introLine ? `${introLine}\n\n` : "";

  const sectionContent = partSections.join("\n\n");

  if (partIndex === 0) {
    return [
      intro.trim(),
      "",
      `Generate PART ${String(partIndex + 1)} OF ${String(totalParts)} of '${chapterHeading}'.`,
      "",
      `This is part ${String(partIndex + 1)} of ${String(totalParts)}. Generate ONLY the following sections:`,
      "",
      sectionContent,
      "",
      `Start with the chapter heading '# ${chapterHeading}' followed by the sections above.`,
      "Do NOT include sections from other parts.",
      "Output raw Markdown only, never wrap content in codeblock fences.",
    ].join("\n");
  }

  return [
    intro.trim(),
    "",
    `Generate PART ${String(partIndex + 1)} OF ${String(totalParts)} of '${chapterHeading}'.`,
    "",
    `This is part ${String(partIndex + 1)} of ${String(totalParts)}. Generate ONLY the following sections:`,
    "",
    sectionContent,
    "",
    "Do NOT repeat the chapter title heading. Start directly with the first section heading below.",
    "Do NOT include sections from other parts.",
    "Output raw Markdown only, never wrap content in codeblock fences.",
  ].join("\n");
}

export function splitChapterIntoParts(
  chapter: ChapterConfig,
  config: DocEnvConfig,
  packResult: PackResult
): ChapterSplit[] {
  const budget = calculateTokenBudget(config.MAX_INPUT_TOKENS, config.MAX_OUTPUT_TOKENS);
  const sections = extractSectionsFromPrompt(chapter.userPrompt);
  const sectionCount = sections.length;

  const estimatedOutput = estimateOutputTokensForChapter(packResult.totalTokens, sectionCount);
  const needsSplit = needsOutputSplit(estimatedOutput, budget);

  if (!needsSplit) {
    logInfo(`Chapter '${chapter.title}' estimated output: ${formatTokenCount(estimatedOutput)} — fits in single generation`);
    return [
      {
        index: 0,
        total: 1,
        sections: extractSectionHeadings(chapter.userPrompt),
        systemPrompt: chapter.systemPrompt,
        userPrompt: chapter.userPrompt,
        filename: chapter.filename,
      },
    ];
  }

  const splitCount = calculateOutputSplitCount(estimatedOutput, budget);
  logInfo(
    `Chapter '${chapter.title}' estimated output: ${formatTokenCount(estimatedOutput)} — ` +
      `needs ${String(splitCount)} parts (budget: ${formatTokenCount(budget.usableOutputTokens)} per part)`
  );

  const sectionGroups = groupSectionsIntoParts(sections, splitCount);
  const splits: ChapterSplit[] = [];

  for (let i = 0; i < sectionGroups.length; i++) {
    const partSections = sectionGroups[i];
    if (!partSections) continue;

    const headings = partSections
      .map(s => {
        const firstLine = s.split("\n")[0];
        return firstLine?.startsWith("##") ? firstLine.trim() : (firstLine?.trim() ?? "Section");
      });

    const baseFilename = chapter.filename.replace(/\.md$/, "");
    const partFilename = `${baseFilename}.part${String(i + 1)}.md`;

    const splitUserPrompt = buildSplitUserPrompt(
      chapter.userPrompt,
      partSections,
      i,
      sectionGroups.length,
      chapter.heading
    );

    splits.push({
      index: i,
      total: sectionGroups.length,
      sections: headings,
      systemPrompt: chapter.systemPrompt,
      userPrompt: splitUserPrompt,
      filename: partFilename,
    });

    logDebug(
      `Part ${String(i + 1)}: ${headings.join(", ")}`
    );
  }

  return splits;
}
