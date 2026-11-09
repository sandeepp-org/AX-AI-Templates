import { RedisOperationError } from "../errors.js";

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

type WithRetryOptions = {
  maxRetryAttempts: number;
  baseRetryDelayMs: number;
};

/**
 * Bounded retry wrapper for Redis operations.
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  options: WithRetryOptions
): Promise<T> => {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < options.maxRetryAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === options.maxRetryAttempts - 1;
      if (isLastAttempt) {
        break;
      }

      // Exponential backoff with a small base delay.
      const delayMs = options.baseRetryDelayMs * 2 ** attempt;
      await sleep(delayMs);
    }
  }

  throw new RedisOperationError("Redis operation failed after retries", {
    cause: lastError,
  });
};

export { withRetry };
