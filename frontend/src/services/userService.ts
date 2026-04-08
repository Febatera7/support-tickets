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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf: string | null;
  phone: string | null;
  cep: string | null;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  number: string | null;
  complement: string | null;
  emailValidated: boolean;
  createdAt: string;
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get<{ status: string; data: UserProfile }>("/api/users/me");
  return data.data;
}

export async function updateMe(payload: Partial<Omit<UserProfile, "id" | "email" | "cpf" | "role" | "emailValidated" | "createdAt">>): Promise<UserProfile> {
  const { data } = await api.patch<{ status: string; data: UserProfile }>("/api/users/me", payload);
  return data.data;
}