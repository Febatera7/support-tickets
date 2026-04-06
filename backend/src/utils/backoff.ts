import { logger } from "#src/utils/logger";

export function computeBackoffDelay(
  attempt: number,
  baseMs = 1000,
  maxMs = 32000,
  jitterMs = 500
): number {
  const exp = Math.min(baseMs * Math.pow(2, attempt - 1), maxMs);
  return Math.floor(exp + Math.random() * jitterMs);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  service: string
): Promise<T> {
  let lastError: Error = new Error("Unknown");
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === maxAttempts) break;
      const delay = computeBackoffDelay(attempt);
      logger.warn(
        `[Backoff] ${service} attempt ${attempt}/${maxAttempts} failed`,
        {
          error: lastError.message,
          retryInMs: delay
        }
      );
      await sleep(delay);
    }
  }
  throw lastError;
}
