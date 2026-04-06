import { Notification } from "#src/entities/Notification";
import { UserRole } from "#src/entities/User";
import { NotificationRepository } from "#src/repositories/NotificationRepository";
import { AuthenticatedUser } from "#src/types";
import { ForbiddenError } from "#src/utils/errors";
import { logger } from "#src/utils/logger";

export class NotificationService {
  private readonly repo = new NotificationRepository();

  getMyNotifications(
    actor: AuthenticatedUser,
    onlyUnread: boolean
  ): Promise<Notification[]> {
    if (actor.role !== UserRole.ADMIN) throw new ForbiddenError();
    return this.repo.findByAdminId(actor.dbUserId, onlyUnread);
  }

  getUnreadCount(actor: AuthenticatedUser): Promise<number> {
    if (actor.role !== UserRole.ADMIN) return Promise.resolve(0);
    return this.repo.countUnread(actor.dbUserId);
  }

  async markAsRead(
    notificationId: string,
    actor: AuthenticatedUser
  ): Promise<void> {
    if (actor.role !== UserRole.ADMIN) throw new ForbiddenError();
    await this.repo.markAsRead(notificationId, actor.dbUserId);
    logger.debug("[NotificationService] Marked as read", { notificationId });
  }

  async markAllAsRead(actor: AuthenticatedUser): Promise<void> {
    if (actor.role !== UserRole.ADMIN) throw new ForbiddenError();
    await this.repo.markAllAsRead(actor.dbUserId);
    logger.info("[NotificationService] All marked as read", {
      adminId: actor.dbUserId
    });
  }
}
