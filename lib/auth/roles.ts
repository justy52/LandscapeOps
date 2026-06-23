import type { UserRole } from "@prisma/client";
import { requireUserProfile } from "./require-user-profile";

/**
 * Numeric rank for each role. Higher = more authority.
 * Used to compare roles without a switch chain.
 *
 * Source of truth: docs/02-architecture/permission-matrix.md
 */
export const ROLE_RANK: Record<UserRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  FIELD: 2,
  MEMBER: 1,
};

/**
 * Pure predicate — testable without Prisma or Clerk.
 * Returns true if userRole meets or exceeds the minimum required role.
 */
export function hasMinimumRole(userRole: UserRole, minimum: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimum];
}

/**
 * Maps a Clerk organization role string to the app UserRole enum.
 * Clerk roles are configurable; only org:admin and org:member are standard.
 *
 * OWNER and elevated roles (MANAGER, FIELD) are not sourced from Clerk —
 * they are assigned within the app after org sync.
 */
export function mapClerkRole(clerkRole: string): UserRole {
  switch (clerkRole) {
    case "org:admin":
      return "ADMIN";
    case "org:member":
      return "MEMBER";
    default:
      console.warn(`[roles] Unknown Clerk role "${clerkRole}", defaulting to MEMBER`);
      return "MEMBER";
  }
}

/**
 * Server-side role guard. Call from server actions before sensitive mutations.
 *
 * Throws if the authenticated user's role is below `minimum`.
 * Returns the resolved profile, orgId, and clerkUserId on success.
 *
 * Usage:
 *   const { orgId } = await requireRole("MANAGER");
 */
export async function requireRole(minimum: UserRole) {
  const { profile, orgId, clerkOrgId, clerkUserId } = await requireUserProfile();

  if (!hasMinimumRole(profile.role, minimum)) {
    throw new Error(
      `Insufficient permissions. Required: ${minimum} (rank ${ROLE_RANK[minimum]}), ` +
        `user has: ${profile.role} (rank ${ROLE_RANK[profile.role]})`
    );
  }

  return { profile, orgId, clerkOrgId, clerkUserId };
}
