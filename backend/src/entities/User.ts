import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from "typeorm";

import { Notification } from "#src/entities/Notification";
import { Ticket } from "#src/entities/Ticket";

export enum UserRole {
  USER = "user",
  OPERATOR = "operator",
  ADMIN = "admin"
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ name: "keycloak_id" })
  keycloakId!: string;

  @Column()
  name!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column({ nullable: true, type: "varchar" })
  cpf!: string | null;

  @Column({ nullable: true, type: "varchar" })
  phone!: string | null;

  @Column({ nullable: true, type: "varchar" })
  cep!: string | null;

  @Column({ nullable: true, type: "varchar" })
  street!: string | null;

  @Column({ nullable: true, type: "varchar" })
  neighborhood!: string | null;

  @Column({ nullable: true, type: "varchar" })
  city!: string | null;

  @Column({ nullable: true, type: "varchar" })
  state!: string | null;

  @Column({ type: "enum", enum: UserRole })
  role!: UserRole;

  @Column({ default: false, name: "email_validated" })
  emailValidated!: boolean;

  @Column({ default: false, name: "address_enriched" })
  addressEnriched!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => Ticket, (ticket: Ticket) => ticket.createdBy)
  tickets!: Ticket[];

  @OneToMany(() => Ticket, (ticket: Ticket) => ticket.assignedTo)
  assignedTickets!: Ticket[];

  @OneToMany(() => Notification, (n: Notification) => n.admin)
  notifications!: Notification[];
}
