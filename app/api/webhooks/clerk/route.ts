import { type NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type {
  OrganizationJSON,
  OrganizationMembershipJSON,
  DeletedObjectJSON,
  WebhookEvent,
} from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { mapClerkRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let evt: WebhookEvent;

  try {
    // verifyWebhook reads CLERK_WEBHOOK_SIGNING_SECRET by default.
    // We pass our env var name explicitly to stay compatible with .env.example.
    evt = await verifyWebhook(req, {
      signingSecret: process.env.CLERK_WEBHOOK_SECRET,
    });
  } catch (err) {
    // Invalid signature, missing headers, or stale timestamp
    console.warn("[clerk-webhook] Rejected: signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleEvent(evt);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    // Return 500 so Clerk retries (at-least-once delivery)
    console.error("[clerk-webhook] Handler error for event", evt.type, err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Event dispatch
// ─────────────────────────────────────────────────────────────────────────────

async function handleEvent(evt: WebhookEvent): Promise<void> {
  const { type } = evt;

  if (type === "organization.created" || type === "organization.updated") {
    await handleOrgUpsert(evt.data as OrganizationJSON, type);
  } else if (type === "organization.deleted") {
    await handleOrgDeleted(evt.data as DeletedObjectJSON);
  } else if (
    type === "organizationMembership.created" ||
    type === "organizationMembership.updated" ||
    type === "organizationMembership.deleted"
  ) {
    await handleMembershipEvent(evt.data as OrganizationMembershipJSON, type);
  } else {
    console.log("[clerk-webhook] Unhandled event type:", type);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// organization.created / organization.updated
// Upsert is idempotent — safe on Clerk's at-least-once re-delivery.
// ─────────────────────────────────────────────────────────────────────────────

async function handleOrgUpsert(
  data: OrganizationJSON,
  eventType: "organization.created" | "organization.updated"
) {
  const org = await prisma.organization.upsert({
    where: { clerkOrgId: data.id },
    create: {
      clerkOrgId: data.id,
      name: data.name,
      slug: data.slug ?? data.id,
    },
    update: {
      name: data.name,
      slug: data.slug ?? data.id,
    },
  });

  const action = eventType === "organization.created" ? "org.created" : "org.updated";

  await prisma.auditLog.create({
    data: {
      orgId: org.id,
      actorId: null,
      action,
      entityType: "Organization",
      entityId: org.id,
      metadata: { clerkOrgId: data.id, name: data.name },
    },
  });

  console.log(`[clerk-webhook] ${action} → Prisma org ${org.id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// organization.deleted
//
// IMPORTANT: Do NOT hard-delete. Hard-delete cascades through all tenant data
// (customers, jobs, invoices, payments) — irreversible.
//
// Instead: set suspendedAt. Requires a deliberate admin action to hard-delete
// after the grace period (30 days or per legal requirements).
// ─────────────────────────────────────────────────────────────────────────────

async function handleOrgDeleted(data: DeletedObjectJSON) {
  const clerkOrgId = data.id;

  if (!clerkOrgId) {
    console.warn("[clerk-webhook] org.deleted event missing id — skipping");
    return;
  }

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true },
  });

  if (!org) {
    console.warn("[clerk-webhook] org.deleted: org not in Prisma, clerkOrgId:", clerkOrgId);
    return;
  }

  await prisma.organization.update({
    where: { id: org.id },
    data: { suspendedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      orgId: org.id,
      actorId: null,
      action: "org.deletion_requested",
      entityType: "Organization",
      entityId: org.id,
      metadata: { clerkOrgId, suspendedAt: new Date().toISOString() },
    },
  });

  console.log("[clerk-webhook] org.deletion_requested →", org.id, "(suspendedAt set, not hard-deleted)");
}

// ─────────────────────────────────────────────────────────────────────────────
// organizationMembership.created / updated / deleted
// ─────────────────────────────────────────────────────────────────────────────

async function handleMembershipEvent(
  data: OrganizationMembershipJSON,
  eventType: "organizationMembership.created" | "organizationMembership.updated" | "organizationMembership.deleted"
) {
  const clerkOrgId = data.organization.id;
  const clerkUserId = data.public_user_data.user_id;

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true },
  });

  if (!org) {
    // Race condition: organization.created webhook not yet processed.
    // Throw so Clerk retries (500 → retry, at-least-once delivery).
    throw new Error(`[clerk-webhook] org not found for clerkOrgId: ${clerkOrgId} — will retry`);
  }

  if (eventType === "organizationMembership.created") {
    await handleMembershipCreated(data, org.id, clerkUserId);
  } else if (eventType === "organizationMembership.updated") {
    await handleMembershipUpdated(data, org.id, clerkUserId);
  } else {
    await handleMembershipDeleted(data, org.id, clerkUserId);
  }
}

async function handleMembershipCreated(
  data: OrganizationMembershipJSON,
  orgId: string,
  clerkUserId: string
) {
  // First member in the org is automatically promoted to OWNER
  const existingCount = await prisma.userProfile.count({ where: { orgId } });
  const role = existingCount === 0 ? "OWNER" : mapClerkRole(data.role);

  const fullName =
    [data.public_user_data.first_name, data.public_user_data.last_name]
      .filter(Boolean)
      .join(" ") || null;

  const profile = await prisma.userProfile.upsert({
    where: { orgId_clerkUserId: { orgId, clerkUserId } },
    create: {
      orgId,
      clerkUserId,
      email: data.public_user_data.identifier,
      name: fullName,
      role,
    },
    update: {
      email: data.public_user_data.identifier,
      name: fullName,
      role,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      actorId: null,
      action: "user.profile.created",
      entityType: "UserProfile",
      entityId: profile.id,
      metadata: { clerkUserId, role },
    },
  });

  console.log("[clerk-webhook] membership.created → profile", profile.id, "role:", role);
}

async function handleMembershipUpdated(
  data: OrganizationMembershipJSON,
  orgId: string,
  clerkUserId: string
) {
  const profile = await prisma.userProfile.findUnique({
    where: { orgId_clerkUserId: { orgId, clerkUserId } },
    select: { id: true, role: true },
  });

  if (!profile) {
    console.warn("[clerk-webhook] membership.updated: UserProfile not found, skipping");
    return;
  }

  const previousRole = profile.role;

  // OWNER is an app-layer role, not sourced from Clerk — do not overwrite it
  if (previousRole === "OWNER") {
    console.log("[clerk-webhook] membership.updated: OWNER role preserved, not overwritten by Clerk");
    return;
  }

  const newRole = mapClerkRole(data.role);

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { role: newRole },
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      actorId: null,
      action: "user.profile.role_updated",
      entityType: "UserProfile",
      entityId: profile.id,
      metadata: { clerkUserId, previousRole, newRole },
    },
  });

  console.log("[clerk-webhook] membership.updated → profile", profile.id, previousRole, "→", newRole);
}

async function handleMembershipDeleted(
  data: OrganizationMembershipJSON,
  orgId: string,
  clerkUserId: string
) {
  const profile = await prisma.userProfile.findUnique({
    where: { orgId_clerkUserId: { orgId, clerkUserId } },
    select: { id: true, role: true },
  });

  if (!profile) {
    // Already deleted or never synced — idempotent
    return;
  }

  await prisma.userProfile.delete({ where: { id: profile.id } });

  await prisma.auditLog.create({
    data: {
      orgId,
      actorId: null,
      action: "user.profile.removed",
      entityType: "UserProfile",
      entityId: profile.id,
      metadata: { clerkUserId, role: profile.role },
    },
  });

  console.log("[clerk-webhook] membership.deleted → profile", profile.id, "removed");
}
