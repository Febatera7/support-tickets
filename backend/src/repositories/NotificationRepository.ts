import { Repository } from "typeorm";

import { AppDataSource } from "#src/config/database";
import { Notification, NotificationType } from "#src/entities/Notification";
import { TicketPriority } from "#src/entities/Ticket";

export interface CreateNotificationInput {
  adminId: string;
  ticketId: string;
  operatorId: string | null;
  type: NotificationType;
  oldPriority?: TicketPriority | null;
  newPriority?: TicketPriority | null;
  message?: string | null;
}

export class NotificationRepository {
  private readonly repo: Repository<Notification>;

  constructor() {
    this.repo = AppDataSource.getRepository(Notification);
  }

  create(input: CreateNotificationInput): Promise<Notification> {
    return this.repo.save(
      this.repo.create({
        adminId: input.adminId,
        ticketId: input.ticketId,
        operatorId: input.operatorId,
        type: input.type,
        oldPriority: input.oldPriority ?? null,
        newPriority: input.newPriority ?? null,
        message: input.message ?? null,
        readAt: null
      })
    );
  }

  findByAdminId(adminId: string, onlyUnread: boolean): Promise<Notification[]> {
    const qb = this.repo
      .createQueryBuilder("n")
      .leftJoinAndSelect("n.ticket", "ticket")
      .leftJoinAndSelect("n.operator", "operator")
      .where("n.adminId = :adminId", { adminId })
      .orderBy("n.createdAt", "DESC")
      .take(50);
    if (onlyUnread) qb.andWhere("n.readAt IS NULL");
    return qb.getMany();
  }

  countUnread(adminId: string): Promise<number> {
    return this.repo
      .createQueryBuilder("n")
      .where("n.adminId = :adminId AND n.readAt IS NULL", { adminId })
      .getCount();
  }

  markAsRead(notificationId: string, adminId: string): Promise<void> {
    return this.repo
      .update({ id: notificationId, adminId }, { readAt: new Date() })
      .then(() => undefined);
  }

  markAllAsRead(adminId: string): Promise<void> {
    return this.repo
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: new Date() })
      .where("adminId = :adminId AND readAt IS NULL", { adminId })
      .execute()
      .then(() => undefined);
  }
}
