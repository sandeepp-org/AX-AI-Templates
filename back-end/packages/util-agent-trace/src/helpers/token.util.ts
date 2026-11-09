import type { TokenUsage } from "../types.js";

/**
 * Estimates token count from a string using a simple whitespace/punctuation heuristic.
 * Approximates the tokenization behavior of most LLM tokenizers (roughly 1 token per ~4 chars).
 * Use actual token counts from LLM responses when available.
 */
const estimateTokenCount = (text: string): number => {
  if (!text || text.trim().length === 0) return 0;
  const charBasedEstimate = Math.ceil(text.length / 4);
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(wordCount, charBasedEstimate);
};

/**
 * Merges two TokenUsage objects. When `totalTokens` is not explicitly set in `b`,
 * it is computed as `(inputTokens ?? 0) + (outputTokens ?? 0)`.
 */
const mergeTokenUsage = (a: TokenUsage, b: Partial<TokenUsage>): TokenUsage => {
  const inputTokens = b.inputTokens ?? a.inputTokens;
  const outputTokens = b.outputTokens ?? a.outputTokens;

  let totalTokens: number | undefined;
  if (b.totalTokens !== undefined) {
    totalTokens = b.totalTokens;
  } else if (inputTokens !== undefined || outputTokens !== undefined) {
    totalTokens = (inputTokens ?? 0) + (outputTokens ?? 0);
  } else {
    totalTokens = a.totalTokens;
  }

  return { inputTokens, outputTokens, totalTokens };
};

/**
 * Validates a TokenUsage object. Throws if any count is negative.
 */
const assertValidTokenUsage = (usage: TokenUsage): void => {
  if (usage.inputTokens !== undefined && usage.inputTokens < 0) {
    throw new RangeError(
      `inputTokens must be non-negative, got ${usage.inputTokens}`
    );
  }
  if (usage.outputTokens !== undefined && usage.outputTokens < 0) {
    throw new RangeError(
      `outputTokens must be non-negative, got ${usage.outputTokens}`
    );
  }
  if (usage.totalTokens !== undefined && usage.totalTokens < 0) {
    throw new RangeError(
      `totalTokens must be non-negative, got ${usage.totalTokens}`
    );
  }
};

export { estimateTokenCount, mergeTokenUsage, assertValidTokenUsage };
