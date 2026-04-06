import { TicketPriority } from "#src/entities/Ticket";
import { SLAConfigRepository } from "#src/repositories/SLAConfigRepository";
import { logger } from "#src/utils/logger";

const DEFAULTS = [
  { priority: TicketPriority.LOW,      responseTimeHours: 24, resolutionTimeHours: 168 },
  { priority: TicketPriority.MEDIUM,   responseTimeHours: 12, resolutionTimeHours: 72  },
  { priority: TicketPriority.HIGH,     responseTimeHours: 4,  resolutionTimeHours: 24  },
  { priority: TicketPriority.CRITICAL, responseTimeHours: 1,  resolutionTimeHours: 2   }
];

export async function seedSLAConfigs(): Promise<void> {
  const repo = new SLAConfigRepository();
  const existing = await repo.findAll();

  if (existing.length === 4) {
    logger.info("[Seed] SLA configs already exist, skipping");
    return;
  }

  for (const defaults of DEFAULTS) {
    await repo.upsert(defaults.priority, {
      responseTimeHours: defaults.responseTimeHours,
      resolutionTimeHours: defaults.resolutionTimeHours,
      autoEscalateAfterHours: null
    });
  }

  logger.info("[Seed] SLA configs seeded with defaults");
}