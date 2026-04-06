import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";

import { TicketPriority } from "#src/entities/Ticket";
import { User } from "#src/entities/User";

@Entity("sla_configs")
export class SLAConfig {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: TicketPriority, unique: true })
  priority!: TicketPriority;

  @Column({ name: "response_time_hours" })
  responseTimeHours!: number;

  @Column({ name: "resolution_time_hours" })
  resolutionTimeHours!: number;

  @Column({ name: "auto_escalate_after_hours", nullable: true, type: "int" })
  autoEscalateAfterHours!: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "updated_by_id" })
  updatedBy!: User | null;

  @Column({ nullable: true, type: "varchar", name: "updated_by_id" })
  updatedById!: string | null;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
