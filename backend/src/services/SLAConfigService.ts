import { SLAConfig } from "#src/entities/SLAConfig";
import { TicketPriority } from "#src/entities/Ticket";
import { SLAConfigRepository } from "#src/repositories/SLAConfigRepository";
import { AuthenticatedUser } from "#src/types";
import { logger } from "#src/utils/logger";
import { UpdateSLAConfigDTO } from "#src/validators/schemas";

const DEFAULTS: Record<
  TicketPriority,
  { responseTimeHours: number; resolutionTimeHours: number }
> = {
  [TicketPriority.LOW]: { responseTimeHours: 48, resolutionTimeHours: 120 },
  [TicketPriority.MEDIUM]: { responseTimeHours: 24, resolutionTimeHours: 72 },
  [TicketPriority.HIGH]: { responseTimeHours: 8, resolutionTimeHours: 24 },
  [TicketPriority.CRITICAL]: { responseTimeHours: 1, resolutionTimeHours: 4 }
};

export class SLAConfigService {
  private readonly repo = new SLAConfigRepository();

  async findAll(): Promise<SLAConfig[]> {
    const configs = await this.repo.findAll();
    if (configs.length > 0) return configs;
    logger.info("[SLAConfigService] Seeding defaults");
    return Promise.all(
      Object.values(TicketPriority).map((p) => this.repo.upsert(p, DEFAULTS[p]))
    );
  }

  async update(
    priority: TicketPriority,
    dto: UpdateSLAConfigDTO,
    actor: AuthenticatedUser
  ): Promise<SLAConfig> {
    logger.info("[SLAConfigService] Updating", {
      priority,
      actorId: actor.dbUserId
    });
    return this.repo.upsert(priority, {
      responseTimeHours: dto.responseTimeHours,
      resolutionTimeHours: dto.resolutionTimeHours,
      autoEscalateAfterHours: dto.autoEscalateAfterHours ?? null,
      updatedById: actor.dbUserId
    });
  }
}
