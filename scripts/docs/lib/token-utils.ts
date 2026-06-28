export const TOKENS_PER_CHAR_ESTIMATE = 0.25;
export const PROMPT_OVERHEAD_TOKENS = 4000;
export const RESPONSE_RESERVE_TOKENS = 8000;
export const SAFETY_BUFFER_TOKENS = 2000;

export interface TokenBudget {
  maxInputTokens: number;
  maxOutputTokens: number;
  promptOverhead: number;
  responseReserve: number;
  usableContextTokens: number;
  usableOutputTokens: number;
}

export function calculateTokenBudget(maxInputTokens: number, maxOutputTokens: number = 65536): TokenBudget {
  const promptOverhead = PROMPT_OVERHEAD_TOKENS;
  const responseReserve = RESPONSE_RESERVE_TOKENS;
  const usableContextTokens = maxInputTokens - promptOverhead - responseReserve - SAFETY_BUFFER_TOKENS;
  const usableOutputTokens = Math.floor(maxOutputTokens * 0.85);

  return {
    maxInputTokens,
    maxOutputTokens,
    promptOverhead,
    responseReserve,
    usableContextTokens: Math.max(usableContextTokens, 1000),
    usableOutputTokens: Math.max(usableOutputTokens, 1000),
  };
}

export function estimateTokensFromChars(charCount: number): number {
  return Math.ceil(charCount * TOKENS_PER_CHAR_ESTIMATE);
}

export function needsContextSplit(totalTokens: number, budget: TokenBudget): boolean {
  return totalTokens > budget.usableContextTokens;
}

export function calculateSplitChunks(totalTokens: number, budget: TokenBudget): number {
  if (totalTokens <= budget.usableContextTokens) return 1;
  return Math.ceil(totalTokens / budget.usableContextTokens);
}

export function estimateOutputTokensForChapter(contextTokens: number, sectionCount: number): number {
  const baseOutputPerSection = Math.max(contextTokens * 0.15, 2000);
  return Math.ceil(baseOutputPerSection * sectionCount);
}

export function needsOutputSplit(estimatedOutputTokens: number, budget: TokenBudget): boolean {
  return estimatedOutputTokens > budget.usableOutputTokens;
}

export function calculateOutputSplitCount(estimatedOutputTokens: number, budget: TokenBudget): number {
  if (estimatedOutputTokens <= budget.usableOutputTokens) return 1;
  return Math.ceil(estimatedOutputTokens / budget.usableOutputTokens);
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}
