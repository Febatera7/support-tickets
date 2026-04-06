import { Repository } from "typeorm";

import { AppDataSource } from "#src/config/database";
import { HistoryAction, TicketHistory } from "#src/entities/TicketHistory";
import { PaginationQuery } from "#src/types";
import { getSkip } from "#src/utils/pagination";

export interface CreateHistoryInput {
  ticketId: string;
  changedById: string | null;
  action: HistoryAction;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: string | null;
}

export class TicketHistoryRepository {
  private readonly repo: Repository<TicketHistory>;

  constructor() {
    this.repo = AppDataSource.getRepository(TicketHistory);
  }

  create(input: CreateHistoryInput): Promise<TicketHistory> {
    return this.repo.save(
      this.repo.create({
        ticketId: input.ticketId,
        changedById: input.changedById,
        action: input.action,
        oldValue: input.oldValue ?? null,
        newValue: input.newValue ?? null,
        metadata: input.metadata ?? null
      })
    );
  }

  findByTicketId(ticketId: string): Promise<TicketHistory[]> {
    return this.repo.find({
      where: { ticketId },
      relations: ["changedBy"],
      order: { createdAt: "ASC" }
    });
  }

  findPaginatedByTicketId(
    ticketId: string,
    pagination: PaginationQuery
  ): Promise<[TicketHistory[], number]> {
    return this.repo.findAndCount({
      where: { ticketId },
      relations: ["changedBy"],
      order: { createdAt: "DESC" },
      skip: getSkip(pagination),
      take: pagination.limit
    });
  }
}