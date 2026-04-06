import axios, { AxiosInstance } from "axios";

import { env } from "#src/config/env";
import { UserRole } from "#src/entities/User";
import { AppError } from "#src/utils/errors";
import { logger } from "#src/utils/logger";

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

interface KeycloakUserRepresentation {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface CreateKeycloakUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

class KeycloakAdminService {
  private readonly http: AxiosInstance;
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor() {
    this.http = axios.create({
      baseURL: `${env.KEYCLOAK_URL}/admin/realms/${env.KEYCLOAK_REALM}`,
      headers: { "Content-Type": "application/json" }
    });
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - 10000)
      return this.token;

    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.KEYCLOAK_CLIENT_ID,
      client_secret: env.KEYCLOAK_CLIENT_SECRET
    });

    const res = await axios.post<TokenResponse>(
      `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    this.token = res.data.access_token;
    this.tokenExpiresAt = Date.now() + res.data.expires_in * 1000;
    return this.token;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${await this.getToken()}` };
  }

  async findByEmail(email: string): Promise<KeycloakUserRepresentation | null> {
    try {
      const res = await this.http.get<KeycloakUserRepresentation[]>("/users", {
        params: { email, exact: true },
        headers: await this.authHeaders()
      });
      return res.data[0] ?? null;
    } catch {
      return null;
    }
  }

  async createUser(input: CreateKeycloakUserInput): Promise<string> {
    const parts = input.name.trim().split(" ");
    try {
      const res = await this.http.post(
        "/users",
        {
          username: input.email,
          email: input.email,
          firstName: parts[0] ?? input.name,
          lastName: parts.slice(1).join(" ") || "-",
          enabled: true,
          emailVerified: false,
          credentials: [
            { type: "password", value: input.password, temporary: false }
          ],
          realmRoles: [input.role]
        },
        { headers: await this.authHeaders() }
      );

      const location = res.headers["location"] as string | undefined;
      if (!location)
        throw new AppError("Keycloak did not return user location", 500);
      const id = location.split("/").pop();
      if (!id) throw new AppError("Could not extract Keycloak user ID", 500);

      logger.info("[Keycloak] User created", {
        keycloakId: id,
        role: input.role
      });
      return id;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        throw new AppError("Email already registered", 409);
      }
      throw new AppError("Failed to create user in Keycloak", 500);
    }
  }
}

export const keycloakAdmin = new KeycloakAdminService();
