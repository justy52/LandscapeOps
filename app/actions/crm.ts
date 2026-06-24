"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EstimateStatus } from "@prisma/client";
import { z, ZodError, type ZodType } from "zod";
import { requireRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import {
  createCustomer,
  updateCustomer,
} from "@/lib/services/customers";
import {
  assignLead,
  createLead,
  getLead,
  updateLead,
  updateLeadStatus,
} from "@/lib/services/leads";
import {
  createEstimate,
  getEstimate,
  transitionEstimateStatus,
  updateEstimate,
} from "@/lib/services/estimates";
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
} from "@/lib/validation/customer";
import {
  AssignLeadSchema,
  CreateLeadSchema,
  UpdateLeadSchema,
  UpdateLeadStatusSchema,
} from "@/lib/validation/lead";
import {
  CreateEstimateSchema,
  UpdateEstimateSchema,
} from "@/lib/validation/estimate";
import type { ActionState } from "@/lib/action-state";

type AuditInput = {
  orgId: string;
  actorId: string;
  action: string;
  entityType: "Customer" | "Lead" | "Estimate";
  entityId: string;
  metadata?: Record<string, string | number | boolean | null | string[]>;
};

type ParseResult<T> =
  | { input: T; state: null }
  | { input: null; state: ActionState };

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requiredString(formData: FormData, key: string) {
  return optionalString(formData, key) ?? "";
}

function optionalDate(formData: FormData, key: string) {
  return optionalString(formData, key);
}

function optionalPercent(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  if (!value) return undefined;
  return Number(value);
}

function currencyToCents(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  if (!value) return undefined;

  const normalized = value.replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;

  const [dollars, cents = ""] = normalized.split(".");
  return Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
}

function parseActionInput<T>(schema: ZodType<T>, input: unknown): ParseResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { input: result.data, state: null };
  }

  return {
    input: null,
    state: {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: result.error.flatten().fieldErrors,
    } satisfies ActionState,
  };
}

function errorState(error: unknown): ActionState {
  if (error instanceof ZodError) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: error.flatten().fieldErrors,
    };
  }

  if (error instanceof Error) {
    return { ok: false, message: error.message };
  }

  return { ok: false, message: "Something went wrong. Try again." };
}

async function writeAuditLog({
  orgId,
  actorId,
  action,
  entityType,
  entityId,
  metadata,
}: AuditInput) {
  await prisma.auditLog.create({
    data: {
      orgId,
      actorId,
      action,
      entityType,
      entityId,
      metadata: metadata ?? {},
    },
  });
}

function customerInput(formData: FormData) {
  return {
    name: requiredString(formData, "name"),
    companyName: optionalString(formData, "companyName"),
    email: optionalString(formData, "email"),
    phone: optionalString(formData, "phone"),
    addressLine1: optionalString(formData, "addressLine1"),
    addressLine2: optionalString(formData, "addressLine2"),
    city: optionalString(formData, "city"),
    state: optionalString(formData, "state"),
    postalCode: optionalString(formData, "postalCode"),
    notes: optionalString(formData, "notes"),
  };
}

function leadInput(formData: FormData) {
  return {
    title: requiredString(formData, "title"),
    source: optionalString(formData, "source"),
    budgetCents: currencyToCents(formData, "budgetDollars"),
    siteAddress: optionalString(formData, "siteAddress"),
    nextActionAt: optionalDate(formData, "nextActionAt"),
    notes: optionalString(formData, "notes"),
    customerId: optionalString(formData, "customerId"),
  };
}

function estimateInput(formData: FormData) {
  return {
    title: requiredString(formData, "title"),
    customerId: requiredString(formData, "customerId"),
    leadId: optionalString(formData, "leadId"),
    subtotalCents: currencyToCents(formData, "subtotalDollars") ?? 0,
    taxCents: currencyToCents(formData, "taxDollars") ?? 0,
    marginPercent: optionalPercent(formData, "marginPercent"),
  };
}

function estimateUpdateInput(formData: FormData) {
  return {
    title: optionalString(formData, "title"),
    subtotalCents: currencyToCents(formData, "subtotalDollars"),
    taxCents: currencyToCents(formData, "taxDollars"),
    marginPercent: optionalPercent(formData, "marginPercent"),
  };
}

function changedFields(input: Record<string, unknown>) {
  return Object.entries(input)
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key);
}

export async function createCustomerAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { orgId, profile } = await requireRole("MANAGER");
  const parsed = parseActionInput(CreateCustomerSchema, customerInput(formData));
  if (parsed.state) return parsed.state;

  let customer: Awaited<ReturnType<typeof createCustomer>>;
  try {
    customer = await createCustomer(orgId, parsed.input);
  } catch (error) {
    return errorState(error);
  }

  try {
    await writeAuditLog({
      orgId,
      actorId: profile.id,
      action: "customer.created",
      entityType: "Customer",
      entityId: customer.id,
      metadata: {
        name: customer.name,
        companyName: customer.companyName,
      },
    });
  } catch {
    // best-effort — log failure never masks a successful write
  }

  revalidatePath("/dashboard/crm/customers");
  redirect("/dashboard/crm/customers");
}

export async function updateCustomerAction(
  customerId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { orgId, profile } = await requireRole("MANAGER");
  const parsed = parseActionInput(UpdateCustomerSchema, customerInput(formData));
  if (parsed.state) return parsed.state;

  let auditEntityId: string;
  try {
    const customer = await updateCustomer(orgId, customerId, parsed.input);
    if (!customer) {
      return { ok: false, message: "Customer not found in this organization." };
    }
    auditEntityId = customer.id;
  } catch (error) {
    return errorState(error);
  }

  try {
    await writeAuditLog({
      orgId,
      actorId: profile.id,
      action: "customer.updated",
      entityType: "Customer",
      entityId: auditEntityId,
      metadata: { fields: changedFields(parsed.input) },
    });
  } catch {
    // best-effort — log failure never masks a successful write
  }

  revalidatePath("/dashboard/crm/customers");
  redirect("/dashboard/crm/customers");
}

export async function createLeadAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { orgId, profile } = await requireRole("MANAGER");
  const parsed = parseActionInput(CreateLeadSchema, leadInput(formData));
  if (parsed.state) return parsed.state;

  let lead: Awaited<ReturnType<typeof createLead>>;
  try {
    lead = await createLead(orgId, parsed.input);
  } catch (error) {
    return errorState(error);
  }

  try {
    await writeAuditLog({
      orgId,
      actorId: profile.id,
      action: "lead.created",
      entityType: "Lead",
      entityId: lead.id,
      metadata: {
        status: lead.status,
        source: lead.source,
      },
    });
  } catch {
    // best-effort — log failure never masks a successful write
  }

  revalidatePath("/dashboard/crm/leads");
  redirect("/dashboard/crm/leads");
}

export async function updateLeadAction(
  leadId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { orgId, profile } = await requireRole("MANAGER");
  const parsed = parseActionInput(UpdateLeadSchema, leadInput(formData));
  if (parsed.state) return parsed.state;

  let auditEntityId: string;
  try {
    const lead = await updateLead(orgId, leadId, parsed.input);
    if (!lead) {
      return { ok: false, message: "Lead not found in this organization." };
    }
    auditEntityId = lead.id;
  } catch (error) {
    return errorState(error);
  }

  try {
    await writeAuditLog({
      orgId,
      actorId: profile.id,
      action: "lead.updated",
      entityType: "Lead",
      entityId: auditEntityId,
      metadata: { fields: changedFields(parsed.input) },
    });
  } catch {
    // best-effort — log failure never masks a successful write
  }

  revalidatePath("/dashboard/crm/leads");
  redirect("/dashboard/crm/leads");
}

export async function updateLeadStatusAction(
  leadId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { orgId, profile } = await requireRole("MANAGER");
  const parsed = parseActionInput(UpdateLeadStatusSchema, {
    status: formData.get("status"),
  });
  if (parsed.state) return parsed.state;

  let auditEntityId: string;
  let auditFrom: string;
  let auditTo: string;
  try {
    const previous = await getLead(orgId, leadId);
    if (!previous) {
      return { ok: false, message: "Lead not found in this organization." };
    }

    const lead = await updateLeadStatus(orgId, leadId, parsed.input.status);
    if (!lead) {
      return { ok: false, message: "Lead not found in this organization." };
    }

    auditEntityId = lead.id;
    auditFrom = previous.status;
    auditTo = lead.status;
  } catch (error) {
    return errorState(error);
  }

  try {
    await writeAuditLog({
      orgId,
      actorId: profile.id,
      action: "lead.status_changed",
      entityType: "Lead",
      entityId: auditEntityId,
      metadata: { from: auditFrom, to: auditTo },
    });
  } catch {
    // best-effort — log failure never masks a successful write
  }

  revalidatePath("/dashboard/crm/leads");
  redirect("/dashboard/crm/leads");
}

export async function assignLeadAction(
  leadId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { orgId, profile } = await requireRole("MANAGER");
  const assignedToId = optionalString(formData, "assignedToId") ?? null;
  const parsed = parseActionInput(AssignLeadSchema, { assignedToId });
  if (parsed.state) return parsed.state;

  let auditEntityId: string;
  try {
    const lead = await assignLead(orgId, leadId, parsed.input.assignedToId);
    if (!lead) {
      return { ok: false, message: "Lead not found in this organization." };
    }
    auditEntityId = lead.id;
  } catch (error) {
    return errorState(error);
  }

  try {
    await writeAuditLog({
      orgId,
      actorId: profile.id,
      action: "lead.assigned",
      entityType: "Lead",
      entityId: auditEntityId,
      metadata: { assignedToId: parsed.input.assignedToId },
    });
  } catch {
    // best-effort — log failure never masks a successful write
  }

  revalidatePath("/dashboard/crm/leads");
  redirect("/dashboard/crm/leads");
}

export async function createEstimateAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { orgId, profile } = await requireRole("MANAGER");
  const parsed = parseActionInput(CreateEstimateSchema, estimateInput(formData));
  if (parsed.state) return parsed.state;

  let estimate: Awaited<ReturnType<typeof createEstimate>>;
  try {
    estimate = await createEstimate(orgId, parsed.input);
  } catch (error) {
    return errorState(error);
  }

  try {
    await writeAuditLog({
      orgId,
      actorId: profile.id,
      action: "estimate.created",
      entityType: "Estimate",
      entityId: estimate.id,
      metadata: {
        number: estimate.number,
        status: estimate.status,
      },
    });
  } catch {
    // best-effort — log failure never masks a successful write
  }

  revalidatePath("/dashboard/crm/estimates");
  redirect(`/dashboard/crm/estimates/${estimate.id}`);
}

export async function updateEstimateAction(
  estimateId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { orgId, profile } = await requireRole("MANAGER");
  const parsed = parseActionInput(UpdateEstimateSchema, estimateUpdateInput(formData));
  if (parsed.state) return parsed.state;

  let auditEntityId: string;
  let auditNumber: string;
  try {
    const estimate = await updateEstimate(orgId, estimateId, parsed.input);
    if (!estimate) {
      return { ok: false, message: "Estimate not found in this organization." };
    }
    auditEntityId = estimate.id;
    auditNumber = estimate.number;
  } catch (error) {
    return errorState(error);
  }

  try {
    await writeAuditLog({
      orgId,
      actorId: profile.id,
      action: "estimate.updated",
      entityType: "Estimate",
      entityId: auditEntityId,
      metadata: {
        number: auditNumber,
        fields: changedFields(parsed.input),
      },
    });
  } catch {
    // best-effort — log failure never masks a successful write
  }

  revalidatePath("/dashboard/crm/estimates");
  redirect(`/dashboard/crm/estimates/${estimateId}`);
}

export async function transitionEstimateStatusAction(
  estimateId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { orgId, profile } = await requireRole("MANAGER");
  const parsed = parseActionInput(
    z.object({ status: z.nativeEnum(EstimateStatus) }),
    {
      status: formData.get("status"),
    }
  );
  if (parsed.state) return parsed.state;

  let auditEntityId: string;
  let auditNumber: string;
  let auditFrom: string;
  let auditTo: string;
  try {
    const previous = await getEstimate(orgId, estimateId);
    if (!previous) {
      return { ok: false, message: "Estimate not found in this organization." };
    }

    const estimate = await transitionEstimateStatus(
      orgId,
      estimateId,
      parsed.input.status as EstimateStatus
    );
    if (!estimate) {
      return { ok: false, message: "Estimate not found in this organization." };
    }

    auditEntityId = estimate.id;
    auditNumber = estimate.number;
    auditFrom = previous.status;
    auditTo = estimate.status;
  } catch (error) {
    return errorState(error);
  }

  try {
    await writeAuditLog({
      orgId,
      actorId: profile.id,
      action: "estimate.status_changed",
      entityType: "Estimate",
      entityId: auditEntityId,
      metadata: {
        number: auditNumber,
        from: auditFrom,
        to: auditTo,
      },
    });
  } catch {
    // best-effort — log failure never masks a successful write
  }

  revalidatePath("/dashboard/crm/estimates");
  redirect(`/dashboard/crm/estimates/${estimateId}`);
}
