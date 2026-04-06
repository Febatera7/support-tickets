import { Repository, SelectQueryBuilder } from "typeorm";

import { AppDataSource } from "#src/config/database";
import { Ticket, TicketPriority, TicketStatus } from "#src/entities/Ticket";
import { PaginationQuery } from "#src/types";
import { getSkip } from "#src/utils/pagination";

export interface TicketFilters {
  status?: TicketStatus;
  statuses?: TicketStatus[];
  priority?: TicketPriority;
  search?: string;
  createdById?: string;
  assignedToId?: string;
  unassigned?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export class TicketRepository {
  private readonly repo: Repository<Ticket>;

  constructor() {
    this.repo = AppDataSource.getRepository(Ticket);
  }

  private applyFilters(
    qb: SelectQueryBuilder<Ticket>,
    f: TicketFilters
  ): void {
    if (f.statuses && f.statuses.length > 0) {
      qb.andWhere("ticket.status IN (:...statuses)", { statuses: f.statuses });
    } else if (f.status) {
      qb.andWhere("ticket.status = :status", { status: f.status });
    }
    if (f.priority)
      qb.andWhere("ticket.priority = :priority", { priority: f.priority });
    if (f.createdById)
      qb.andWhere("ticket.createdById = :createdById", {
        createdById: f.createdById
      });
    if (f.assignedToId)
      qb.andWhere("ticket.assignedToId = :assignedToId", {
        assignedToId: f.assignedToId
      });
    if (f.unassigned === true) qb.andWhere("ticket.assignedToId IS NULL");
    if (f.search) {
      qb.andWhere(
        "(ticket.title ILIKE :s OR ticket.description ILIKE :s OR ticket.category ILIKE :s)",
        { s: `%${f.search}%` }
      );
    }
    if (f.dateFrom)
      qb.andWhere("ticket.createdAt >= :dateFrom", { dateFrom: f.dateFrom });
    if (f.dateTo)
      qb.andWhere("ticket.createdAt <= :dateTo", { dateTo: f.dateTo });
  }

  private applyOrder(
    qb: SelectQueryBuilder<Ticket>,
    status?: TicketStatus
  ): void {
    if (status === TicketStatus.IN_PROGRESS) {
      qb.orderBy("ticket.slaDeadline", "ASC", "NULLS LAST")
        .addOrderBy("ticket.priority", "ASC");
    } else {
      qb.orderBy("ticket.priority", "ASC")
        .addOrderBy("ticket.createdAt", "ASC");
    }
  }

  findPaginated(
    filters: TicketFilters,
    pagination: PaginationQuery
  ): Promise<[Ticket[], number]> {
    const qb = this.repo
      .createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.createdBy", "createdBy")
      .leftJoinAndSelect("ticket.assignedTo", "assignedTo")
      .skip(getSkip(pagination))
      .take(pagination.limit);

    this.applyFilters(qb, filters);
    this.applyOrder(qb, filters.statuses ? filters.statuses[0] : filters.status);

    return qb.getManyAndCount();
  }

  async findById(id: string): Promise<(Ticket & { resolutionTimeMinutes: number | null }) | null> {
    const result = await this.repo
      .createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.createdBy", "createdBy")
      .leftJoinAndSelect("ticket.assignedTo", "assignedTo")
      .leftJoinAndSelect("ticket.history", "history")
      .leftJoinAndSelect("history.changedBy", "changedBy")
      .addSelect(
        `CASE WHEN ticket.resolved_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (ticket.resolved_at - ticket.created_at)) / 60
          ELSE NULL END`,
        "resolutionTimeMinutes"
      )
      .where("ticket.id = :id", { id })
      .getRawAndEntities();

    if (!result.entities[0]) return null;

    const ticket = result.entities[0] as Ticket & { resolutionTimeMinutes: number | null };
    const raw = result.raw[0] as Record<string, string | null>;
    ticket.resolutionTimeMinutes = raw["resolutionTimeMinutes"] !== null
      ? Math.round(Number(raw["resolutionTimeMinutes"]))
      : null;
    return ticket;
  }

  create(data: Partial<Ticket>): Promise<Ticket> {
    return this.repo.save(this.repo.create(data));
  }

  save(ticket: Ticket): Promise<Ticket> {
    return this.repo.save(ticket);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}