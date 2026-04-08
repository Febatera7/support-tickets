import { Queue } from "bullmq";

import { redisConnection } from "#src/config/redis";
import {
  EmailValidationJobData,
  AddressEnrichmentJobData,
  AICategorizationJobData,
  EscalateTicketJobData
} from "#src/types";
import { logger } from "#src/utils/logger";

const jobDefaults = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 1000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 }
};

export const emailValidationQueue = new Queue<EmailValidationJobData>(
  "email-validation",
  {
    connection: redisConnection,
    defaultJobOptions: jobDefaults
  }
);

export const addressEnrichmentQueue = new Queue<AddressEnrichmentJobData>(
  "address-enrichment",
  {
    connection: redisConnection,
    defaultJobOptions: jobDefaults
  }
);

export const aiCategorizationQueue = new Queue<AICategorizationJobData>(
  "ai-categorization",
  {
    connection: redisConnection,
    defaultJobOptions: { ...jobDefaults, attempts: 3 }
  }
);

export async function enqueueEmailValidation(
  data: EmailValidationJobData
): Promise<void> {
  await emailValidationQueue.add("validate-email", data, {
    jobId: `email-${data.userId}`
  });
  logger.info("[Queue] Email validation enqueued", { userId: data.userId });
}

export async function enqueueAddressEnrichment(
  data: AddressEnrichmentJobData
): Promise<void> {
  await addressEnrichmentQueue.add("enrich-address", data, {
    jobId: `address-${data.userId}`
  });
  logger.info("[Queue] Address enrichment enqueued", { userId: data.userId });
}

export async function enqueueAICategorization(
  data: AICategorizationJobData
): Promise<void> {
  await aiCategorizationQueue.add("categorize-ticket", data);
  logger.info("[Queue] AI categorization enqueued", {
    ticketId: data.ticketId
  });
}

export const escalateQueue = new Queue<EscalateTicketJobData>(
  "ticket-escalation",
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential" as const, delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 }
    }
  }
);

export async function scheduleEscalation(
  ticketId: string,
  currentPriority: string,
  delayMs: number
): Promise<void> {
  const jobId = `escalate-${ticketId}`;
  await escalateQueue.remove(jobId);
  await escalateQueue.add(
    "escalate-ticket",
    { ticketId, currentPriority },
    { jobId, delay: delayMs }
  );
  logger.info("[Queue] Escalation scheduled", { ticketId, delayMs });
}

export async function cancelEscalation(ticketId: string): Promise<void> {
  const jobId = `escalate-${ticketId}`;
  await escalateQueue.remove(jobId);
  logger.info("[Queue] Escalation cancelled", { ticketId });
}