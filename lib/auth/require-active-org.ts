import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Resolves the active Prisma orgId from the authenticated Clerk session.
 *
 * TENANT SAFETY: This is the canonical entry point for orgId resolution.
 * All server actions, server components, and API routes that access
 * tenant-owned data must call this before touching Prisma.
 *
 * Never accept orgId from client-submitted params, form bodies, or query strings.
 *
 * Returns: { orgId, clerkOrgId, clerkUserId }
 *   - orgId        → Prisma Organization.id (use in all Prisma WHERE clauses)
 *   - clerkOrgId   → Clerk org ID (use for Clerk API calls only)
 *   - clerkUserId  → Clerk user ID (use for UserProfile lookups)
 *
 * Redirects to /sign-in if no authenticated session.
 * Redirects to /onboarding if no active org or org not yet synced.
 */
export async function requireActiveOrg() {
  const { userId: clerkUserId, orgId: clerkOrgId } = await auth();

  if (!clerkUserId || !clerkOrgId) {
    redirect("/sign-in");
  }

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true, suspendedAt: true },
  });

  if (!org) {
    // Org exists in Clerk but the webhook hasn't synced it yet, or sync failed.
    redirect("/onboarding");
  }

  if (org.suspendedAt) {
    // Org has been suspended (Clerk deletion received but not hard-deleted yet).
    redirect("/sign-in");
  }

  return { orgId: org.id, clerkOrgId, clerkUserId };
}
