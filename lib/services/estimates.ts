import { prisma } from "@/lib/prisma";
import type { EstimateStatus } from "@prisma/client";
import {
  ESTIMATE_STATUS_TRANSITIONS,
} from "@/lib/validation/estimate";
import type {
  CreateEstimateInput,
  UpdateEstimateInput,
  EstimateFilter,
} from "@/lib/validation/estimate";

// ─── Estimate Number Generation ───────────────────────────────────────────────
// Format: EST-{YYYY}-{NNNN} — sequential per org per calendar year.
// @@unique([orgId, number]) on Estimate prevents duplicates if two requests race.
// For Phase 2 single-org landscaping orgs, this race is extremely unlikely.
// A dedicated sequence table or advisory lock can be added later if needed.

async function generateEstimateNumber(orgId: string): Promise<string> {
  const year = new Date().getFullYear().toString();
  const prefix = `EST-${year}-`;

  const last = await prisma.estimate.findFirst({
    where: { orgId, number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  let seq = 1;
  if (last) {
    const suffix = last.number.slice(prefix.length);
    const parsed = parseInt(suffix, 10);
    if (!isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function listEstimates(orgId: string, filter?: EstimateFilter) {
  return prisma.estimate.findMany({
    where: {
      orgId,
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.customerId ? { customerId: filter.customerId } : {}),
      ...(filter?.leadId ? { leadId: filter.leadId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filter?.limit ?? 50,
    ...(filter?.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    include: {
      customer: { select: { id: true, name: true } },
    },
  });
}

export async function getEstimate(orgId: string, id: string) {
  return prisma.estimate.findFirst({
    where: { id, orgId },
    include: {
      customer: { select: { id: true, name: true } },
      lead: { select: { id: true, title: true } },
    },
  });
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createEstimate(orgId: string, input: CreateEstimateInput) {
  // 1. Verify customer belongs to this org
  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, orgId },
    select: { id: true },
  });
  if (!customer) throw new Error("Customer not found in this organization");

  // 2. Verify lead belongs to this org (if provided)
  if (input.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, orgId },
      select: { id: true },
    });
    if (!lead) throw new Error("Lead not found in this organization");
  }

  // 3. Generate number and compute totalCents server-side
  const number = await generateEstimateNumber(orgId);
  const subtotalCents = input.subtotalCents ?? 0;
  const taxCents = input.taxCents ?? 0;
  const totalCents = subtotalCents + taxCents;

  return prisma.estimate.create({
    data: {
      ...input,
      orgId,
      number,
      subtotalCents,
      taxCents,
      totalCents,
    },
  });
}

export async function updateEstimate(
  orgId: string,
  id: string,
  input: UpdateEstimateInput
) {
  const existing = await prisma.estimate.findFirst({
    where: { id, orgId },
    select: { id: true, status: true, subtotalCents: true, taxCents: true },
  });
  if (!existing) return null;

  // Content edits are only allowed in DRAFT or INTERNAL_REVIEW
  if (
    existing.status !== "DRAFT" &&
    existing.status !== "INTERNAL_REVIEW"
  ) {
    throw new Error(
      `Estimate in ${existing.status} status cannot be edited. Only DRAFT and INTERNAL_REVIEW estimates are editable.`
    );
  }

  const subtotalCents = input.subtotalCents ?? existing.subtotalCents;
  const taxCents = input.taxCents ?? existing.taxCents;
  const totalCents = subtotalCents + taxCents;

  return prisma.estimate.update({
    where: { id },
    data: { ...input, subtotalCents, taxCents, totalCents },
  });
}

export async function transitionEstimateStatus(
  orgId: string,
  id: string,
  newStatus: EstimateStatus
) {
  const existing = await prisma.estimate.findFirst({
    where: { id, orgId },
    select: { id: true, status: true },
  });
  if (!existing) return null;

  const allowed = ESTIMATE_STATUS_TRANSITIONS[existing.status];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Cannot transition estimate from ${existing.status} to ${newStatus}`
    );
  }

  const timestamps: Partial<{ sentAt: Date; approvedAt: Date }> = {};
  if (newStatus === "SENT") timestamps.sentAt = new Date();
  if (newStatus === "APPROVED") timestamps.approvedAt = new Date();

  return prisma.estimate.update({
    where: { id },
    data: { status: newStatus, ...timestamps },
  });
}

export async function deleteEstimate(orgId: string, id: string) {
  const existing = await prisma.estimate.findFirst({
    where: { id, orgId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.estimate.delete({ where: { id } });
}
