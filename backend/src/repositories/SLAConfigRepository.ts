import { Repository } from "typeorm";

import { AppDataSource } from "#src/config/database";
import { SLAConfig } from "#src/entities/SLAConfig";
import { TicketPriority } from "#src/entities/Ticket";

export class SLAConfigRepository {
  private readonly repo: Repository<SLAConfig>;

  constructor() {
    this.repo = AppDataSource.getRepository(SLAConfig);
  }

  findAll(): Promise<SLAConfig[]> {
    return this.repo.find({ relations: ["updatedBy"] });
  }

  findByPriority(priority: TicketPriority): Promise<SLAConfig | null> {
    return this.repo.findOne({ where: { priority } });
  }

  async upsert(
    priority: TicketPriority,
    data: Partial<SLAConfig>
  ): Promise<SLAConfig> {
    const existing = await this.findByPriority(priority);
    if (existing) {
      this.repo.merge(existing, data);
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ priority, ...data }));
  }
}
