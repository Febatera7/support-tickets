export type UserRole = "user" | "operator" | "admin";
export type Language = "pt" | "en" | "es";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  aiSuggestedCategory: string | null;
  aiSuggestedPriority: string | null;
  slaDeadline: string | null;
  resolvedAt: string | null;
  resolutionTimeMinutes: number | null;
  operatorComment: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email: string };
  assignedTo: { id: string; name: string; email: string } | null;
}

export interface SLAConfig {
  id: string;
  priority: TicketPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
  autoEscalateAfterHours: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
}

export interface TicketFilters {
  status?: TicketStatus;
  statuses?: string;
  priority?: TicketPriority;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}