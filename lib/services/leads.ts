import { prisma } from "@/lib/prisma";
import type { LeadStatus } from "@prisma/client";
import type {
  CreateLeadInput,
  UpdateLeadInput,
  LeadFilter,
} from "@/lib/validation/lead";

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function listLeads(orgId: string, filter?: LeadFilter) {
  return prisma.lead.findMany({
    where: {
      orgId,
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.assignedToId ? { assignedToId: filter.assignedToId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: filter?.limit ?? 50,
    ...(filter?.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    include: {
      customer: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
}

export async function getLead(orgId: string, id: string) {
  return prisma.lead.findFirst({
    where: { id, orgId },
    include: {
      customer: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createLead(orgId: string, input: CreateLeadInput) {
  if (input.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, orgId },
      select: { id: true },
    });
    if (!customer) throw new Error("Customer not found in this organization");
  }

  if (input.assignedToId) {
    const profile = await prisma.userProfile.findFirst({
      where: { id: input.assignedToId, orgId },
      select: { id: true },
    });
    if (!profile) throw new Error("User not found in this organization");
  }

  return prisma.lead.create({
    data: { ...input, orgId },
  });
}

export async function updateLead(
  orgId: string,
  id: string,
  input: UpdateLeadInput
) {
  const existing = await prisma.lead.findFirst({
    where: { id, orgId },
    select: { id: true },
  });
  if (!existing) return null;

  if (input.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, orgId },
      select: { id: true },
    });
    if (!customer) throw new Error("Customer not found in this organization");
  }

  if (input.assignedToId) {
    const profile = await prisma.userProfile.findFirst({
      where: { id: input.assignedToId, orgId },
      select: { id: true },
    });
    if (!profile) throw new Error("User not found in this organization");
  }

  return prisma.lead.update({ where: { id }, data: input });
}

export async function updateLeadStatus(
  orgId: string,
  id: string,
  status: LeadStatus
) {
  const existing = await prisma.lead.findFirst({
    where: { id, orgId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.lead.update({ where: { id }, data: { status } });
}

export async function assignLead(
  orgId: string,
  id: string,
  assignedToId: string | null
) {
  const existing = await prisma.lead.findFirst({
    where: { id, orgId },
    select: { id: true },
  });
  if (!existing) return null;

  if (assignedToId !== null) {
    const profile = await prisma.userProfile.findFirst({
      where: { id: assignedToId, orgId },
      select: { id: true },
    });
    if (!profile) throw new Error("User not found in this organization");
  }

  return prisma.lead.update({ where: { id }, data: { assignedToId } });
}

export async function deleteLead(orgId: string, id: string) {
  const existing = await prisma.lead.findFirst({
    where: { id, orgId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.lead.delete({ where: { id } });
}
