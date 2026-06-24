import { z } from "zod";
import { EstimateStatus } from "@prisma/client";

// totalCents is always computed server-side as subtotalCents + taxCents.
// It is intentionally absent from all input schemas.
// Estimate.number is generated server-side; it is also absent from input schemas.

const PRISMA_INT_MAX = 2_147_483_647;

export const CreateEstimateSchema = z.object({
  title: z.string().min(1).max(255),
  customerId: z.string().cuid(),
  leadId: z.string().cuid().optional(),
  subtotalCents: z.number().int().nonnegative().max(PRISMA_INT_MAX).default(0),
  taxCents: z.number().int().nonnegative().max(PRISMA_INT_MAX).default(0),
  marginPercent: z.number().min(0).max(100).optional(),
});

export const UpdateEstimateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  subtotalCents: z.number().int().nonnegative().max(PRISMA_INT_MAX).optional(),
  taxCents: z.number().int().nonnegative().max(PRISMA_INT_MAX).optional(),
  marginPercent: z.number().min(0).max(100).optional(),
});

// Allowed status transitions enforced in the service layer.
// Terminal states (APPROVED, DECLINED, EXPIRED) have empty arrays — no further transitions.
export const ESTIMATE_STATUS_TRANSITIONS: Record<EstimateStatus, EstimateStatus[]> = {
  DRAFT: ["INTERNAL_REVIEW", "SENT"],
  INTERNAL_REVIEW: ["DRAFT", "SENT"],
  SENT: ["APPROVED", "DECLINED", "EXPIRED"],
  APPROVED: [],
  DECLINED: [],
  EXPIRED: [],
};

export const EstimateFilterSchema = z.object({
  status: z.nativeEnum(EstimateStatus).optional(),
  customerId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().cuid().optional(),
});

export type CreateEstimateInput = z.infer<typeof CreateEstimateSchema>;
export type UpdateEstimateInput = z.infer<typeof UpdateEstimateSchema>;
export type EstimateFilter = z.infer<typeof EstimateFilterSchema>;
