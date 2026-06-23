import { type WebhookEvent } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

let webhookEvent: WebhookEvent;

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: vi.fn(async () => webhookEvent),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    userProfile: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

function makeRequest() {
  return new NextRequest("http://localhost/api/webhooks/clerk", {
    method: "POST",
    body: JSON.stringify(webhookEvent),
    headers: { "content-type": "application/json" },
  });
}

describe("Clerk webhook OWNER preservation", () => {
  const now = new Date("2026-06-23T00:00:00.000Z");
  const ownerProfile = {
    id: "profile_owner",
    orgId: "org_internal",
    clerkUserId: "user_owner",
    email: "owner@example.test",
    name: "Owner User",
    role: "OWNER" as const,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    webhookEvent = {
      type: "organizationMembership.created",
      data: {
        id: "mem_owner",
        role: "org:member",
        organization: { id: "org_test" },
        public_user_data: {
          user_id: "user_owner",
          identifier: "owner@example.test",
          first_name: "Owner",
          last_name: "User",
        },
      },
    } as WebhookEvent;
  });

  it("does not demote an existing OWNER on duplicate membership.created delivery", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { POST } = await import("../route");

    vi.mocked(prisma.organization.findUnique).mockResolvedValue({
      id: "org_internal",
      clerkOrgId: "org_test",
      name: "Test Org",
      slug: "test-org",
      suspendedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    vi.mocked(prisma.userProfile.findUnique).mockResolvedValue(ownerProfile);
    vi.mocked(prisma.userProfile.upsert).mockResolvedValue(ownerProfile);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(prisma.userProfile.count).not.toHaveBeenCalled();
    expect(prisma.userProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ role: "OWNER" }),
      })
    );
  });
});
