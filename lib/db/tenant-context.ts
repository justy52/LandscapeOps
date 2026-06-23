/**
 * Tenant-Safe Data Access Patterns
 *
 * This module documents and enforces the patterns required for safe
 * multi-tenant data access. All server actions and API handlers that
 * read or write tenant data must follow these patterns.
 *
 * Full rules: docs/02-architecture/tenant-isolation-rules.md
 *
 * ─────────────────────────────────────────────────────────────────
 * RULE 1 — Always start with requireActiveOrg()
 * ─────────────────────────────────────────────────────────────────
 *
 *   import { requireActiveOrg } from "@/lib/auth/require-active-org";
 *
 *   const { orgId } = await requireActiveOrg();
 *   // orgId is the Prisma Organization.id, derived from the Clerk session.
 *   // Never use orgId from query params, form data, or client state.
 *
 * ─────────────────────────────────────────────────────────────────
 * RULE 2 — Always include orgId in WHERE clauses
 * ─────────────────────────────────────────────────────────────────
 *
 *   // CORRECT — record id is scoped to the active org
 *   const customer = await prisma.customer.findFirst({
 *     where: { id: customerId, orgId },
 *   });
 *
 *   // WRONG — id alone can match a record from any org
 *   const customer = await prisma.customer.findUnique({
 *     where: { id: customerId },
 *   });
 *
 * ─────────────────────────────────────────────────────────────────
 * RULE 3 — Inject orgId on writes, never trust client input
 * ─────────────────────────────────────────────────────────────────
 *
 *   const { orgId } = await requireActiveOrg();
 *
 *   await prisma.customer.create({
 *     data: { ...validatedInput, orgId },   // orgId from server session
 *   });
 *
 *   await prisma.customer.update({
 *     where: { id: customerId, orgId },     // orgId scopes the mutation
 *     data: { name: validatedInput.name },
 *   });
 *
 * ─────────────────────────────────────────────────────────────────
 * RULE 4 — Verify cross-model references belong to the active org
 * ─────────────────────────────────────────────────────────────────
 *
 * When creating a record that references another tenant-owned record
 * (e.g., an Estimate referencing a Customer), the DB cannot enforce
 * that both belong to the same org. The service layer must.
 *
 *   // Verify before linking
 *   const customer = await prisma.customer.findFirst({
 *     where: { id: input.customerId, orgId },
 *     select: { id: true },
 *   });
 *   if (!customer) throw new Error("Customer not found in this organization");
 *
 *   await prisma.estimate.create({
 *     data: { ...input, orgId, customerId: customer.id },
 *   });
 *
 * ─────────────────────────────────────────────────────────────────
 * RULE 5 — Role checks before sensitive mutations
 * ─────────────────────────────────────────────────────────────────
 *
 *   import { requireRole } from "@/lib/auth/roles";
 *
 *   const { orgId } = await requireRole("MANAGER");
 *   // Throws for FIELD and MEMBER roles.
 *
 * ─────────────────────────────────────────────────────────────────
 * No runtime export from this file — it is documentation only.
 * The enforcement helpers are in lib/auth/.
 * ─────────────────────────────────────────────────────────────────
 */

export {};
