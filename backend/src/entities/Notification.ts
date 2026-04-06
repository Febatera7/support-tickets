import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from "typeorm";

import { Ticket, TicketPriority } from "#src/entities/Ticket";
import { User } from "#src/entities/User";

export enum NotificationType {
  PRIORITY_CHANGED = "priority_changed",
  TICKET_ASSIGNED = "ticket_assigned"
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @ManyToOne(() => User, (u: User) => u.notifications)
  @JoinColumn({ name: "admin_id" })
  admin!: User;

  @Column({ name: "admin_id" })
  adminId!: string;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: "ticket_id" })
  ticket!: Ticket;

  @Column({ name: "ticket_id" })
  ticketId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "operator_id" })
  operator!: User | null;

  @Column({ nullable: true, type: "varchar", name: "operator_id" })
  operatorId!: string | null;

  @Column({ type: "enum", enum: NotificationType })
  type!: NotificationType;

  @Column({ nullable: true, type: "varchar", name: "old_priority" })
  oldPriority!: TicketPriority | null;

  @Column({ nullable: true, type: "varchar", name: "new_priority" })
  newPriority!: TicketPriority | null;

  @Column({ nullable: true, type: "text" })
  message!: string | null;

  @Index()
  @Column({ nullable: true, type: "timestamptz", name: "read_at" })
  readAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
