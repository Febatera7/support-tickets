import { Request, Response, NextFunction } from "express";

import { TicketPriority } from "#src/entities/Ticket";
import { SLAConfigService } from "#src/services/SLAConfigService";
import { AuthenticatedRequest } from "#src/types";
import { UnprocessableError } from "#src/utils/errors";
import { UpdateSLAConfigSchema } from "#src/validators/schemas";

const service = new SLAConfigService();
const VALID_PRIORITIES = new Set(Object.values(TicketPriority));

export async function listSLAConfigs(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.findAll();
    res.json({ status: "success", data });
  } catch (err) { next(err); }
}

export async function updateSLAConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const priority = req.params["priority"] as string;
    if (!VALID_PRIORITIES.has(priority as TicketPriority)) {
      throw new UnprocessableError(`Invalid priority. Must be one of: ${[...VALID_PRIORITIES].join(", ")}`);
    }
    const data = await service.update(priority as TicketPriority, UpdateSLAConfigSchema.parse(req.body), actor);
    res.json({ status: "success", data });
  } catch (err) { next(err); }
}