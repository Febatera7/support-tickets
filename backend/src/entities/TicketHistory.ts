import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from "typeorm";

import { Ticket } from "#src/entities/Ticket";
import { User } from "#src/entities/User";

export enum HistoryAction {
  CREATED = "created",
  STATUS_CHANGED = "status_changed",
  PRIORITY_CHANGED = "priority_changed",
  ASSIGNED = "assigned",
  AI_PROCESSED = "ai_processed",
  PROCESSING_ERROR = "processing_error"
}

@Entity("ticket_history")
export class TicketHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @ManyToOne(() => Ticket, (t: Ticket) => t.history, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ticket_id" })
  ticket!: Ticket;

  @Column({ name: "ticket_id" })
  ticketId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "changed_by_id" })
  changedBy!: User | null;

  @Column({ nullable: true, type: "varchar", name: "changed_by_id" })
  changedById!: string | null;

  @Column({ type: "enum", enum: HistoryAction })
  action!: HistoryAction;

  @Column({ nullable: true, type: "varchar", name: "old_value" })
  oldValue!: string | null;

  @Column({ nullable: true, type: "varchar", name: "new_value" })
  newValue!: string | null;

  @Column({ nullable: true, type: "text" })
  metadata!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
