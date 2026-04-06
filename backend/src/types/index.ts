import { Request } from "express";

import {
  TicketPriority,
  TicketStatus,
  ProcessingStatus
} from "#src/entities/Ticket";
import { UserRole } from "#src/entities/User";

export { UserRole, TicketPriority, TicketStatus, ProcessingStatus };

export interface AuthenticatedUser {
  keycloakId: string;
  email: string;
  name: string;
  role: UserRole;
  dbUserId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SSEEventType =
  | "CONNECTED"
  | "TICKET_PROCESSING_UPDATE"
  | "PRIORITY_CHANGED"
  | "TICKET_ASSIGNED";

export interface SSEEvent {
  type: SSEEventType;
  payload: Record<string, string | number | boolean | null>;
}

export interface RedisSSEMessage {
  type: SSEEventType;
  payload: Record<string, string | number | boolean | null>;
  targetUserIds?: string[];
  targetRoles?: UserRole[];
}

export interface EmailValidationJobData {
  userId: string;
  email: string;
}

export interface AddressEnrichmentJobData {
  userId: string;
  cep: string;
}

export interface AICategorizationJobData {
  userId: string;
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string;
}
