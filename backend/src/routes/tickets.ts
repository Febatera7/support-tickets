import { Router } from "express";

import * as TicketController from "#src/controllers/TicketController";
import { authenticate, requireRole } from "#src/middlewares/auth";
import { UserRole } from "#src/types";

const router = Router();

router.use(authenticate);

router.post("/", TicketController.createTicket);
router.get("/", TicketController.listTickets);
router.get("/available", requireRole(UserRole.OPERATOR, UserRole.ADMIN), TicketController.listAvailable);
router.patch("/:id/status", requireRole(UserRole.OPERATOR, UserRole.ADMIN), TicketController.updateStatus);
router.patch("/:id/priority", requireRole(UserRole.OPERATOR, UserRole.ADMIN), TicketController.updatePriority);
router.patch("/:id/category", requireRole(UserRole.OPERATOR, UserRole.ADMIN), TicketController.updateCategory);
router.post("/:id/assign", requireRole(UserRole.ADMIN), TicketController.assignTicket);
router.post("/:id/self-assign", requireRole(UserRole.OPERATOR), TicketController.selfAssign);
router.get("/:id/history", requireRole(UserRole.ADMIN), TicketController.getHistory);
router.delete("/:id", TicketController.deleteTicket);

export { router as ticketRouter };