# Phase 1: Auth and Tenant Core — Implementation Plan

**Status:** Ready for implementation  
**Date drafted:** 2026-06-23  
**Owner:** Claude (architecture/backend lead)  
**Scope:** Clerk auth, organization switching, Prisma sync, protected routes, tenant-safe data access, roles, audit logging, seed data

---

## Overview

Phase 1 establishes the security and data-access foundation that every later phase depends on. Nothing in Phase 2 or beyond should be built until the tenant isolation layer is in place and passing all acceptance criteria listed at the end of this document.

The core deliverables are:

1. Clerk auth wired into the Next.js app (sign-in, sign-up, sign-out, org switching)
2. A webhook handler that syncs Clerk orgs and memberships into Prisma
3. Route middleware protecting all authenticated pages
4. A server-side org resolution helper that maps Clerk session → Prisma `orgId`
5. A tenant-safe Prisma helper that enforces `orgId` on every query
6. Role checks at the server action level
7. Audit log writes for auth and profile events
8. Seed and demo data for local development

---

## Prerequisites

Before implementation starts:

- Clerk account created, application configured for organizations
- Clerk organization feature enabled (required for multi-tenancy)
- Neon database provisioned, `DATABASE_URL` and `DIRECT_URL` ready in `.env.local`
- `CLERK_WEBHOOK_SECRET` obtained from Clerk dashboard (for signature verification)
- `.env.example` updated with all new required keys (never commit actual values)

Required environment variables for Phase 1:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
DATABASE_URL=
DIRECT_URL=
```

---

## 1. Clerk Setup

### Package

`@clerk/nextjs` version 6 is already declared in `package.json`. Confirm it installs cleanly with `npm install`.

### ClerkProvider

Wrap the root layout in `<ClerkProvider>`. Place it in `app/layout.tsx` as the outermost provider.

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Sign-in and Sign-up pages

Create App Router route pages:

- `app/(auth)/sign-in/[[...sign-in]]/page.tsx` — render `<SignIn />`
- `app/(auth)/sign-up/[[...sign-up]]/page.tsx` — render `<SignUp />`

These pages must be excluded from middleware auth requirements. The `(auth)` route group should not inherit the protected layout.

---

## 2. Route Middleware

Create `middleware.ts` at the project root. Use `clerkMiddleware` and `createRouteMatcher` from `@clerk/nextjs/server`.

Public routes (no auth required):

```
/
/sign-in(.*)
/sign-up(.*)
/api/webhooks/clerk(.*)
/api/webhooks/stripe(.*)
/api/webhooks/dropbox-sign(.*)
```

All other routes — especially anything under `/dashboard`, `/customers`, `/leads`, `/estimates`, `/jobs`, `/schedule`, `/invoices`, `/reports`, `/settings` — must require auth. If the user has no active organization, redirect to an `/onboarding` route that prompts them to create or join one.

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();
  const { userId, orgId } = await auth();
  if (!userId) return auth().redirectToSignIn({ returnBackUrl: req.url });
  if (!orgId && !req.nextUrl.pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

---

## 3. Organization Switching

### Nav component

Add `<OrganizationSwitcher>` from `@clerk/nextjs` to the app shell navigation. It handles org selection and switching without custom code.

Important: When a user switches orgs, Clerk updates the session cookie and re-issues the JWT with the new `orgId`. The server automatically picks up the new org on the next request. No client-side state management is needed for the active org.

### Onboarding route

If a user is authenticated but has no active org, redirect to `/onboarding`. This route should:

- Show `<CreateOrganization>` from Clerk for org creation
- Or `<OrganizationList>` to join an existing org
- Not require an active org to load

---

## 4. User and Org Sync into Prisma

### Webhook handler

Create `app/api/webhooks/clerk/route.ts`.

This handler must:

1. Verify the Svix signature using `CLERK_WEBHOOK_SECRET` — reject any request that does not pass verification
2. Parse the event type and payload
3. Write or update Prisma records synchronously before returning 200

Install Svix: `npm install svix`

**Events to handle:**

| Clerk event | Action |
|---|---|
| `organization.created` | `upsert` `Organization` with `clerkOrgId`, `name`, `slug` |
| `organization.updated` | Update `Organization.name` and `Organization.slug` |
| `organization.deleted` | Soft-delete or hard-delete `Organization` (see note below) |
| `organizationMembership.created` | `upsert` `UserProfile` with `clerkUserId`, `orgId`, `email`, `name`, role mapped from Clerk role |
| `organizationMembership.updated` | Update `UserProfile.role` |
| `organizationMembership.deleted` | Delete or deactivate `UserProfile` for that org |

**Organization deletion note:** Do not hard-delete organizations automatically. Hard-delete wipes all tenant data (customers, jobs, invoices) via cascade. Phase 1 should soft-delete by adding a `deletedAt DateTime?` field to `Organization`, or simply log the event and require a manual admin action. Document this decision clearly in the webhook handler.

**Role mapping:**

Clerk organization roles are free-form strings configurable per Clerk app. Map them explicitly:

```typescript
function mapClerkRole(clerkRole: string): UserRole {
  switch (clerkRole) {
    case 'org:admin': return 'ADMIN';
    case 'org:member': return 'MEMBER';
    default: return 'MEMBER';
  }
}
```

`OWNER` should be assigned manually via the app settings in a later phase, or reserved for the first member who creates the org. Do not map it from Clerk directly — it carries billing and destructive-action permissions.

### User lookup pattern

When resolving a `UserProfile` from Clerk session data, always use the composite unique key:

```typescript
const profile = await prisma.userProfile.findUnique({
  where: { orgId_clerkUserId: { orgId, clerkUserId } },
});
```

Never look up by `clerkUserId` alone — a user can belong to multiple orgs.

---

## 5. Server-Side Active Org Resolution

Every server component, server action, and API route handler that touches tenant data must resolve the active org server-side. Never accept `orgId` from client-submitted form data or query parameters.

### The `requireActiveOrg` helper

Create `lib/auth/require-active-org.ts`:

```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function requireActiveOrg() {
  const { userId, orgId: clerkOrgId } = auth();

  if (!userId || !clerkOrgId) {
    redirect('/sign-in');
  }

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true },
  });

  if (!org) {
    // Org exists in Clerk but webhook hasn't synced yet, or sync failed
    redirect('/onboarding');
  }

  return { orgId: org.id, clerkOrgId, userId };
}
```

**Critical distinction:** `clerkOrgId` is the Clerk organization ID (e.g. `org_abc123`). `orgId` is the Prisma `Organization.id` (a cuid). All Prisma queries use `orgId`. Always map through `requireActiveOrg` to get the correct Prisma `orgId`.

### The `requireUserProfile` helper

For routes that need role checking:

```typescript
import { requireActiveOrg } from './require-active-org';
import { prisma } from '@/lib/prisma';

export async function requireUserProfile() {
  const { orgId, clerkOrgId, userId } = await requireActiveOrg();

  const profile = await prisma.userProfile.findUnique({
    where: { orgId_clerkUserId: { orgId, clerkUserId: userId } },
  });

  if (!profile) {
    // User is in Clerk org but UserProfile not yet created
    redirect('/onboarding');
  }

  return { orgId, clerkOrgId, userId, profile };
}
```

---

## 6. Tenant-Safe Prisma Helper Pattern

Every query against a tenant-owned model must include `orgId`. The `orgId` must always come from `requireActiveOrg()`, never from untrusted input.

### Pattern for server actions

```typescript
// app/actions/customers.ts
'use server';
import { requireActiveOrg } from '@/lib/auth/require-active-org';
import { prisma } from '@/lib/prisma';

export async function listCustomers() {
  const { orgId } = await requireActiveOrg();
  return prisma.customer.findMany({
    where: { orgId },
    orderBy: { name: 'asc' },
  });
}

export async function getCustomer(id: string) {
  const { orgId } = await requireActiveOrg();
  // ALWAYS include orgId — id alone is not enough
  const customer = await prisma.customer.findFirst({
    where: { id, orgId },
  });
  if (!customer) throw new Error('Not found');
  return customer;
}

export async function createCustomer(data: CreateCustomerInput) {
  const { orgId } = await requireActiveOrg();
  // orgId is injected from the server-side resolved value
  return prisma.customer.create({
    data: { ...data, orgId },
  });
}
```

### Cross-model relation safety

When creating a record that references another tenant-owned record (e.g., an `Estimate` referencing a `Customer`), the service layer must verify the referenced record belongs to the same org before creating the relation:

```typescript
export async function createEstimate(data: CreateEstimateInput) {
  const { orgId } = await requireActiveOrg();

  // Verify customer belongs to this org before linking
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, orgId },
    select: { id: true },
  });
  if (!customer) throw new Error('Customer not found in this organization');

  return prisma.estimate.create({
    data: { ...data, orgId, customerId: customer.id },
  });
}
```

This pattern applies to all cross-model relations. See `tenant-isolation-rules.md` for the complete list.

---

## 7. Role and Permission Checks

Use `requireUserProfile()` to get the authenticated user's role, then check it before sensitive operations.

### Role guard helper

```typescript
// lib/auth/require-role.ts
import { UserRole } from '@prisma/client';
import { requireUserProfile } from './require-user-profile';

const roleRank: Record<UserRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  FIELD: 2,
  MEMBER: 1,
};

export async function requireRole(minimum: UserRole) {
  const { profile, orgId, userId } = await requireUserProfile();
  if (roleRank[profile.role] < roleRank[minimum]) {
    throw new Error('Insufficient permissions');
  }
  return { profile, orgId, userId };
}
```

Usage in server actions:

```typescript
export async function deleteCustomer(id: string) {
  const { orgId } = await requireRole('MANAGER');
  await prisma.customer.delete({ where: { id, orgId } });
}
```

See `permission-matrix.md` for the full permission table by role.

---

## 8. Audit Logging Expectations

Phase 1 must write audit log entries for the following events:

| Event | Actor | Entity | Action |
|---|---|---|---|
| Org synced from Clerk | system | Organization | `org.synced` |
| User profile created | system | UserProfile | `user.profile.created` |
| User profile role updated | system | UserProfile | `user.profile.role_updated` |
| User signs in (optional, high-volume) | user | UserProfile | `user.signed_in` |
| User profile deleted from org | system | UserProfile | `user.profile.removed` |

Write audit logs inside the webhook handler immediately after each Prisma write, not as a separate job.

```typescript
await prisma.auditLog.create({
  data: {
    orgId,
    actorId: null, // system action during sync
    action: 'org.synced',
    entityType: 'Organization',
    entityId: org.id,
    metadata: { clerkOrgId },
  },
});
```

Never log `CLERK_SECRET_KEY`, user passwords, tokens, or PII beyond what is needed for audit traceability.

---

## 9. Seed and Demo Data Plan

Provide a local seed script at `prisma/seed.ts` that creates:

- One demo `Organization` (e.g. "Acme Landscaping") with a placeholder `clerkOrgId`
- Two `UserProfile` records: one `OWNER`, one `MANAGER`
- Three `Customer` records (residential, commercial, property management)
- Two `Lead` records with different statuses
- Zero financial records — seed data should not include estimates, invoices, or payments

The seed data is for local development and testing only. It must not be run against production.

Configure in `package.json`:

```json
"prisma": {
  "seed": "ts-node --project tsconfig.json prisma/seed.ts"
}
```

Run with: `npx prisma db seed`

The seed script must use real Prisma client calls with valid `orgId` values — never raw SQL.

---

## 10. Local Dev Setup Steps

After Phase 1 is implemented, a developer should be able to follow these steps to run the app locally:

```bash
# 1. Clone and install
git clone https://github.com/justy52/LandscapeOps.git
cd LandscapeOps
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
# CLERK_WEBHOOK_SECRET, DATABASE_URL, DIRECT_URL

# 3. Run migrations and generate client
npx prisma migrate dev
npm run prisma:generate

# 4. Seed demo data
npx prisma db seed

# 5. (Optional) Forward Clerk webhooks to localhost for sync testing
# Install: npm install -g ngrok
# Run: ngrok http 3000
# Set Clerk webhook endpoint to: https://<your-ngrok-url>/api/webhooks/clerk

# 6. Start the dev server
npm run dev
```

Document these steps in the repo README and update `docs/06-build/dev-handoff-playbook.md` when Phase 1 is complete.

---

## 11. Migration Plan

Phase 1 requires the first real database migration against the Neon database.

Steps:

1. Review `prisma/schema.prisma` — no schema changes are planned for Phase 1 unless tenant-safety composite constraints are accelerated (see `architecture-checkpoint-2026-06-23.md`).
2. Run `npx prisma migrate dev --name init` to generate and apply the initial migration.
3. Review the generated SQL in `prisma/migrations/` before applying to production.
4. Apply to production via `npx prisma migrate deploy` (not `migrate dev`).
5. Run the seed script on local/staging only.

Do not run `prisma migrate dev` against the production database. Use `prisma migrate deploy` in CI/CD.

Add a migration step to the CI workflow for staging environments. The current CI only runs `prisma generate`.

---

## 12. Acceptance Criteria

Phase 1 is complete when all of the following are true:

### Auth
- [ ] A user can sign up, sign in, and sign out via Clerk
- [ ] A user can create an organization via the Clerk `<CreateOrganization>` component
- [ ] A user can switch between organizations if they belong to more than one
- [ ] Unauthenticated requests to protected routes are redirected to sign-in
- [ ] Authenticated users with no active org are redirected to onboarding

### Sync
- [ ] `Organization` is created in Prisma when a Clerk `organization.created` webhook fires
- [ ] `UserProfile` is upserted in Prisma when a Clerk `organizationMembership.created` webhook fires
- [ ] Webhook signature verification rejects requests with invalid or missing Svix signatures
- [ ] Audit log entries are written for org and user sync events

### Tenant safety
- [ ] `requireActiveOrg()` returns a Prisma `orgId` derived from the active Clerk session
- [ ] All server actions that read or write tenant data call `requireActiveOrg()` before touching Prisma
- [ ] No server action accepts `orgId` from a client-submitted parameter
- [ ] A request that substitutes a different org's record ID in a mutation is rejected (manual test)

### Roles
- [ ] `requireRole('MANAGER')` throws if the active user's role is FIELD or MEMBER
- [ ] `requireRole('OWNER')` throws for all non-OWNER roles

### Seed data
- [ ] `npx prisma db seed` runs without error on a fresh local database
- [ ] Seed data is visible via `npx prisma studio`

### Checks
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `npm run prisma:generate` passes

---

## 13. Out-of-Scope Items for Phase 1

The following must NOT be built during Phase 1:

- CRM screens, customer lists, lead boards (Phase 2)
- Estimate creation, proposal workflow (Phase 2)
- Job scheduling, crew assignment (Phase 3)
- Invoices, Stripe integration, Dropbox Sign (Phase 4)
- Client portal, Inngest automations (Phase 5)
- R2 file upload and signed URL generation
- Email or SMS notifications
- Advanced reporting or job costing views
- Multi-factor auth enforcement (Clerk handles this; configure in Clerk dashboard)
- Composite FK constraints on cross-model relations (documented risk, deferred to Phase 2)
- Production deploy configuration (Vercel, Sentry, PostHog wiring)

---

## References

- `docs/02-architecture/tenant-isolation-rules.md` — the non-negotiable query rules
- `docs/02-architecture/clerk-org-sync-plan.md` — full webhook sync specification
- `docs/02-architecture/permission-matrix.md` — role permission table
- `docs/06-build/architecture-checkpoint-2026-06-23.md` — schema risks and decisions
- `docs/07-security/security-deploy-legal.md` — security guardrails
