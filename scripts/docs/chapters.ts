export interface ChapterConfig {
  id: string;
  filename: string;
  title: string;
  heading: string;
  systemPrompt: string;
  userPrompt: string;
  includePatterns: string[];
}

import { chapter1 } from "./chapters/chapter1";
import { chapter2 } from "./chapters/chapter2";
import { chapter3 } from "./chapters/chapter3";
import { chapter4 } from "./chapters/chapter4";
import { chapter5 } from "./chapters/chapter5";
import { chapter6 } from "./chapters/chapter6";
import { chapter7 } from "./chapters/chapter7";
import { appendixA } from "./chapters/appendix-a";
import { appendixB } from "./chapters/appendix-b";

export const CHAPTERS: ChapterConfig[] = [
  chapter1,
  chapter2,
  chapter3,
  chapter4,
  chapter5,
  chapter6,
  chapter7,
  appendixA,
  appendixB,
];

export function getChapterById(id: string): ChapterConfig | undefined {
  return CHAPTERS.find(ch => ch.id === id);
}

export function getChaptersByIds(ids: string[]): ChapterConfig[] {
  return ids.map(id => getChapterById(id)).filter((ch): ch is ChapterConfig => ch !== undefined);
}

export function getAllChapterIds(): string[] {
  return CHAPTERS.map(ch => ch.id);
}
