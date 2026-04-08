import {
  Ticket,
  TicketPriority,
  TicketStatus,
  ProcessingStatus
} from "#src/entities/Ticket";
import { HistoryAction, TicketHistory  } from "#src/entities/TicketHistory";
import { UserRole } from "#src/entities/User";
import { enqueueAICategorization, scheduleEscalation, cancelEscalation } from "#src/queues/producers";
import { SLAConfigRepository } from "#src/repositories/SLAConfigRepository";
import { TicketHistoryRepository } from "#src/repositories/TicketHistoryRepository";
import { TicketFilters, TicketRepository } from "#src/repositories/TicketRepository";
import { UserRepository } from "#src/repositories/UserRepository";
import { publishSSEEvent } from "#src/sse/SSEManager";
import { AuthenticatedUser, PaginatedResponse } from "#src/types";
import { ForbiddenError, NotFoundError } from "#src/utils/errors";
import { logger } from "#src/utils/logger";
import { buildPaginatedResponse, parsePagination } from "#src/utils/pagination";
import {
  AssignTicketDTO,
  CreateTicketDTO,
  UpdateTicketCategoryDTO,
  TicketListQueryDTO,
  UpdateTicketPriorityDTO,
  UpdateTicketStatusDTO
} from "#src/validators/schemas";

export class TicketService {
  private readonly ticketRepo = new TicketRepository();
  private readonly historyRepo = new TicketHistoryRepository();
  private readonly slaRepo = new SLAConfigRepository();
  private readonly userRepo = new UserRepository();

  private async computeDeadline(
    priority: TicketPriority,
    fromDate: Date
  ): Promise<Date | null> {
    const config = await this.slaRepo.findByPriority(priority);
    if (!config) return null;
    const d = new Date(fromDate);
    d.setHours(d.getHours() + config.resolutionTimeHours);
    return d;
  }

  async createTicket(
    dto: CreateTicketDTO,
    actor: AuthenticatedUser
  ): Promise<Ticket> {
    const priority = dto.priority ?? TicketPriority.MEDIUM;
    const now = new Date();
    const slaDeadline = await this.computeDeadline(priority, now);

    const ticket = await this.ticketRepo.create({
      title: dto.title,
      description: dto.description,
      priority,
      category: dto.category ?? null,
      status: TicketStatus.OPEN,
      processingStatus: ProcessingStatus.QUEUED,
      createdById: actor.dbUserId,
      slaDeadline
    });

    await this.historyRepo.create({
      ticketId: ticket.id,
      action: HistoryAction.CREATED,
      newValue: ticket.status
    });

    await enqueueAICategorization({
      userId: actor.dbUserId,
      ticketId: ticket.id,
      ticketTitle: dto.title,
      ticketDescription: dto.description
    });

    const slaForEscalation = await this.slaRepo.findByPriority(priority);
    if (slaForEscalation?.autoEscalateAfterHours) {
      await scheduleEscalation(
        ticket.id,
        priority,
        slaForEscalation.autoEscalateAfterHours * 3600000
      );
    }

    logger.info("[TicketService] Ticket created", {
      ticketId: ticket.id,
      userId: actor.dbUserId
    });
    return ticket;
  }

  private buildFilters(query: TicketListQueryDTO): TicketFilters {
    const filters: TicketFilters = {};
    if (query.statuses) {
      filters.statuses = query.statuses.split(",") as TicketStatus[];
    } else if (query.status) {
      filters.status = query.status;
    }
    if (query.priority) filters.priority = query.priority;
    if (query.search) filters.search = query.search;
    if (query.assignedToId) filters.assignedToId = query.assignedToId;
    if (query.createdById) filters.createdById = query.createdById;
    if (query.dateFrom) filters.dateFrom = new Date(query.dateFrom);
    if (query.dateTo) filters.dateTo = new Date(query.dateTo);
    return filters;
  }

  async listTickets(
    query: TicketListQueryDTO,
    actor: AuthenticatedUser
  ): Promise<PaginatedResponse<Ticket>> {
    const pagination = parsePagination(query.page, query.limit);
    const filters = this.buildFilters(query);

    if (actor.role === UserRole.USER) {
      filters.createdById = actor.dbUserId;
    }

    const isCompleted = filters.statuses
      ? filters.statuses.every(s => s === TicketStatus.RESOLVED || s === TicketStatus.CLOSED)
      : filters.status === TicketStatus.RESOLVED || filters.status === TicketStatus.CLOSED;
    const [tickets, total] = await this.ticketRepo.findPaginated(filters, pagination, isCompleted);
    return buildPaginatedResponse(tickets, total, pagination);
  }

  async listAvailable(
    query: TicketListQueryDTO
  ): Promise<PaginatedResponse<Ticket>> {
    const pagination = parsePagination(query.page, query.limit);
    const filters = this.buildFilters(query);
    filters.unassigned = true;

    const [tickets, total] = await this.ticketRepo.findPaginated(filters, pagination);
    return buildPaginatedResponse(tickets, total, pagination);
  }

  async updateStatus(
    ticketId: string,
    dto: UpdateTicketStatusDTO,
    actor: AuthenticatedUser
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError("Ticket");
    if (actor.role === UserRole.OPERATOR && ticket.assignedToId !== actor.dbUserId) {
      throw new ForbiddenError("Ticket não atribuído a você");
    }

    const old = ticket.status;
    ticket.status = dto.status;
    if (dto.status === TicketStatus.RESOLVED || dto.status === TicketStatus.CLOSED) {
      ticket.resolvedAt = new Date();
      await cancelEscalation(ticketId);
    }
    if (dto.operatorComment !== undefined) {
      ticket.operatorComment = dto.operatorComment;
    }

    const updated = await this.ticketRepo.save(ticket);
    await this.historyRepo.create({
      ticketId,
      action: HistoryAction.STATUS_CHANGED,
      oldValue: old,
      newValue: dto.status
    });
    await publishSSEEvent({
      type: "TICKET_PROCESSING_UPDATE",
      payload: { ticketId, status: dto.status }
    });

    logger.info("[TicketService] Status updated", { ticketId, old, new: dto.status });
    return updated;
  }

  async updatePriority(
    ticketId: string,
    dto: UpdateTicketPriorityDTO,
    actor: AuthenticatedUser
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError("Ticket");
    if (actor.role === UserRole.OPERATOR && ticket.assignedToId !== actor.dbUserId) {
      throw new ForbiddenError("Ticket não atribuído a você");
    }

    const old = ticket.priority;
    ticket.priority = dto.priority;
    
    ticket.slaDeadline = await this.computeDeadline(dto.priority, ticket.createdAt);

    const updated = await this.ticketRepo.save(ticket);

    const slaForNewPriority = await this.slaRepo.findByPriority(dto.priority);
    if (slaForNewPriority?.autoEscalateAfterHours) {
      await scheduleEscalation(
        ticketId,
        dto.priority,
        slaForNewPriority.autoEscalateAfterHours * 3600000
      );
    } else {
      await cancelEscalation(ticketId);
    }

    await this.historyRepo.create({
      ticketId,
      action: HistoryAction.PRIORITY_CHANGED,
      oldValue: old,
      newValue: dto.priority,
      metadata: dto.reason ? JSON.stringify({ reason: dto.reason }) : null
    });

    await publishSSEEvent({
      type: "PRIORITY_CHANGED",
      payload: {
        ticketId,
        oldPriority: old,
        newPriority: dto.priority,
        changedById: actor.dbUserId
      },
      targetRoles: [UserRole.ADMIN]
    });

    logger.info("[TicketService] Priority updated", { ticketId, old, new: dto.priority });
    return updated;
  }

  async getHistory(
    ticketId: string,
    query: TicketListQueryDTO
  ): Promise<{ data: TicketHistory[]; total: number; page: number; limit: number; totalPages: number }> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError("Ticket");
    const pagination = parsePagination(query.page, query.limit);
    const [data, total] = await this.historyRepo.findPaginatedByTicketId(ticketId, pagination);
    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit)
    };
  }

  async updateCategory(
    ticketId: string,
    dto: UpdateTicketCategoryDTO,
    actor: AuthenticatedUser
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError("Ticket");
    if (actor.role === UserRole.OPERATOR && ticket.assignedToId !== actor.dbUserId) {
      throw new ForbiddenError("Ticket não atribuído a você");
    }
    ticket.category = dto.category;
    const updated = await this.ticketRepo.save(ticket);
    logger.info("[TicketService] Category updated", { ticketId, category: dto.category });
    return updated;
  }

  async assignTicket(
    ticketId: string,
    dto: AssignTicketDTO
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError("Ticket");

    const operator = await this.userRepo.findById(dto.operatorId);
    if (!operator || operator.role !== UserRole.OPERATOR)
      throw new NotFoundError("Operator");

    ticket.assignedToId = dto.operatorId;
    ticket.status = TicketStatus.IN_PROGRESS;
    const updated = await this.ticketRepo.save(ticket);

    await this.historyRepo.create({
      ticketId,
      action: HistoryAction.ASSIGNED,
      newValue: dto.operatorId
    });
    await publishSSEEvent({
      type: "TICKET_ASSIGNED",
      payload: { ticketId, assignedToId: dto.operatorId },
      targetUserIds: [dto.operatorId]
    });

    logger.info("[TicketService] Ticket assigned", { ticketId, operatorId: dto.operatorId });
    return updated;
  }

  async deleteTicket(
    ticketId: string,
    actor: AuthenticatedUser
  ): Promise<void> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError("Ticket");

    if (actor.role === UserRole.USER) {
      if (ticket.createdById !== actor.dbUserId) throw new ForbiddenError("Acesso negado");
      if (ticket.status !== TicketStatus.OPEN) throw new ForbiddenError("Só é possível excluir tickets em aberto");
    }

    await cancelEscalation(ticketId);
    await this.ticketRepo.delete(ticketId);
    logger.info("[TicketService] Ticket deleted", { ticketId, deletedBy: actor.dbUserId });
  }

  async selfAssign(ticketId: string, actor: AuthenticatedUser): Promise<Ticket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError("Ticket");
    if (ticket.assignedToId) throw new ForbiddenError("Ticket já atribuído");

    ticket.assignedToId = actor.dbUserId;
    ticket.status = TicketStatus.IN_PROGRESS;
    const updated = await this.ticketRepo.save(ticket);

    await this.historyRepo.create({
      ticketId,
      action: HistoryAction.ASSIGNED,
      newValue: actor.dbUserId
    });

    logger.info("[TicketService] Self-assigned", { ticketId, operatorId: actor.dbUserId });
    return updated;
  }
}