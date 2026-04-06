import { Redis } from "ioredis";

import { env } from "#src/config/env";

const options = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times: number): number => Math.min(times * 100, 3000)
};

export const redisConnection = new Redis(options);
export const redisPubSub = new Redis(options);

redisConnection.on("error", (err: Error) => {
  console.error("[Redis] Connection error:", err.message);
});

redisPubSub.on("error", (err: Error) => {
  console.error("[Redis PubSub] Connection error:", err.message);
});
