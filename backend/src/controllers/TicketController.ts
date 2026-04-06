import { Request, Response, NextFunction } from "express";

import { TicketService } from "#src/services/TicketService";
import { AuthenticatedRequest } from "#src/types";
import {
  AssignTicketSchema,
  CreateTicketSchema,
  UpdateTicketCategorySchema,
  TicketListQuerySchema,
  UpdateTicketPrioritySchema,
  UpdateTicketStatusSchema
} from "#src/validators/schemas";

const service = new TicketService();

export async function createTicket(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const ticket = await service.createTicket(
      CreateTicketSchema.parse(req.body),
      actor
    );
    res.status(201).json({ status: "success", data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function listTickets(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const result = await service.listTickets(
      TicketListQuerySchema.parse(req.query),
      actor
    );
    res.json({ status: "success", ...result });
  } catch (err) {
    next(err);
  }
}

export async function listAvailable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await service.listAvailable(TicketListQuerySchema.parse(req.query));
    res.json({ status: "success", ...result });
  } catch (err) {
    next(err);
  }
}

export async function getTicket(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const ticket = await service.getById(req.params["id"]!, actor);
    res.json({ status: "success", data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const ticket = await service.updateStatus(
      req.params["id"]!,
      UpdateTicketStatusSchema.parse(req.body),
      actor
    );
    res.json({ status: "success", data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function updatePriority(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const ticket = await service.updatePriority(
      req.params["id"]!,
      UpdateTicketPrioritySchema.parse(req.body),
      actor
    );
    res.json({ status: "success", data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const ticket = await service.updateCategory(
      req.params["id"]!,
      UpdateTicketCategorySchema.parse(req.body),
      actor
    );
    res.json({ status: "success", data: ticket });
  } catch (err) { next(err); }
}

export async function assignTicket(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const ticket = await service.assignTicket(
      req.params["id"]!,
      AssignTicketSchema.parse(req.body),
      actor
    );
    res.json({ status: "success", data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function selfAssign(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const ticket = await service.selfAssign(req.params["id"]!, actor);
    res.json({ status: "success", data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await service.getHistory(
      req.params["id"]!,
      TicketListQuerySchema.parse(req.query)
    );
    res.json({ status: "success", ...result });
  } catch (err) {
    next(err);
  }
}

export async function deleteTicket(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    await service.deleteTicket(req.params["id"]!, actor);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}