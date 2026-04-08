import { UserRole } from "#src/entities/User";
import { UserRepository } from "#src/repositories/UserRepository";
import { keycloakAdmin } from "#src/services/KeycloakAdminService";
import { logger } from "#src/utils/logger";

const ADMIN_EMAIL = "admin@support.local";
const ADMIN_NAME = "System Administrator";

export async function seedAdminUser(): Promise<void> {
  const repo = new UserRepository();

  const existingInDb = await repo.findByEmail(ADMIN_EMAIL);
  if (existingInDb) {
    logger.info("[Seed] Admin already exists in database, skipping", {
      userId: existingInDb.id
    });
    return;
  }

  logger.info("[Seed] Admin not found in database, syncing from Keycloak");

  const keycloakUser = await keycloakAdmin.findByEmail(ADMIN_EMAIL);

  if (keycloakUser) {
    logger.info("[Seed] Admin found in Keycloak, creating database entry", {
      keycloakId: keycloakUser.id
    });

    await repo.create({
      keycloakId: keycloakUser.id,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      cpf: null,
      phone: null,
      cep: null,
      role: UserRole.ADMIN
    });

    logger.info(
      "[Seed] Admin database entry created from existing Keycloak user"
    );
    return;
  }

  logger.warn(
    "[Seed] Admin not found in Keycloak either — realm-export.json may not have been imported yet"
  );
}
