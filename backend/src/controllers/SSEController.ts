import { Request, Response } from "express";

import { sseManager } from "#src/sse/SSEManager";
import { AuthenticatedRequest } from "#src/types";
import { logger } from "#src/utils/logger";

export function connectSSE(req: Request, res: Response): void {
  const actor = (req as AuthenticatedRequest).user;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const clientId = sseManager.addClient(actor.dbUserId, actor.role, res);
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", payload: { clientId } })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseManager.removeClient(clientId);
    logger.debug("[SSE] Connection closed", { clientId });
  });
}