import api from "#src/services/api";
import type { SLAConfig, ApiResponse, TicketPriority } from "#src/types";

export async function listSLAConfigs(): Promise<SLAConfig[]> {
  const { data } = await api.get<ApiResponse<SLAConfig[]>>("/api/sla");
  return data.data;
}

export async function updateSLAConfig(
  priority: TicketPriority,
  payload: {
    responseTimeHours: number;
    resolutionTimeHours: number;
    autoEscalateAfterHours?: number | null;
  }
): Promise<SLAConfig> {
  const { data } = await api.put<ApiResponse<SLAConfig>>(
    `/api/sla/${priority}`,
    payload
  );
  return data.data;
}
