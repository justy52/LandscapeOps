import { prisma } from "@/lib/prisma";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilter,
} from "@/lib/validation/customer";

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function listCustomers(orgId: string, filter?: CustomerFilter) {
  return prisma.customer.findMany({
    where: {
      orgId,
      ...(filter?.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: "insensitive" } },
              { companyName: { contains: filter.search, mode: "insensitive" } },
              { email: { contains: filter.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: filter?.limit ?? 50,
    ...(filter?.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
  });
}

export async function getCustomer(orgId: string, id: string) {
  return prisma.customer.findFirst({
    where: { id, orgId },
  });
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createCustomer(orgId: string, input: CreateCustomerInput) {
  return prisma.customer.create({
    data: { ...input, orgId },
  });
}

export async function updateCustomer(
  orgId: string,
  id: string,
  input: UpdateCustomerInput
) {
  const existing = await prisma.customer.findFirst({
    where: { id, orgId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.customer.update({ where: { id }, data: input });
}

export async function deleteCustomer(orgId: string, id: string) {
  const existing = await prisma.customer.findFirst({
    where: { id, orgId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.customer.delete({ where: { id } });
}
