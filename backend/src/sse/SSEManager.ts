import { Response } from "express";

import { redisPubSub, redisConnection } from "#src/config/redis";
import { RedisSSEMessage, SSEEvent, UserRole } from "#src/types";
import { logger } from "#src/utils/logger";

const SSE_CHANNEL = "sse:events";

interface SSEClient {
  userId: string;
  role: UserRole;
  res: Response;
}

class SSEManager {
  private readonly clients = new Map<string, SSEClient>();

  addClient(userId: string, role: UserRole, res: Response): string {
    const clientId = `${userId}:${Date.now()}`;
    this.clients.set(clientId, { userId, role, res });
    logger.debug("[SSE] Client connected", { clientId, userId, role });
    return clientId;
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    logger.debug("[SSE] Client disconnected", { clientId });
  }

  private sendToClient(client: SSEClient, event: SSEEvent): void {
    try {
      client.res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      logger.warn("[SSE] Failed to write to client");
    }
  }

  dispatch(message: RedisSSEMessage): void {
    const event: SSEEvent = { type: message.type, payload: message.payload };
    for (const client of this.clients.values()) {
      const byUser = message.targetUserIds?.includes(client.userId) ?? false;
      const byRole = message.targetRoles?.includes(client.role) ?? false;
      const broadcast =
        !message.targetUserIds?.length && !message.targetRoles?.length;
      if (broadcast || byUser || byRole) this.sendToClient(client, event);
    }
  }
}

export const sseManager = new SSEManager();

redisPubSub.subscribe(SSE_CHANNEL, (err) => {
  if (err) {
    logger.error("[SSE] Failed to subscribe to Redis channel", {
      error: err.message
    });
    return;
  }
  logger.info("[SSE] Subscribed to Redis channel");
});

redisPubSub.on("message", (_channel: string, message: string) => {
  try {
    sseManager.dispatch(JSON.parse(message) as RedisSSEMessage);
  } catch {
    logger.error("[SSE] Failed to parse Redis message");
  }
});

export async function publishSSEEvent(message: RedisSSEMessage): Promise<void> {
  try {
    await redisConnection.publish(SSE_CHANNEL, JSON.stringify(message));
  } catch (err) {
    logger.error("[SSE] Failed to publish event", {
      error: err instanceof Error ? err.message : String(err)
    });
  }
}
