import { redisConnection } from "#src/config/redis";
import { logger } from "#src/utils/logger";

export interface RateLimitConfig {
  service: string;
  maxCalls: number;
  windowSeconds: number;
}

export class RateLimitError extends Error {
  public readonly service: string;
  public readonly retryAfterSeconds: number;

  constructor(service: string, retryAfterSeconds: number) {
    super(
      `Rate limit exceeded for ${service}. Retry after ${retryAfterSeconds}s`
    );
    this.service = service;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function checkRateLimit(config: RateLimitConfig): Promise<void> {
  const key = `rate-limit:${config.service}`;
  const current = await redisConnection.incr(key);

  if (current === 1) {
    await redisConnection.expire(key, config.windowSeconds);
  }

  if (current > config.maxCalls) {
    const ttl = await redisConnection.ttl(key);
    logger.warn("[RateLimit] Limit reached", {
      service: config.service,
      current,
      max: config.maxCalls,
      retryAfterSeconds: ttl
    });
    throw new RateLimitError(config.service, ttl);
  }
}
