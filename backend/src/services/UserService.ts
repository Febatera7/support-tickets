import { User, UserRole } from "#src/entities/User";
import { enqueueAddressEnrichment, enqueueEmailValidation } from "#src/queues/producers";
import { UserRepository } from "#src/repositories/UserRepository";
import { keycloakAdmin } from "#src/services/KeycloakAdminService";
import { ConflictError, NotFoundError } from "#src/utils/errors";
import { logger } from "#src/utils/logger";
import { CreateOperatorDTO, CreateUserDTO } from "#src/validators/schemas";

export class UserService {
  private readonly repo = new UserRepository();

  async registerUser(dto: CreateUserDTO): Promise<User> {
    if (await this.repo.findByEmail(dto.email))
      throw new ConflictError("Email já cadastrado");

    const cpf = dto.cpf.replace(/\D/g, "");
    if (await this.repo.findByCpf(cpf))
      throw new ConflictError("CPF já cadastrado");

    logger.info("[UserService] Registering user");

    const keycloakId = await keycloakAdmin.createUser({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: UserRole.USER
    });

    const user = await this.repo.create({
      keycloakId,
      name: dto.name,
      email: dto.email,
      cpf,
      phone: dto.phone ?? null,
      cep: dto.cep?.replace(/\D/g, "") ?? null,
      street: dto.street ?? null,
      city: dto.city ?? null,
      state: dto.state ?? null,
      country: dto.country ?? (dto.cep ? "Brasil" : null),
      number: dto.number ?? null,
      complement: dto.complement ?? null,
      role: UserRole.USER
    });

    await enqueueEmailValidation({ userId: user.id, email: dto.email });
    if (dto.cep && !dto.street) {
      await enqueueAddressEnrichment({ userId: user.id, cep: dto.cep.replace(/\D/g, "") });
    }

    logger.info("[UserService] User registered", { userId: user.id });
    return user;
  }

  async registerWithRole(
    dto: CreateOperatorDTO,
    adminId: string,
    role: UserRole
  ): Promise<User> {
    if (await this.repo.findByEmail(dto.email))
      throw new ConflictError("Email já cadastrado");

    logger.info("[UserService] Admin creating user", { adminId, role });

    const keycloakId = await keycloakAdmin.createUser({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role
    });

    const created = await this.repo.create({
      keycloakId,
      name: dto.name,
      email: dto.email,
      cpf: null,
      phone: null,
      cep: null,
      role
    });

    await enqueueEmailValidation({ userId: created.id, email: dto.email });
    logger.info("[UserService] User with role created", { userId: created.id, role });
    return created;
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundError("User");
    return user;
  }

  async updateMe(userId: string, dto: UpdateMeDTO): Promise<User> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError("User");

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.phone !== undefined) user.phone = dto.phone ?? null;
    if (dto.cep !== undefined) user.cep = dto.cep.replace(/\D/g, "") || null;
    if (dto.street !== undefined) user.street = dto.street || null;
    if (dto.neighborhood !== undefined) user.neighborhood = dto.neighborhood || null;
    if (dto.city !== undefined) user.city = dto.city || null;
    if (dto.state !== undefined) user.state = dto.state || null;
    if (dto.country !== undefined) user.country = dto.country || null;
    if (dto.number !== undefined) user.number = dto.number || null;
    if (dto.complement !== undefined) user.complement = dto.complement || null;

    return this.repo.save(user);
  }

  findAllOperators(): Promise<User[]> {
    return this.repo.findAllByRole(UserRole.OPERATOR);
  }
}

export interface UpdateMeDTO {
  name?: string | undefined;
  phone?: string | null | undefined;
  cep?: string | undefined;
  street?: string | undefined;
  neighborhood?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  country?: string | undefined;
  number?: string | null | undefined;
  complement?: string | null | undefined;
}