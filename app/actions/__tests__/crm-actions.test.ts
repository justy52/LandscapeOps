import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyActionState } from "@/lib/action-state";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  createCustomer: vi.fn(),
  createEstimate: vi.fn(),
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
  updateCustomer: vi.fn(),
}));

vi.mock("@/lib/services/leads", () => ({
  assignLead: vi.fn(),
  createLead: vi.fn(),
  getLead: vi.fn(),
  updateLead: vi.fn(),
  updateLeadStatus: vi.fn(),
}));

vi.mock("@/lib/services/estimates", () => ({
  createEstimate: mocks.createEstimate,
  getEstimate: mocks.getEstimate,
  transitionEstimateStatus: mocks.transitionEstimateStatus,
  updateEstimate: vi.fn(),
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
  transitionEstimateStatusAction,
} from "@/app/actions/crm";

const ORG_A = "clhd1aaa0000008l0aaaaaaaaa";
const ACTOR_ID = "clhd1actor000008l0aaaaaaaa";

function authContext() {
  mocks.requireRole.mockResolvedValue({
    orgId: ORG_A,
    profile: { id: ACTOR_ID, role: "MANAGER" },
  });
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
