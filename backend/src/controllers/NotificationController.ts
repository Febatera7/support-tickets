import { Request, Response, NextFunction } from "express";

import { NotificationService } from "#src/services/NotificationService";
import { AuthenticatedRequest } from "#src/types";

const service = new NotificationService();

export async function listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const onlyUnread = req.query["unread"] === "true";
    const data = await service.getMyNotifications(actor, onlyUnread);
    res.json({ status: "success", data });
  } catch (err) { next(err); }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const count = await service.getUnreadCount(actor);
    res.json({ status: "success", data: { count } });
  } catch (err) { next(err); }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    await service.markAsRead(req.params["id"]!, actor);
    res.json({ status: "success" });
  } catch (err) { next(err); }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    await service.markAllAsRead(actor);
    res.json({ status: "success" });
  } catch (err) { next(err); }
}