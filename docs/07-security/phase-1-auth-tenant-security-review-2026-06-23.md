# Phase 1 Auth and Tenant Security Review - 2026-06-23

## Overall Status

**PASS after fixes.**

Phase 1 is safe to use as the foundation for Phase 2 planning and implementation. No blocker or open high-severity security issues remain after this review. Phase 2 should still begin with tenant-scoped service helpers and tests before adding CRM, estimating, jobs, invoicing, files, or reporting workflows.

Reviewed base commit: `f1094b974eae0020c150038ecb3a1c04e2358ac9`

## Files Reviewed

- `middleware.ts`
- `app/layout.tsx`
- `app/(auth)/layout.tsx`
- `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- `app/onboarding/page.tsx`
- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`
- `app/api/webhooks/clerk/route.ts`
- `app/api/webhooks/clerk/__tests__/webhook.test.ts`
- `app/api/webhooks/clerk/__tests__/owner-preservation.test.ts`
- `components/app-shell.tsx`
- `components/org-switcher.tsx`
- `components/user-button.tsx`
- `lib/auth/require-active-org.ts`
- `lib/auth/require-user-profile.ts`
- `lib/auth/roles.ts`
- `lib/auth/__tests__/roles.test.ts`
- `lib/db/tenant-context.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `.env.example`
- `.github/workflows/ci.yml`
- `package.json`
- `vitest.config.ts`

## Review Coverage

Reviewed:

- Clerk middleware route protection
- Public route matcher safety
- ClerkProvider usage
- Sign-in and sign-up routes
- Onboarding flow
- `requireActiveOrg` behavior
- `requireUserProfile` behavior
- Role guard utilities
- Tenant-context helper pattern
- Clerk webhook handler
- Webhook signature verification
- `organization.created`, `organization.updated`, `organization.deleted` handling
- `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted` handling
- First-member OWNER auto-promotion
- Suspended org behavior
- Seed data safety
- CI and test coverage
- Environment variable expectations
- Potential places where `orgId` could be trusted from the client
- Whether Phase 2 can safely build on this foundation

## Findings by Severity

### Blocker

None open.

### High

**H-1 - Fixed: duplicate `organizationMembership.created` delivery could demote an existing OWNER.**

Clerk webhooks are delivered at least once. Before this review, the membership-created handler always wrote the freshly mapped Clerk role through the `upsert` update path. A duplicate delivery for the first member could see an existing member count greater than zero, map the Clerk role to `ADMIN` or `MEMBER`, and overwrite the app-layer `OWNER` role.

Fix made:

- `app/api/webhooks/clerk/route.ts` now loads the existing `UserProfile` before handling membership creation and preserves `OWNER` on duplicate delivery.
- `app/api/webhooks/clerk/__tests__/owner-preservation.test.ts` verifies duplicate membership-created delivery does not demote an existing OWNER.

### Medium

**M-1 - Fixed: middleware public webhook matcher was broader than Phase 1 needs.**

The public route matcher allowed all `/api/webhooks/(.*)` routes through Clerk middleware. That is defensible only when every webhook route performs strong provider signature verification. Phase 1 only implements Clerk webhooks, so the public matcher should expose only that endpoint for now.

Fix made:

- `middleware.ts` now exposes `/api/webhooks/clerk(.*)` publicly. Future Stripe or Dropbox Sign webhook routes must be added explicitly after their signature verification exists.

**M-2 - Open: Phase 2 service-layer tenant tests must be added before tenant-owned workflows ship.**

The Phase 1 foundation correctly documents that record IDs alone are never sufficient and provides `requireActiveOrg`, `requireUserProfile`, role guards, and tenant-context patterns. However, there are not yet runtime service helpers or integration tests for CRM, estimating, jobs, invoices, files, or reports because those workflows are out of scope for Phase 1.

Required before Phase 2 workflows merge:

- Add tenant-scoped service helpers for each workflow.
- Add tests proving mismatched `orgId` cannot read, update, delete, link, export, or report on another org's records.
- Verify cross-model references before connecting tenant-owned relations.

**M-3 - Open: membership deletion can leave an organization with no OWNER.**

`organizationMembership.deleted` deletes the synced `UserProfile`. This is safe from an access-control perspective because Clerk membership removal prevents the user from resolving that org through the active Clerk session. It can still leave an org with no app-layer OWNER, which is an operational risk for later settings, billing, and recovery flows.

Required before owner-management UI or billing controls ship:

- Detect removal of the sole OWNER.
- Write a distinct audit event or configuration warning.
- Define an admin recovery path.

### Low

**L-1 - Fixed: seed script relied on documentation only for production safety.**

The seed file warned not to run against production but had no runtime guard. The seed uses placeholder Clerk IDs and demo records, so accidental production execution would be confusing even though it does not create financial records.

Fix made:

- `prisma/seed.ts` now refuses to run when `NODE_ENV=production` or `VERCEL_ENV=production`.

**L-2 - Open: webhook idempotency creates repeated audit entries.**

The Clerk webhook handlers use idempotent upsert/update patterns for core records, but repeated valid webhook delivery can still create repeated audit entries. This is acceptable for Phase 1, but Phase 2 should consider event-id de-duplication if audit noise becomes a problem.

**L-3 - Open: suspended-org redirect is secure but blunt.**

`requireActiveOrg` redirects suspended organizations to `/sign-in`. This blocks access, which is the important security behavior. A later support-oriented suspended workspace page may provide a better user experience without exposing tenant data.

## Risks Found

- The highest-risk issue was OWNER demotion on duplicate membership-created delivery. It has been fixed and covered by a test.
- Broad public webhook exposure was reduced to the single implemented Clerk endpoint.
- No reviewed route or helper accepts client-submitted `orgId` for tenant data access.
- No Phase 2 workflows exist yet, so cross-model tenant-guard enforcement is currently a documented pattern, not a proven runtime pattern.
- No secrets were found in committed files; `.env.example` contains placeholders only.

## Fixes Made

- Narrowed public middleware webhook matcher to `/api/webhooks/clerk(.*)`.
- Preserved existing `OWNER` role during duplicate `organizationMembership.created` processing.
- Added a test covering duplicate membership-created OWNER preservation.
- Added a production-environment guard to the Prisma seed script.

## Follow-Up Tasks Before Phase 2

1. Add a shared service/action pattern for tenant-owned reads, writes, updates, deletes, and relation connections.
2. Add cross-tenant negative tests for each Phase 2 workflow before merging that workflow.
3. Add happy-path Clerk webhook tests for org create/update/delete and membership create/update/delete.
4. Add tests for suspended organizations blocking `requireActiveOrg`.
5. Define sole-OWNER removal recovery behavior before user/role management UI ships.
6. Add explicit public matcher entries only when Stripe and Dropbox Sign webhook routes are implemented with signature verification.
7. Consider event-id de-duplication if audit log volume becomes noisy under webhook retries.

## Recommendation

**Safe to begin Phase 2 with guardrails.**

Phase 2 can start on top of this foundation after the fixes in this review. Do not merge Phase 2 tenant-owned workflows unless they resolve `orgId` server-side, reject client-submitted `orgId`, verify cross-model references belong to the active org before connecting them, and include cross-tenant negative tests.
