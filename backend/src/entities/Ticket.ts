import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index
} from "typeorm";

import { TicketHistory } from "#src/entities/TicketHistory";
import { User } from "#src/entities/User";

export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed"
}

export enum TicketPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export enum ProcessingStatus {
  QUEUED = "queued",
  PROCESSING = "processing",
  PROCESSED = "processed",
  ERROR = "error"
}

@Entity("tickets")
export class Ticket {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Index()
  @Column({ type: "enum", enum: TicketStatus, default: TicketStatus.OPEN })
  status!: TicketStatus;

  @Index()
  @Column({
    type: "enum",
    enum: TicketPriority,
    default: TicketPriority.MEDIUM
  })
  priority!: TicketPriority;

  @Column({ nullable: true, type: "varchar", name: "ai_suggested_priority" })
  aiSuggestedPriority!: TicketPriority | null;

  @Column({ nullable: true, type: "varchar", name: "ai_suggested_category" })
  aiSuggestedCategory!: string | null;

  @Column({ nullable: true, type: "varchar" })
  category!: string | null;

  @Column({
    type: "enum",
    enum: ProcessingStatus,
    default: ProcessingStatus.QUEUED,
    name: "processing_status"
  })
  processingStatus!: ProcessingStatus;

  @Column({ nullable: true, type: "text", name: "processing_error" })
  processingError!: string | null;

  @Index()
  @ManyToOne(() => User, (user: User) => user.tickets)
  @JoinColumn({ name: "created_by_id" })
  createdBy!: User;

  @Column({ name: "created_by_id" })
  createdById!: string;

  @ManyToOne(() => User, (user: User) => user.assignedTickets, {
    nullable: true
  })
  @JoinColumn({ name: "assigned_to_id" })
  assignedTo!: User | null;

  @Column({ nullable: true, type: "varchar", name: "assigned_to_id" })
  assignedToId!: string | null;

  @Column({ nullable: true, type: "timestamptz", name: "sla_deadline" })
  slaDeadline!: Date | null;

  @Column({ nullable: true, type: "timestamptz", name: "resolved_at" })
  resolvedAt!: Date | null;

  @Column({ nullable: true, type: "text", name: "operator_comment" })
  operatorComment!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => TicketHistory, (h: TicketHistory) => h.ticket)
  history!: TicketHistory[];
}