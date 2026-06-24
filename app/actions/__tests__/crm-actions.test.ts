import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyActionState } from "@/lib/action-state";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  createLead: vi.fn(),
  updateLead: vi.fn(),
  getLead: vi.fn(),
  updateLeadStatus: vi.fn(),
  assignLead: vi.fn(),
  createEstimate: vi.fn(),
  updateEstimate: vi.fn(),
  getEstimate: vi.fn(),
  transitionEstimateStatus: vi.fn(),
  auditCreate: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("@/lib/auth/roles", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/lib/services/customers", () => ({
  createCustomer: mocks.createCustomer,
  updateCustomer: mocks.updateCustomer,
}));

vi.mock("@/lib/services/leads", () => ({
  assignLead: mocks.assignLead,
  createLead: mocks.createLead,
  getLead: mocks.getLead,
  updateLead: mocks.updateLead,
  updateLeadStatus: mocks.updateLeadStatus,
}));

vi.mock("@/lib/services/estimates", () => ({
  createEstimate: mocks.createEstimate,
  getEstimate: mocks.getEstimate,
  transitionEstimateStatus: mocks.transitionEstimateStatus,
  updateEstimate: mocks.updateEstimate,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: mocks.auditCreate,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import {
  createCustomerAction,
  createEstimateAction,
  createLeadAction,
  assignLeadAction,
  transitionEstimateStatusAction,
  updateCustomerAction,
  updateEstimateAction,
  updateLeadAction,
  updateLeadStatusAction,
} from "@/app/actions/crm";

const ORG_A = "clhd1aaa0000008l0aaaaaaaaa";
const ACTOR_ID = "clhd1actor000008l0aaaaaaaa";
const CUSTOMER_ID = "clhd1cust000008l0aaaaaaaa";
const LEAD_ID = "clhd1lead000008l0aaaaaaaa";
const ESTIMATE_ID = "clhd1estm000008l0aaaaaaaa";
const USER_ID = "clhd1user000008l0aaaaaaaa";

function authContext() {
  mocks.requireRole.mockResolvedValue({
    orgId: ORG_A,
    profile: { id: ACTOR_ID, role: "MANAGER" },
  });
}

function expectAuditAfter(serviceMock: ReturnType<typeof vi.fn>) {
  expect(mocks.auditCreate).toHaveBeenCalledTimes(1);
  expect(mocks.auditCreate.mock.invocationCallOrder[0]).toBeGreaterThan(
    serviceMock.mock.invocationCallOrder[0]
  );
}

describe("CRM server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authContext();
  });

  it("createCustomerAction uses requireRole orgId and writes an audit log", async () => {
    const formData = new FormData();
    formData.set("name", "Mesa HOA");
    formData.set("email", "ops@example.com");
    formData.set("orgId", "attacker-org");

    mocks.createCustomer.mockResolvedValue({
      id: "cust-1",
      name: "Mesa HOA",
      companyName: null,
    });

    await expect(createCustomerAction(emptyActionState, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard/crm/customers"
    );

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(mocks.createCustomer).toHaveBeenCalledWith(
      ORG_A,
      expect.not.objectContaining({ orgId: "attacker-org" })
    );
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: ORG_A,
          actorId: ACTOR_ID,
          action: "customer.created",
          entityType: "Customer",
          entityId: "cust-1",
        }),
      })
    );
  });

  it("createCustomerAction returns validation errors before service or audit calls", async () => {
    const formData = new FormData();
    formData.set("name", "");

    const result = await createCustomerAction(emptyActionState, formData);

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.name?.length).toBeGreaterThan(0);
    expect(mocks.createCustomer).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("updateCustomerAction uses resolved orgId and audits after service success", async () => {
    const formData = new FormData();
    formData.set("name", "Mesa HOA Updated");
    formData.set("orgId", "attacker-org");

    mocks.updateCustomer.mockResolvedValue({ id: CUSTOMER_ID });

    await expect(
      updateCustomerAction(CUSTOMER_ID, emptyActionState, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard/crm/customers");

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(mocks.updateCustomer).toHaveBeenCalledWith(
      ORG_A,
      CUSTOMER_ID,
      expect.not.objectContaining({ orgId: "attacker-org" })
    );
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: ORG_A,
          actorId: ACTOR_ID,
          action: "customer.updated",
          entityType: "Customer",
          entityId: CUSTOMER_ID,
        }),
      })
    );
    expectAuditAfter(mocks.updateCustomer);
  });

  it("updateCustomerAction validation errors stop before service or audit calls", async () => {
    const formData = new FormData();
    formData.set("name", "");

    const result = await updateCustomerAction(CUSTOMER_ID, emptyActionState, formData);

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.name?.length).toBeGreaterThan(0);
    expect(mocks.updateCustomer).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("updateCustomerAction does not audit when the service fails", async () => {
    const formData = new FormData();
    formData.set("name", "Mesa HOA Updated");

    mocks.updateCustomer.mockRejectedValue(new Error("service failed"));

    const result = await updateCustomerAction(CUSTOMER_ID, emptyActionState, formData);

    expect(result.ok).toBe(false);
    expect(mocks.updateCustomer).toHaveBeenCalledWith(
      ORG_A,
      CUSTOMER_ID,
      expect.any(Object)
    );
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("createLeadAction uses resolved orgId and audits after service success", async () => {
    const formData = new FormData();
    formData.set("title", "Courtyard refresh");
    formData.set("source", "Referral");
    formData.set("budgetDollars", "1200.50");
    formData.set("customerId", CUSTOMER_ID);
    formData.set("orgId", "attacker-org");

    mocks.createLead.mockResolvedValue({
      id: LEAD_ID,
      status: "NEW",
      source: "Referral",
    });

    await expect(createLeadAction(emptyActionState, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard/crm/leads"
    );

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(mocks.createLead).toHaveBeenCalledWith(
      ORG_A,
      expect.objectContaining({
        title: "Courtyard refresh",
        source: "Referral",
        budgetCents: 120050,
        customerId: CUSTOMER_ID,
      })
    );
    expect(mocks.createLead).toHaveBeenCalledWith(
      ORG_A,
      expect.not.objectContaining({ orgId: "attacker-org" })
    );
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: ORG_A,
          actorId: ACTOR_ID,
          action: "lead.created",
          entityType: "Lead",
          entityId: LEAD_ID,
        }),
      })
    );
    expectAuditAfter(mocks.createLead);
  });

  it("createLeadAction validation errors stop before service or audit calls", async () => {
    const formData = new FormData();
    formData.set("title", "");

    const result = await createLeadAction(emptyActionState, formData);

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.title?.length).toBeGreaterThan(0);
    expect(mocks.createLead).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("createLeadAction does not audit when the service fails", async () => {
    const formData = new FormData();
    formData.set("title", "Courtyard refresh");

    mocks.createLead.mockRejectedValue(new Error("service failed"));

    const result = await createLeadAction(emptyActionState, formData);

    expect(result.ok).toBe(false);
    expect(mocks.createLead).toHaveBeenCalledWith(ORG_A, expect.any(Object));
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("updateLeadAction uses resolved orgId and audits after service success", async () => {
    const formData = new FormData();
    formData.set("title", "Entry planting");
    formData.set("customerId", CUSTOMER_ID);
    formData.set("orgId", "attacker-org");

    mocks.updateLead.mockResolvedValue({ id: LEAD_ID });

    await expect(
      updateLeadAction(LEAD_ID, emptyActionState, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard/crm/leads");

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(mocks.updateLead).toHaveBeenCalledWith(
      ORG_A,
      LEAD_ID,
      expect.objectContaining({
        title: "Entry planting",
        customerId: CUSTOMER_ID,
      })
    );
    expect(mocks.updateLead).toHaveBeenCalledWith(
      ORG_A,
      LEAD_ID,
      expect.not.objectContaining({ orgId: "attacker-org" })
    );
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: ORG_A,
          actorId: ACTOR_ID,
          action: "lead.updated",
          entityType: "Lead",
          entityId: LEAD_ID,
        }),
      })
    );
    expectAuditAfter(mocks.updateLead);
  });

  it("updateLeadAction validation errors stop before service or audit calls", async () => {
    const formData = new FormData();
    formData.set("title", "");

    const result = await updateLeadAction(LEAD_ID, emptyActionState, formData);

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.title?.length).toBeGreaterThan(0);
    expect(mocks.updateLead).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("updateLeadAction does not audit when the service fails", async () => {
    const formData = new FormData();
    formData.set("title", "Entry planting");

    mocks.updateLead.mockRejectedValue(new Error("service failed"));

    const result = await updateLeadAction(LEAD_ID, emptyActionState, formData);

    expect(result.ok).toBe(false);
    expect(mocks.updateLead).toHaveBeenCalledWith(ORG_A, LEAD_ID, expect.any(Object));
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("updateLeadStatusAction uses resolved orgId and audits after service success", async () => {
    const formData = new FormData();
    formData.set("status", "CONTACTED");
    formData.set("orgId", "attacker-org");

    mocks.getLead.mockResolvedValue({ id: LEAD_ID, status: "NEW" });
    mocks.updateLeadStatus.mockResolvedValue({ id: LEAD_ID, status: "CONTACTED" });

    await expect(
      updateLeadStatusAction(LEAD_ID, emptyActionState, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard/crm/leads");

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(mocks.getLead).toHaveBeenCalledWith(ORG_A, LEAD_ID);
    expect(mocks.updateLeadStatus).toHaveBeenCalledWith(ORG_A, LEAD_ID, "CONTACTED");
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: ORG_A,
          actorId: ACTOR_ID,
          action: "lead.status_changed",
          entityType: "Lead",
          entityId: LEAD_ID,
          metadata: expect.objectContaining({
            from: "NEW",
            to: "CONTACTED",
          }),
        }),
      })
    );
    expectAuditAfter(mocks.updateLeadStatus);
  });

  it("updateLeadStatusAction validation errors stop before service or audit calls", async () => {
    const formData = new FormData();
    formData.set("status", "INVALID");

    const result = await updateLeadStatusAction(LEAD_ID, emptyActionState, formData);

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.status?.length).toBeGreaterThan(0);
    expect(mocks.getLead).not.toHaveBeenCalled();
    expect(mocks.updateLeadStatus).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("updateLeadStatusAction does not audit when the service fails", async () => {
    const formData = new FormData();
    formData.set("status", "CONTACTED");

    mocks.getLead.mockResolvedValue({ id: LEAD_ID, status: "NEW" });
    mocks.updateLeadStatus.mockRejectedValue(new Error("service failed"));

    const result = await updateLeadStatusAction(LEAD_ID, emptyActionState, formData);

    expect(result.ok).toBe(false);
    expect(mocks.updateLeadStatus).toHaveBeenCalledWith(ORG_A, LEAD_ID, "CONTACTED");
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("assignLeadAction uses resolved orgId and audits after service success", async () => {
    const formData = new FormData();
    formData.set("assignedToId", USER_ID);
    formData.set("orgId", "attacker-org");

    mocks.assignLead.mockResolvedValue({ id: LEAD_ID });

    await expect(
      assignLeadAction(LEAD_ID, emptyActionState, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard/crm/leads");

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(mocks.assignLead).toHaveBeenCalledWith(ORG_A, LEAD_ID, USER_ID);
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: ORG_A,
          actorId: ACTOR_ID,
          action: "lead.assigned",
          entityType: "Lead",
          entityId: LEAD_ID,
          metadata: expect.objectContaining({
            assignedToId: USER_ID,
          }),
        }),
      })
    );
    expectAuditAfter(mocks.assignLead);
  });

  it("assignLeadAction passes null for a cleared assignee", async () => {
    const formData = new FormData();
    formData.set("assignedToId", "");

    mocks.assignLead.mockResolvedValue({ id: LEAD_ID });

    await expect(
      assignLeadAction(LEAD_ID, emptyActionState, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard/crm/leads");

    expect(mocks.assignLead).toHaveBeenCalledWith(ORG_A, LEAD_ID, null);
  });

  it("assignLeadAction validation errors stop before service or audit calls", async () => {
    const formData = new FormData();
    formData.set("assignedToId", "not-a-cuid");

    const result = await assignLeadAction(LEAD_ID, emptyActionState, formData);

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.assignedToId?.length).toBeGreaterThan(0);
    expect(mocks.assignLead).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("assignLeadAction does not audit when the service fails", async () => {
    const formData = new FormData();
    formData.set("assignedToId", USER_ID);

    mocks.assignLead.mockRejectedValue(new Error("service failed"));

    const result = await assignLeadAction(LEAD_ID, emptyActionState, formData);

    expect(result.ok).toBe(false);
    expect(mocks.assignLead).toHaveBeenCalledWith(ORG_A, LEAD_ID, USER_ID);
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("updateEstimateAction uses resolved orgId and audits after service success", async () => {
    const formData = new FormData();
    formData.set("title", "Backyard renovation revised");
    formData.set("subtotalDollars", "5000.00");
    formData.set("taxDollars", "350.00");
    formData.set("marginPercent", "42");
    formData.set("orgId", "attacker-org");
    formData.set("totalCents", "1");

    mocks.updateEstimate.mockResolvedValue({
      id: ESTIMATE_ID,
      number: "EST-2026-0001",
    });

    await expect(
      updateEstimateAction(ESTIMATE_ID, emptyActionState, formData)
    ).rejects.toThrow(`NEXT_REDIRECT:/dashboard/crm/estimates/${ESTIMATE_ID}`);

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(mocks.updateEstimate).toHaveBeenCalledWith(
      ORG_A,
      ESTIMATE_ID,
      expect.objectContaining({
        title: "Backyard renovation revised",
        subtotalCents: 500000,
        taxCents: 35000,
        marginPercent: 42,
      })
    );
    expect(mocks.updateEstimate).toHaveBeenCalledWith(
      ORG_A,
      ESTIMATE_ID,
      expect.not.objectContaining({
        orgId: expect.anything(),
        totalCents: expect.anything(),
      })
    );
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: ORG_A,
          actorId: ACTOR_ID,
          action: "estimate.updated",
          entityType: "Estimate",
          entityId: ESTIMATE_ID,
        }),
      })
    );
    expectAuditAfter(mocks.updateEstimate);
  });

  it("updateEstimateAction validation errors stop before service or audit calls", async () => {
    const formData = new FormData();
    formData.set("title", "Backyard renovation revised");
    formData.set("subtotalDollars", "12.345");

    const result = await updateEstimateAction(ESTIMATE_ID, emptyActionState, formData);

    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.subtotalCents?.length).toBeGreaterThan(0);
    expect(mocks.updateEstimate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("updateEstimateAction does not audit when the service fails", async () => {
    const formData = new FormData();
    formData.set("title", "Backyard renovation revised");

    mocks.updateEstimate.mockRejectedValue(new Error("service failed"));

    const result = await updateEstimateAction(ESTIMATE_ID, emptyActionState, formData);

    expect(result.ok).toBe(false);
    expect(mocks.updateEstimate).toHaveBeenCalledWith(
      ORG_A,
      ESTIMATE_ID,
      expect.any(Object)
    );
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("createEstimateAction ignores submitted orgId, number, and totalCents", async () => {
    const formData = new FormData();
    formData.set("title", "Backyard renovation");
    formData.set("customerId", "clhd1cust000008l0aaaaaaaa");
    formData.set("subtotalDollars", "123.45");
    formData.set("taxDollars", "6.78");
    formData.set("orgId", "attacker-org");
    formData.set("number", "EST-2099-9999");
    formData.set("totalCents", "1");

    mocks.createEstimate.mockResolvedValue({
      id: "estimate-1",
      number: "EST-2026-0001",
      status: "DRAFT",
    });

    await expect(createEstimateAction(emptyActionState, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard/crm/estimates/estimate-1"
    );

    expect(mocks.createEstimate).toHaveBeenCalledWith(
      ORG_A,
      expect.objectContaining({
        title: "Backyard renovation",
        customerId: "clhd1cust000008l0aaaaaaaa",
        subtotalCents: 12345,
        taxCents: 678,
      })
    );
    expect(mocks.createEstimate).toHaveBeenCalledWith(
      ORG_A,
      expect.not.objectContaining({
        orgId: expect.anything(),
        number: expect.anything(),
        totalCents: expect.anything(),
      })
    );
  });

  it("transitionEstimateStatusAction audits status changes after service success", async () => {
    const formData = new FormData();
    formData.set("status", "SENT");

    mocks.getEstimate.mockResolvedValue({
      id: "estimate-1",
      number: "EST-2026-0001",
      status: "DRAFT",
    });
    mocks.transitionEstimateStatus.mockResolvedValue({
      id: "estimate-1",
      number: "EST-2026-0001",
      status: "SENT",
    });

    await expect(
      transitionEstimateStatusAction("estimate-1", emptyActionState, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard/crm/estimates/estimate-1");

    expect(mocks.getEstimate).toHaveBeenCalledWith(ORG_A, "estimate-1");
    expect(mocks.transitionEstimateStatus).toHaveBeenCalledWith(
      ORG_A,
      "estimate-1",
      "SENT"
    );
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: ORG_A,
          actorId: ACTOR_ID,
          action: "estimate.status_changed",
          metadata: expect.objectContaining({
            from: "DRAFT",
            to: "SENT",
          }),
        }),
      })
    );
  });
});
