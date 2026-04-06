import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

import { env } from "#src/config/env";
import { UserRepository } from "#src/repositories/UserRepository";
import { AuthenticatedRequest, AuthenticatedUser, UserRole } from "#src/types";
import { UnauthorizedError, ForbiddenError } from "#src/utils/errors";
import { logger } from "#src/utils/logger";

const JWKS = createRemoteJWKSet(
  new URL(
    `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/certs`
  )
);

interface KeycloakPayload extends JWTPayload {
  email?: string;
  name?: string;
  preferred_username?: string;
  realm_access?: { roles: string[] };
}

function extractRole(payload: KeycloakPayload): UserRole {
  const roles = payload.realm_access?.roles ?? [];
  if (roles.includes("admin")) return UserRole.ADMIN;
  if (roles.includes("operator")) return UserRole.OPERATOR;
  return UserRole.USER;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer ")) {
    return next(
      new UnauthorizedError("Missing or malformed Authorization header")
    );
  }

  try {
    const { payload } = await jwtVerify<KeycloakPayload>(
      header.slice(7),
      JWKS,
      {
        issuer: `${env.KEYCLOAK_EXTERNAL_URL}/realms/${env.KEYCLOAK_REALM}`
      }
    );

    if (!payload.sub || !payload.email) {
      return next(new UnauthorizedError("Token missing required claims"));
    }

    const repo = new UserRepository();
    const dbUser = await repo.findByKeycloakId(payload.sub);
    if (!dbUser) {
      logger.warn("[Auth] User not in database", { keycloakId: payload.sub });
      return next(new UnauthorizedError("User not registered in the system"));
    }

    const user: AuthenticatedUser = {
      keycloakId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.preferred_username ?? "Unknown",
      role: extractRole(payload),
      dbUserId: dbUser.id
    };

    (req as AuthenticatedRequest).user = user;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return next(new UnauthorizedError());
    if (!roles.includes(user.role)) {
      logger.warn("[Auth] Insufficient role", {
        required: roles,
        actual: user.role
      });
      return next(new ForbiddenError("Insufficient permissions"));
    }
    next();
  };
}
