import { Repository } from "typeorm";

import { AppDataSource } from "#src/config/database";
import { User, UserRole } from "#src/entities/User";

export class UserRepository {
  private readonly repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByKeycloakId(keycloakId: string): Promise<User | null> {
    return this.repo.findOne({ where: { keycloakId } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findByCpf(cpf: string): Promise<User | null> {
    return this.repo.findOne({ where: { cpf } });
  }

  findAllByRole(role: UserRole): Promise<User[]> {
    return this.repo.find({ where: { role } });
  }

  create(data: Partial<User>): Promise<User> {
    return this.repo.save(this.repo.create(data));
  }

  save(user: User): Promise<User> {
    return this.repo.save(user);
  }
}
