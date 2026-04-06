import { Worker, Job, UnrecoverableError } from "bullmq";

import { AppDataSource } from "#src/config/database";
import { redisConnection } from "#src/config/redis";
import { Ticket, ProcessingStatus } from "#src/entities/Ticket";
import { categorizeTicket } from "#src/external/AICategorizationService";
import { publishSSEEvent } from "#src/sse/SSEManager";
import { AICategorizationJobData } from "#src/types";
import { sleep } from "#src/utils/backoff";
import { logger } from "#src/utils/logger";
import { RateLimitError } from "#src/utils/rate-limiter";

async function process(job: Job<AICategorizationJobData>): Promise<void> {
  const { ticketId, ticketTitle, ticketDescription } = job.data;
  const repo = AppDataSource.getRepository(Ticket);

  const ticket = await repo.findOne({ where: { id: ticketId } });
  if (!ticket) throw new UnrecoverableError(`Ticket ${ticketId} not found`);

  logger.info("[AIWorker] Processing", {
    jobId: job.id,
    ticketId,
    attempt: job.attemptsMade
  });

  ticket.processingStatus = ProcessingStatus.PROCESSING;
  await repo.save(ticket);
  await publishSSEEvent({
    type: "TICKET_PROCESSING_UPDATE",
    payload: { ticketId, processingStatus: ProcessingStatus.PROCESSING }
  });

  let result;
  try {
    result = await categorizeTicket(ticketTitle, ticketDescription);
  } catch (err) {
    if (err instanceof RateLimitError) {
      ticket.processingStatus = ProcessingStatus.QUEUED;
      await repo.save(ticket);
      await sleep(Math.min(err.retryAfterSeconds * 1000, 60000));
      throw err;
    }
    const msg = err instanceof Error ? err.message : String(err);
    ticket.processingStatus = ProcessingStatus.ERROR;
    ticket.processingError = msg;
    await repo.save(ticket);
    await publishSSEEvent({
      type: "TICKET_PROCESSING_UPDATE",
      payload: { ticketId, processingStatus: ProcessingStatus.ERROR }
    });
    throw err;
  }

  ticket.aiSuggestedPriority = result.suggestedPriority;
  ticket.aiSuggestedCategory = result.suggestedCategory;
  if (!ticket.category) ticket.category = result.suggestedCategory;
  ticket.processingStatus = ProcessingStatus.PROCESSED;
  ticket.processingError = null;
  await repo.save(ticket);

  await publishSSEEvent({
    type: "TICKET_PROCESSING_UPDATE",
    payload: {
      ticketId,
      processingStatus: ProcessingStatus.PROCESSED,
      aiSuggestedPriority: result.suggestedPriority,
      aiSuggestedCategory: result.suggestedCategory
    }
  });

  logger.info("[AIWorker] Done", {
    ticketId,
    priority: result.suggestedPriority,
    category: result.suggestedCategory
  });
}

export function startAICategorizationWorker(): Worker<AICategorizationJobData> {
  const worker = new Worker<AICategorizationJobData>(
    "ai-categorization",
    process,
    {
      connection: redisConnection,
      concurrency: 3,
      limiter: { max: 5, duration: 1000 }
    }
  );
  worker.on("completed", (job) =>
    logger.info("[AIWorker] Job completed", { jobId: job.id })
  );
  worker.on("failed", (job, err) =>
    logger.error("[AIWorker] Job failed", {
      jobId: job?.id,
      ticketId: job?.data.ticketId,
      error: err.message
    })
  );
  logger.info("[AIWorker] Started");
  return worker;
}
