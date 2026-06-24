import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted by vitest — all imports of @/lib/prisma receive the mock.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    lead: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    estimate: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    userProfile: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/lib/services/customers";
import {
  getLead,
  createLead,
  updateLead,
  assignLead,
} from "@/lib/services/leads";
import {
  getEstimate,
  createEstimate,
  updateEstimate,
  transitionEstimateStatus,
} from "@/lib/services/estimates";

// Cast through unknown — vi.mock replaces the module at runtime but TS
// doesn't know the shape changed, so we assert through unknown first.
const db = prisma as unknown as {
  customer: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  lead: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  estimate: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  userProfile: {
    findFirst: ReturnType<typeof vi.fn>;
  };
};

const ORG_A = "clhd1aaa0000008l0aaaaaaaaa";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Customer tenant-safety tests ─────────────────────────────────────────────

describe("customers — tenant isolation", () => {
  it("getCustomer always includes orgId in the WHERE clause", async () => {
    db.customer.findFirst.mockResolvedValue(null);
    await getCustomer(ORG_A, "cust-1");
    expect(db.customer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ orgId: ORG_A }),
      })
    );
  });

  it("getCustomer returns null when the record belongs to a different org", async () => {
    // Prisma returns null — simulates a cross-org record miss
    db.customer.findFirst.mockResolvedValue(null);
    const result = await getCustomer(ORG_A, "cust-from-org-b");
    expect(result).toBeNull();
  });

  it("createCustomer injects orgId from the parameter, not from input", async () => {
    const fakeRecord = { id: "c-new", orgId: ORG_A, name: "Acme" };
    db.customer.create.mockResolvedValue(fakeRecord);
    await createCustomer(ORG_A, { name: "Acme" });
    expect(db.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ orgId: ORG_A }),
      })
    );
  });

  it("updateCustomer verifies org ownership before mutating", async () => {
    // findFirst returns null — the record is in org-b, not org-a
    db.customer.findFirst.mockResolvedValue(null);
    const result = await updateCustomer(ORG_A, "cust-from-org-b", {
      name: "Injected Name",
    });
    expect(result).toBeNull();
    expect(db.customer.update).not.toHaveBeenCalled();
  });

  it("updateCustomer scopes the existence check to orgId", async () => {
    db.customer.findFirst.mockResolvedValue(null);
    await updateCustomer(ORG_A, "any-id", { name: "x" });
    expect(db.customer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ orgId: ORG_A }),
      })
    );
  });

  it("deleteCustomer does not delete records that belong to a different org", async () => {
    db.customer.findFirst.mockResolvedValue(null);
    const result = await deleteCustomer(ORG_A, "cust-from-org-b");
    expect(result).toBeNull();
    expect(db.customer.delete).not.toHaveBeenCalled();
  });
});

// ─── Lead tenant-safety tests ─────────────────────────────────────────────────

describe("leads — tenant isolation", () => {
  it("getLead always includes orgId in the WHERE clause", async () => {
    db.lead.findFirst.mockResolvedValue(null);
    await getLead(ORG_A, "lead-1");
    expect(db.lead.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ orgId: ORG_A }),
      })
    );
  });

  it("getLead returns null for a lead that belongs to a different org", async () => {
    db.lead.findFirst.mockResolvedValue(null);
    const result = await getLead(ORG_A, "lead-from-org-b");
    expect(result).toBeNull();
  });

  it("createLead rejects a customerId that belongs to a different org", async () => {
    db.customer.findFirst.mockResolvedValue(null); // customer not in org-a
    await expect(
      createLead(ORG_A, {
        title: "Spring cleanup",
        customerId: "cust-from-org-b",
      })
    ).rejects.toThrow("Customer not found in this organization");
    expect(db.lead.create).not.toHaveBeenCalled();
  });

  it("createLead rejects an assignedToId that belongs to a different org", async () => {
    // No customerId, so customer check is skipped; only the user check runs
    db.userProfile.findFirst.mockResolvedValue(null); // user not in org-a
    await expect(
      createLead(ORG_A, {
        title: "Spring cleanup",
        assignedToId: "user-from-org-b",
      })
    ).rejects.toThrow("User not found in this organization");
    expect(db.lead.create).not.toHaveBeenCalled();
  });

  it("createLead does not create when customer check fails even if assignedTo would pass", async () => {
    db.customer.findFirst.mockResolvedValue(null); // customer from org-b
    db.userProfile.findFirst.mockResolvedValue({ id: "u-1" }); // user exists (but checked after customer)
    await expect(
      createLead(ORG_A, {
        title: "Job",
        customerId: "cust-from-org-b",
        assignedToId: "u-1",
      })
    ).rejects.toThrow("Customer not found in this organization");
    expect(db.lead.create).not.toHaveBeenCalled();
  });

  it("updateLead returns null when lead belongs to a different org", async () => {
    db.lead.findFirst.mockResolvedValue(null);
    const result = await updateLead(ORG_A, "lead-from-org-b", {
      title: "Injected Title",
    });
    expect(result).toBeNull();
    expect(db.lead.update).not.toHaveBeenCalled();
  });

  it("assignLead rejects an assignedToId from a different org", async () => {
    db.lead.findFirst.mockResolvedValue({ id: "lead-1" }); // lead exists in org-a
    db.userProfile.findFirst.mockResolvedValue(null); // assignee not in org-a
    await expect(
      assignLead(ORG_A, "lead-1", "user-from-org-b")
    ).rejects.toThrow("User not found in this organization");
    expect(db.lead.update).not.toHaveBeenCalled();
  });

  it("assignLead scopes the user check to orgId", async () => {
    db.lead.findFirst.mockResolvedValue({ id: "lead-1" });
    db.userProfile.findFirst.mockResolvedValue(null);
    try {
      await assignLead(ORG_A, "lead-1", "u-x");
    } catch {
      // expected
    }
    expect(db.userProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ orgId: ORG_A }),
      })
    );
  });
});

// ─── Estimate tenant-safety tests ─────────────────────────────────────────────

describe("estimates — tenant isolation", () => {
  it("getEstimate always includes orgId in the WHERE clause", async () => {
    db.estimate.findFirst.mockResolvedValue(null);
    await getEstimate(ORG_A, "est-1");
    expect(db.estimate.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ orgId: ORG_A }),
      })
    );
  });

  it("getEstimate returns null for an estimate in a different org", async () => {
    db.estimate.findFirst.mockResolvedValue(null);
    const result = await getEstimate(ORG_A, "est-from-org-b");
    expect(result).toBeNull();
  });

  it("createEstimate rejects a customerId that belongs to a different org", async () => {
    db.customer.findFirst.mockResolvedValue(null); // customer not in org-a
    await expect(
      createEstimate(ORG_A, {
        title: "Spring plan",
        customerId: "cust-from-org-b",
        subtotalCents: 10_000,
        taxCents: 700,
      })
    ).rejects.toThrow("Customer not found in this organization");
    expect(db.estimate.create).not.toHaveBeenCalled();
  });

  it("createEstimate verifies customer org membership before generating a number", async () => {
    db.customer.findFirst.mockResolvedValue(null);
    await expect(
      createEstimate(ORG_A, {
        title: "Plan",
        customerId: "cust-from-org-b",
        subtotalCents: 0,
        taxCents: 0,
      })
    ).rejects.toThrow();
    // estimate.findFirst (number generation) must not have been called
    // because the customer check happens first
    expect(db.estimate.findFirst).not.toHaveBeenCalled();
  });

  it("createEstimate rejects a leadId that belongs to a different org", async () => {
    db.customer.findFirst.mockResolvedValue({ id: "cust-a" }); // customer ok
    db.lead.findFirst.mockResolvedValue(null); // lead not in org-a
    await expect(
      createEstimate(ORG_A, {
        title: "Spring plan",
        customerId: "cust-a",
        leadId: "lead-from-org-b",
        subtotalCents: 0,
        taxCents: 0,
      })
    ).rejects.toThrow("Lead not found in this organization");
    expect(db.estimate.create).not.toHaveBeenCalled();
  });

  it("createEstimate computes totalCents server-side", async () => {
    db.customer.findFirst.mockResolvedValue({ id: "cust-a" });
    db.estimate.findFirst.mockResolvedValue(null); // number generation: no prior estimates
    db.estimate.create.mockResolvedValue({
      id: "est-1",
      number: "EST-2026-0001",
      subtotalCents: 10_000,
      taxCents: 700,
      totalCents: 10_700,
    });
    await createEstimate(ORG_A, {
      title: "Plan",
      customerId: "cust-a",
      subtotalCents: 10_000,
      taxCents: 700,
    });
    expect(db.estimate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalCents: 10_700,
          orgId: ORG_A,
        }),
      })
    );
  });

  it("updateEstimate returns null when estimate belongs to a different org", async () => {
    db.estimate.findFirst.mockResolvedValue(null);
    const result = await updateEstimate(ORG_A, "est-from-org-b", {
      title: "Injected",
    });
    expect(result).toBeNull();
    expect(db.estimate.update).not.toHaveBeenCalled();
  });

  it("updateEstimate rejects edits to estimates in SENT status", async () => {
    db.estimate.findFirst.mockResolvedValue({
      id: "est-1",
      status: "SENT",
      subtotalCents: 0,
      taxCents: 0,
    });
    await expect(
      updateEstimate(ORG_A, "est-1", { title: "New title" })
    ).rejects.toThrow("SENT status cannot be edited");
    expect(db.estimate.update).not.toHaveBeenCalled();
  });

  it("transitionEstimateStatus returns null for estimate in a different org", async () => {
    db.estimate.findFirst.mockResolvedValue(null);
    const result = await transitionEstimateStatus(
      ORG_A,
      "est-from-org-b",
      "SENT"
    );
    expect(result).toBeNull();
    expect(db.estimate.update).not.toHaveBeenCalled();
  });

  it("transitionEstimateStatus rejects an invalid transition", async () => {
    db.estimate.findFirst.mockResolvedValue({ id: "est-1", status: "APPROVED" });
    await expect(
      transitionEstimateStatus(ORG_A, "est-1", "DRAFT")
    ).rejects.toThrow("Cannot transition estimate from APPROVED to DRAFT");
    expect(db.estimate.update).not.toHaveBeenCalled();
  });

  it("transitionEstimateStatus sets sentAt when transitioning to SENT", async () => {
    db.estimate.findFirst.mockResolvedValue({ id: "est-1", status: "DRAFT" });
    db.estimate.update.mockResolvedValue({ id: "est-1", status: "SENT" });
    await transitionEstimateStatus(ORG_A, "est-1", "SENT");
    expect(db.estimate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SENT",
          sentAt: expect.any(Date),
        }),
      })
    );
  });

  it("transitionEstimateStatus sets approvedAt when transitioning to APPROVED", async () => {
    db.estimate.findFirst.mockResolvedValue({ id: "est-1", status: "SENT" });
    db.estimate.update.mockResolvedValue({ id: "est-1", status: "APPROVED" });
    await transitionEstimateStatus(ORG_A, "est-1", "APPROVED");
    expect(db.estimate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "APPROVED",
          approvedAt: expect.any(Date),
        }),
      })
    );
  });
});
