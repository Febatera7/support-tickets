import { Worker, Job, UnrecoverableError } from "bullmq";

import { AppDataSource } from "#src/config/database";
import { redisConnection } from "#src/config/redis";
import { SLAConfig } from "#src/entities/SLAConfig";
import { Ticket, TicketPriority, TicketStatus } from "#src/entities/Ticket";
import { HistoryAction } from "#src/entities/TicketHistory";
import { scheduleEscalation } from "#src/queues/producers";
import { TicketHistoryRepository } from "#src/repositories/TicketHistoryRepository";
import { publishSSEEvent } from "#src/sse/SSEManager";
import { EscalateTicketJobData } from "#src/types";
import { logger } from "#src/utils/logger";

const PRIORITY_ESCALATION: Partial<Record<TicketPriority, TicketPriority>> = {
  [TicketPriority.LOW]: TicketPriority.MEDIUM,
  [TicketPriority.MEDIUM]: TicketPriority.HIGH,
  [TicketPriority.HIGH]: TicketPriority.CRITICAL
};

async function process(job: Job<EscalateTicketJobData>): Promise<void> {
  const { ticketId, currentPriority } = job.data;

  const ticketRepo = AppDataSource.getRepository(Ticket);
  const historyRepo = new TicketHistoryRepository();
  const slaRepo = AppDataSource.getRepository(SLAConfig);

  const ticket = await ticketRepo.findOne({ where: { id: ticketId } });
  if (!ticket) throw new UnrecoverableError(`Ticket ${ticketId} not found`);

  if (
    ticket.status === TicketStatus.RESOLVED ||
    ticket.status === TicketStatus.CLOSED
  ) {
    logger.info("[EscalationWorker] Ticket already resolved, skipping", { ticketId });
    return;
  }

  if (ticket.priority !== currentPriority) {
    logger.info("[EscalationWorker] Priority changed since scheduling, skipping", { ticketId });
    return;
  }

  const nextPriority = PRIORITY_ESCALATION[ticket.priority as TicketPriority];
  if (!nextPriority) {
    logger.info("[EscalationWorker] Already at critical, cannot escalate", { ticketId });
    return;
  }

  const oldPriority = ticket.priority;
  ticket.priority = nextPriority;

  const slaConfig = await slaRepo.findOne({ where: { priority: nextPriority } });
  if (slaConfig) {
    const d = new Date(ticket.createdAt);
    d.setHours(d.getHours() + slaConfig.resolutionTimeHours);
    ticket.slaDeadline = d;
  }

  await ticketRepo.save(ticket);

  await historyRepo.create({
    ticketId,
    action: HistoryAction.PRIORITY_CHANGED,
    oldValue: oldPriority,
    newValue: nextPriority,
    metadata: JSON.stringify({ reason: "Auto-escalated by SLA policy" })
  });

  await publishSSEEvent({
    type: "PRIORITY_CHANGED",
    payload: { ticketId, oldPriority, newPriority: nextPriority, autoEscalated: true }
  });

  logger.info("[EscalationWorker] Ticket escalated", { ticketId, oldPriority, newPriority: nextPriority });

  const nextSlaConfig = await slaRepo.findOne({ where: { priority: nextPriority } });
  if (nextSlaConfig?.autoEscalateAfterHours) {
    await scheduleEscalation(
      ticketId,
      nextPriority,
      nextSlaConfig.autoEscalateAfterHours * 3600000
    );
  }
}

export function startEscalationWorker(): Worker<EscalateTicketJobData> {
  const worker = new Worker<EscalateTicketJobData>(
    "ticket-escalation",
    process,
    {
      connection: redisConnection,
      concurrency: 10
    }
  );

  worker.on("completed", (job) =>
    logger.info("[EscalationWorker] Job completed", { jobId: job.id })
  );
  worker.on("failed", (job, err) =>
    logger.error("[EscalationWorker] Job failed", {
      jobId: job?.id,
      error: err.message
    })
  );

  logger.info("[EscalationWorker] Started");
  return worker;
}