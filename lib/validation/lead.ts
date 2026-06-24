import { z } from "zod";
import { LeadStatus } from "@prisma/client";

export const CreateLeadSchema = z.object({
  title: z.string().min(1).max(255),
  source: z.string().max(100).optional(),
  budgetCents: z.number().int().nonnegative().optional(),
  siteAddress: z.string().max(500).optional(),
  nextActionAt: z.coerce.date().optional(),
  notes: z.string().max(10_000).optional(),
  customerId: z.string().cuid().optional(),
  assignedToId: z.string().cuid().optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial();

export const AssignLeadSchema = z.object({
  assignedToId: z.string().cuid().nullable(),
});

export const UpdateLeadStatusSchema = z.object({
  status: z.nativeEnum(LeadStatus),
});

export const LeadFilterSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  assignedToId: z.string().cuid().optional(),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().cuid().optional(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
export type AssignLeadInput = z.infer<typeof AssignLeadSchema>;
export type LeadFilter = z.infer<typeof LeadFilterSchema>;
