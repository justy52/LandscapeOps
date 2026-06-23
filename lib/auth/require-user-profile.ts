import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveOrg } from "./require-active-org";

/**
 * Resolves the active Prisma UserProfile for the authenticated Clerk session.
 *
 * Extends requireActiveOrg() by also loading the UserProfile, which carries
 * the app role. Use this in server actions that need role-based permission checks.
 *
 * Redirects to /onboarding if the UserProfile has not yet been created
 * (webhook lag between Clerk membership creation and Prisma sync).
 */
export async function requireUserProfile() {
  const { orgId, clerkOrgId, clerkUserId } = await requireActiveOrg();

  // Always look up by composite key — a user can belong to multiple orgs
  const profile = await prisma.userProfile.findUnique({
    where: {
      orgId_clerkUserId: { orgId, clerkUserId },
    },
  });

  if (!profile) {
    // User is in Clerk org but UserProfile not yet synced from webhook
    redirect("/onboarding");
  }

  return { orgId, clerkOrgId, clerkUserId, profile };
}
