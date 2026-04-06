import "reflect-metadata";
import { createApp } from "#src/app";
import { AppDataSource } from "#src/config/database";
import { env } from "#src/config/env";
import { redisConnection } from "#src/config/redis";
import { seedAdminUser } from "#src/seeds/adminSeed";
import { seedSLAConfigs } from "#src/seeds/slaSeed";
import { logger } from "#src/utils/logger";

async function bootstrap(): Promise<void> {
  logger.info("[API] Starting", { env: env.NODE_ENV });

  try {
    await AppDataSource.initialize();
    logger.info("[API] PostgreSQL connected");
  } catch (err) {
    logger.error("[API] PostgreSQL connection failed", {
      error: err instanceof Error ? err.message : String(err)
    });
    process.exit(1);
  }

  try {
    await seedAdminUser();
    await seedSLAConfigs();
  } catch (err) {
    logger.error("[API] Seed failed", {
      error: err instanceof Error ? err.message : String(err)
    });
    process.exit(1);
  }

  try {
    await seedSLAConfigs();
  } catch (err) {
    logger.error("[API] SLA seed failed", {
      error: err instanceof Error ? err.message : String(err)
    });
  }

  try {
    await redisConnection.ping();
    logger.info("[API] Redis connected");
  } catch (err) {
    logger.error("[API] Redis connection failed", {
      error: err instanceof Error ? err.message : String(err)
    });
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.API_PORT, () => {
    logger.info(`[API] Listening on port ${env.API_PORT}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`[API] ${signal} — shutting down`);
    server.close(async () => {
      await AppDataSource.destroy();
      await redisConnection.quit();
      logger.info("[API] Shutdown complete");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
}

void bootstrap();