import { Router } from "express";

import * as NotificationController from "#src/controllers/NotificationController";
import { authenticate, requireRole } from "#src/middlewares/auth";
import { UserRole } from "#src/types";

const router = Router();

router.use(authenticate, requireRole(UserRole.ADMIN));

router.get("/", NotificationController.listNotifications);
router.get("/unread-count", NotificationController.getUnreadCount);
router.patch("/:id/read", NotificationController.markAsRead);
router.patch("/read-all", NotificationController.markAllAsRead);

export { router as notificationRouter };