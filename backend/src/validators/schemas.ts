import { z } from "zod";

import { TicketPriority, TicketStatus } from "#src/entities/Ticket";
import { isValidCpf } from "#src/utils/cpf-validator";

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  cpf: z
    .string()
    .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "Formato de CPF inválido")
    .refine((val) => isValidCpf(val), { message: "CPF inválido" }),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{10,20}$/, "Formato de telefone inválido")
    .optional(),
  cep: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "Formato de CEP inválido")
    .optional(),
  password: z.string().min(8).max(100)
});

export const CreateOperatorSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(100)
});

export const CreateTicketSchema = z.object({
  title: z.string().min(5).max(150).trim(),
  description: z.string().min(10).max(5000).trim(),
  priority: z.nativeEnum(TicketPriority).optional(),
  category: z.string().max(100).trim().optional()
});

export const UpdateTicketStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
  operatorComment: z.string().max(2000).trim().optional()
});

export const UpdateTicketPrioritySchema = z.object({
  priority: z.nativeEnum(TicketPriority),
  reason: z.string().min(5).max(500).trim().optional()
});

export const UpdateTicketCategorySchema = z.object({
  category: z.string().max(100).trim()
});

export const AssignTicketSchema = z.object({
  operatorId: z.string().uuid()
});

export const UpdateSLAConfigSchema = z.object({
  responseTimeHours: z.number().int().min(1).max(720),
  resolutionTimeHours: z.number().int().min(1).max(2160),
  autoEscalateAfterHours: z.number().int().min(1).max(2160).nullable().optional()
});

export const TicketListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  statuses: z.string().optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  search: z.string().max(200).trim().optional(),
  assignedToId: z.string().uuid().optional(),
  createdById: z.string().uuid().optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional()
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
export type CreateOperatorDTO = z.infer<typeof CreateOperatorSchema>;
export type CreateTicketDTO = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketStatusDTO = z.infer<typeof UpdateTicketStatusSchema>;
export type UpdateTicketPriorityDTO = z.infer<typeof UpdateTicketPrioritySchema>;
export type AssignTicketDTO = z.infer<typeof AssignTicketSchema>;
export type UpdateSLAConfigDTO = z.infer<typeof UpdateSLAConfigSchema>;
export type TicketListQueryDTO = z.infer<typeof TicketListQuerySchema>;
export type UpdateTicketCategoryDTO = z.infer<typeof UpdateTicketCategorySchema>;