import { User, UserRole } from "#src/entities/User";
import {
  enqueueEmailValidation,
  enqueueAddressEnrichment
} from "#src/queues/producers";
import { UserRepository } from "#src/repositories/UserRepository";
import { keycloakAdmin } from "#src/services/KeycloakAdminService";
import { ConflictError, NotFoundError } from "#src/utils/errors";
import { logger } from "#src/utils/logger";
import { CreateUserDTO, CreateOperatorDTO } from "#src/validators/schemas";


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
      role: UserRole.USER,
      emailValidated: false,
      addressEnriched: false
    });

    await enqueueEmailValidation({ userId: user.id, email: dto.email });
    if (dto.cep)
      await enqueueAddressEnrichment({
        userId: user.id,
        cep: dto.cep.replace(/\D/g, "")
      });

    logger.info("[UserService] User registered", { userId: user.id });
    return user;
  }

  async registerOperator(
    dto: CreateOperatorDTO,
    adminId: string
  ): Promise<User> {
    if (await this.repo.findByEmail(dto.email))
      throw new ConflictError("Email já cadastrado");

    logger.info("[UserService] Admin creating operator", { adminId });

    const keycloakId = await keycloakAdmin.createUser({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: UserRole.OPERATOR
    });

    const operator = await this.repo.create({
      keycloakId,
      name: dto.name,
      email: dto.email,
      cpf: null,
      phone: null,
      cep: null,
      role: UserRole.OPERATOR,
      emailValidated: false,
      addressEnriched: false
    });

    await enqueueEmailValidation({ userId: operator.id, email: dto.email });
    logger.info("[UserService] Operator created", { operatorId: operator.id });
    return operator;
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundError("User");
    return user;
  }

  findAllOperators(): Promise<User[]> {
    return this.repo.findAllByRole(UserRole.OPERATOR);
  }

  findAllAdmins(): Promise<User[]> {
    return this.repo.findAllByRole(UserRole.ADMIN);
  }

  async registerAdmin(dto: CreateOperatorDTO, adminId: string): Promise<User> {
    if (await this.repo.findByEmail(dto.email))
      throw new ConflictError("Email já cadastrado");

    logger.info("[UserService] Admin creating new admin", { adminId });

    const keycloakId = await keycloakAdmin.createUser({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: UserRole.ADMIN
    });

    const admin = await this.repo.create({
      keycloakId,
      name: dto.name,
      email: dto.email,
      cpf: null,
      phone: null,
      cep: null,
      role: UserRole.ADMIN,
      emailValidated: false,
      addressEnriched: false
    });

    await enqueueEmailValidation({ userId: admin.id, email: dto.email });
    logger.info("[UserService] Admin created", { newAdminId: admin.id });
    return admin;
  }

  async registerWithRole(
    dto: CreateOperatorDTO,
    adminId: string,
    role: UserRole
  ): Promise<User> {
    if (await this.repo.findByEmail(dto.email)) {
      throw new ConflictError("Email já cadastrado");
    }

    logger.info("[UserService] Admin creating user with role", { adminId, role });

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
      role,
      emailValidated: false,
      addressEnriched: false
    });

    await enqueueEmailValidation({ userId: created.id, email: dto.email });
    logger.info("[UserService] User with role created", { userId: created.id, role });
    return created;
  }
}
