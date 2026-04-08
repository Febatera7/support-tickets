import "reflect-metadata";
import { AppDataSource } from "#src/config/database";
import { redisConnection } from "#src/config/redis";
import { startAddressEnrichmentWorker } from "#src/queues/workers/AddressEnrichmentWorker";
import { startAICategorizationWorker } from "#src/queues/workers/AICategorizationWorker";
import { startEmailValidationWorker } from "#src/queues/workers/EmailValidationWorker";
import { startEscalationWorker } from "#src/queues/workers/EscalationWorker";
import { logger } from "#src/utils/logger";

async function bootstrap(): Promise<void> {
  logger.info("[Worker] Starting");

  try {
    await AppDataSource.initialize();
    logger.info("[Worker] PostgreSQL connected");
  } catch (err) {
    logger.error("[Worker] PostgreSQL connection failed", {
      error: err instanceof Error ? err.message : String(err)
    });
    process.exit(1);
  }

  try {
    await redisConnection.ping();
    logger.info("[Worker] Redis connected");
  } catch (err) {
    logger.error("[Worker] Redis connection failed", {
      error: err instanceof Error ? err.message : String(err)
    });
    process.exit(1);
  }

  const emailWorker = startEmailValidationWorker();
  const addressWorker = startAddressEnrichmentWorker();
  const aiWorker = startAICategorizationWorker();
  const escalationWorker = startEscalationWorker();
  logger.info("[Worker] All workers running", {
    queues: ["email-validation", "address-enrichment", "ai-categorization", "ticket-escalation"]
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`[Worker] ${signal} — shutting down`);
    await Promise.all([
      emailWorker.close(),
      addressWorker.close(),
      aiWorker.close(),
      escalationWorker.close()
    ]);
    await AppDataSource.destroy();
    await redisConnection.quit();
    logger.info("[Worker] Shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
}

void bootstrap();