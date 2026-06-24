import { z } from "zod";

export const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(255),
  companyName: z.string().max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(30).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  postalCode: z.string().max(20).optional(),
  notes: z.string().max(10_000).optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const CustomerFilterSchema = z.object({
  search: z.string().max(200).optional(),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().cuid().optional(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type CustomerFilter = z.infer<typeof CustomerFilterSchema>;
