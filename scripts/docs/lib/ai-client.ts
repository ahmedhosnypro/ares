import OpenAI from "openai";
import type { DocEnvConfig } from "./config";
import { logDebug, logInfo, updateSpinner } from "./logger";

export interface GenerateChapterResult {
  content: string;
  model: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
}

function createClient(config: DocEnvConfig, timeoutMinutes: number): OpenAI {
  return new OpenAI({
    baseURL: config.CUSTOM_API_ENDPOINT,
    apiKey: config.CUSTOM_API_KEY,
    timeout: timeoutMinutes * 60 * 1000,
    maxRetries: 3,
  });
}

export async function generateChapter(
  config: DocEnvConfig,
  systemPrompt: string,
  userPrompt: string,
  context: string,
  timeoutMinutes?: number
): Promise<GenerateChapterResult> {
  const effectiveTimeout = timeoutMinutes ?? config.GENERATION_TIMEOUT;
  const client = createClient(config, effectiveTimeout);

  const fullUserMessage = `${userPrompt}\n\n---\n\n# Repository Context\n\n${context}`;

  logDebug(`System prompt length: ${String(systemPrompt.length)} chars`);
  logDebug(`User prompt + context length: ${String(fullUserMessage.length)} chars`);

  const maxTokens = config.MAX_OUTPUT_TOKENS;

  logInfo(`Starting streaming generation (max_output: ${String(maxTokens)}, timeout: ${String(effectiveTimeout)}min)...`);

  const stream = await client.chat.completions.create({
    model: config.AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: fullUserMessage },
    ],
    temperature: 0.3,
    max_tokens: maxTokens,
    stream: true,
    stream_options: { include_usage: true },
  });

  const chunks: string[] = [];
  let finishReason = "unknown";
  let chunkCount = 0;
  let lastLoggedChunk = 0;
  let usageInfo: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null = null;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    const chunkFinishReason = chunk.choices[0]?.finish_reason;

    if (delta?.content) {
      chunks.push(delta.content);
      chunkCount++;

      if (chunkCount - lastLoggedChunk >= 50) {
        const estimatedChars = chunks.reduce((sum, c) => sum + c.length, 0);
        updateSpinner(`Streaming... ${String(estimatedChars)} chars received (${String(chunkCount)} chunks)`);
        lastLoggedChunk = chunkCount;
      }
    }

    if (chunkFinishReason) {
      finishReason = chunkFinishReason;
    }

    if (chunk.usage) {
      usageInfo = {
        promptTokens: chunk.usage.prompt_tokens,
        completionTokens: chunk.usage.completion_tokens,
        totalTokens: chunk.usage.total_tokens,
      };
      logInfo(
        `Tokens - Prompt: ${String(chunk.usage.prompt_tokens)}, ` +
          `Completion: ${String(chunk.usage.completion_tokens)}, ` +
          `Total: ${String(chunk.usage.total_tokens)}`
      );
    }
  }

  const accumulatedContent = chunks.join("");

  if (!accumulatedContent) {
    throw new Error("AI returned empty streaming response");
  }

  logInfo(`Streaming complete: ${String(accumulatedContent.length)} chars, ${String(chunkCount)} chunks, finish_reason: ${finishReason}`);

  return {
    content: accumulatedContent,
    model: config.AI_MODEL,
    finishReason,
    usage: usageInfo,
  };
}
