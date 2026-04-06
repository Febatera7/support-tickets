import api from "#src/services/api";
import type { ApiResponse, UserRole } from "#src/types";

export interface UserCreated {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<UserCreated> {
  const { data } = await api.post<ApiResponse<UserCreated>>("/api/users", payload);
  return data.data;
}

export async function listOperators(): Promise<UserCreated[]> {
  const { data } = await api.get<ApiResponse<UserCreated[]>>("/api/users/operators");
  return data.data;
}
