import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Webhook signature verification tests
//
// These tests verify the security boundary: the handler must reject any
// request that fails Svix signature verification before processing the payload.
//
// Full integration tests (org.created → Prisma write) require a live database
// and are deferred to the Phase 2 integration test suite.
// ─────────────────────────────────────────────────────────────────────────────

// Mock Prisma so the module can be imported without a real DB connection
vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    userProfile: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

function makeRequest(body: unknown, extraHeaders: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/webhooks/clerk", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      ...extraHeaders,
    },
  });
}

const badSvixHeaders = {
  "svix-id": "msg_test_001",
  "svix-timestamp": String(Math.floor(Date.now() / 1000)),
  "svix-signature": "v1,totally_invalid_base64_signature",
};

describe("Clerk webhook — signature verification", () => {
  beforeEach(() => {
    process.env.CLERK_WEBHOOK_SECRET = "whsec_test_placeholder_not_a_real_secret";
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("rejects a request with an invalid signature and returns 400", async () => {
    const { POST } = await import("../route");

    const req = makeRequest(
      { type: "organization.created", data: { id: "org_test" } },
      badSvixHeaders
    );

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/invalid signature/i);
  });

  it("returns 400 when Svix headers are absent", async () => {
    const { POST } = await import("../route");

    const req = makeRequest({ type: "organization.created", data: {} });
    // No svix-* headers set

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("does not call Prisma when signature verification fails", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { POST } = await import("../route");

    const req = makeRequest(
      { type: "organization.created", data: { id: "org_evil" } },
      badSvixHeaders
    );

    await POST(req);

    // No Prisma writes should occur on signature failure
    expect(prisma.organization.upsert).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});
