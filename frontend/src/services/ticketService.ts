import api from "#src/services/api";
import type {
  Ticket,
  PaginatedResponse,
  ApiResponse,
  TicketFilters,
  TicketPriority,
  TicketStatus
} from "#src/types";

export async function listTickets(
  filters: TicketFilters = {}
): Promise<PaginatedResponse<Ticket>> {
  const params = new URLSearchParams();
  if (filters.statuses) params.set("statuses", filters.statuses);
  else if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.search) params.set("search", filters.search);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit ?? 20));

  const { data } = await api.get<PaginatedResponse<Ticket>>(
    `/api/tickets?${params.toString()}`
  );
  return data;
}

export async function listAvailableTickets(
  filters: TicketFilters = {}
): Promise<PaginatedResponse<Ticket>> {
  const params = new URLSearchParams();
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.search) params.set("search", filters.search);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit ?? 20));

  const { data } = await api.get<PaginatedResponse<Ticket>>(
    `/api/tickets/available?${params.toString()}`
  );
  return data;
}

export async function createTicket(payload: {
  title: string;
  description: string;
  priority?: TicketPriority;
  category?: string;
}): Promise<Ticket> {
  const { data } = await api.post<ApiResponse<Ticket>>("/api/tickets", payload);
  return data.data;
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
  operatorComment?: string
): Promise<Ticket> {
  const { data } = await api.patch<ApiResponse<Ticket>>(
    `/api/tickets/${id}/status`,
    { status, operatorComment }
  );
  return data.data;
}

export async function updateTicketPriority(
  id: string,
  priority: TicketPriority,
  reason?: string
): Promise<Ticket> {
  const { data } = await api.patch<ApiResponse<Ticket>>(
    `/api/tickets/${id}/priority`,
    { priority, reason }
  );
  return data.data;
}

export async function assignTicket(
  id: string,
  operatorId: string
): Promise<Ticket> {
  const { data } = await api.post<ApiResponse<Ticket>>(
    `/api/tickets/${id}/assign`,
    { operatorId }
  );
  return data.data;
}

export async function selfAssignTicket(id: string): Promise<Ticket> {
  const { data } = await api.post<ApiResponse<Ticket>>(
    `/api/tickets/${id}/self-assign`
  );
  return data.data;
}

export async function updateTicketCategory(
  id: string,
  category: string
): Promise<Ticket> {
  const { data } = await api.patch<ApiResponse<Ticket>>(
    `/api/tickets/${id}/category`,
    { category }
  );
  return data.data;
}

export async function deleteTicket(id: string): Promise<void> {
  await api.delete(`/api/tickets/${id}`);
}
