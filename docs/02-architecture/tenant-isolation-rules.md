# Tenant Isolation Rules

**Status:** Active — enforced from Phase 1 onward  
**Owner:** Claude (architecture/backend lead)

---

## The Non-Negotiable Rule

> A record ID alone is never sufficient authorization.  
> Every read, write, update, delete, export, report, file access, webhook write, and background job that touches tenant-owned data must resolve and validate `orgId` server-side from the active Clerk session before touching Prisma.

This rule has no exceptions. It applies to server components, server actions, API route handlers, webhook handlers, Inngest functions, cron jobs, and any background processing.

---

## orgId Resolution

The active `orgId` must always originate from the authenticated Clerk session, never from:

- Query parameters (`?orgId=...`)
- Form fields or request bodies
- Client state or localStorage
- URL path segments
- HTTP headers that are not cryptographically verified

The correct resolution path:

```
Clerk session (server-side) → clerkOrgId → prisma.organization.findUnique({ where: { clerkOrgId } }) → orgId
```

Use `requireActiveOrg()` from `lib/auth/require-active-org.ts` as the single entry point for this resolution. Do not inline this logic in individual routes.

If Clerk has no active org for the session, redirect to onboarding. If the Prisma `Organization` record does not exist yet (webhook lag), redirect to onboarding. Never fall through to data access without a confirmed `orgId`.

---

## Prisma Query Rules

### Reads

All `findMany`, `findFirst`, `findUnique`, `aggregate`, `count`, and `groupBy` calls on tenant-owned models must include `orgId` in the `where` clause.

```typescript
// CORRECT
prisma.customer.findMany({ where: { orgId } });
prisma.customer.findFirst({ where: { id, orgId } });

// WRONG — id alone is not enough
prisma.customer.findUnique({ where: { id } });
prisma.customer.findFirst({ where: { id } });
```

Do not use `findUnique` on `id` alone for tenant-owned models. Use `findFirst` with `{ id, orgId }` or add a composite unique constraint (see Schema Constraints section).

### Writes — create

On `create` and `createMany`, always inject `orgId` from the server-side resolved value. Never accept `orgId` from user input.

```typescript
// CORRECT
prisma.customer.create({ data: { ...validated, orgId } });

// WRONG — orgId comes from client input
prisma.customer.create({ data: { ...body } }); // body may contain arbitrary orgId
```

### Writes — update and delete

On `update`, `updateMany`, `delete`, and `deleteMany`, always include `orgId` in the `where` clause.

```typescript
// CORRECT
prisma.customer.update({ where: { id, orgId }, data: { name } });
prisma.customer.delete({ where: { id, orgId } });

// WRONG — no tenant scope, any authenticated user can update any record
prisma.customer.update({ where: { id }, data: { name } });
```

Note: `update` uses the unique constraint on `id` only. Include `orgId` as an additional filter to prevent cross-tenant mutation. If the `id` doesn't exist in the org, Prisma returns `null` (for `findFirst`) or throws `RecordNotFound` — either is correct behavior.

### Nested queries

When using `include` or `select` to traverse relations, validate that the traversal is anchored by an org-scoped parent. Avoid raw `connect` calls on nested relations that could link records across orgs.

```typescript
// CORRECT — customer is org-scoped, nested estimates are owned by same org
prisma.customer.findFirst({
  where: { id, orgId },
  include: { estimates: { where: { orgId } } },
});

// RISKY — if top-level is already org-scoped, nested may be safe,
// but always verify the relation is within the same org
```

---

## Service Layer Guards for Cross-Model Relations

The Prisma schema uses direct FKs between tenant-owned models (e.g., `Estimate.customerId → Customer.id`). PostgreSQL enforces FK validity but cannot enforce that both records share the same `orgId`. The service layer must fill this gap.

**Before creating any record that references another tenant-owned record:**

1. Fetch the referenced record with `{ id: referencedId, orgId }`.
2. If the fetch returns null, reject the operation with a clear error.
3. Use the returned record's ID in the create call.

This applies to:

| Creating | Must verify belongs to same org |
|---|---|
| `Estimate` | `Customer`, `Lead`, `Job` |
| `Job` | `Customer` |
| `Invoice` | `Customer`, `Job` |
| `Payment` | `Invoice` |
| `FileAsset` | `Customer`, `Lead`, `Estimate`, `Job`, `Invoice` |
| `AuditLog` | `UserProfile` (actor) |
| `Lead` | `Customer`, `UserProfile` (assignedTo) |
| `Job` | `UserProfile` (manager) |

---

## Schema-Level Constraints (Recommendation)

The current schema does not have composite FK constraints that enforce same-org cross-model references at the database level. This is a known gap documented in `architecture-checkpoint-2026-06-23.md`.

**Phase 1:** Rely entirely on service-layer guards as described above.

**Phase 2+:** Add `@@unique([id, orgId])` to core tenant-owned models, then update cross-model FK references to use composite keys. This is defense-in-depth and should not be skipped indefinitely.

Models that should eventually have `@@unique([id, orgId])`:

- `Customer`
- `Lead`
- `Estimate`
- `Job`
- `Invoice`
- `FileAsset`
- `UserProfile`

---

## Webhooks

Webhook handlers (`/api/webhooks/clerk`, `/api/webhooks/stripe`, `/api/webhooks/dropbox-sign`) are not protected by Clerk session auth. They use signature verification instead.

Rules for webhook handlers:

1. Verify the provider signature before processing any payload. Reject unsigned, tampered, or stale requests with `400` or `401`.
2. Map the provider's org or customer identifier to a Prisma `orgId` before writing any records. Never trust a provider-submitted `orgId` — always look it up via the registered mapping.
3. Write audit log entries for all state transitions.
4. Never execute destructive operations (delete, payment void, contract revocation) from a webhook without an idempotency check.

For Clerk webhooks: look up `Organization.clerkOrgId` to resolve `orgId`.  
For Stripe webhooks: look up the Stripe customer or subscription mapping to resolve `orgId`.  
For Dropbox Sign webhooks: look up the signature request mapping to resolve `orgId`.

---

## Background Jobs (Inngest)

Inngest functions are server-side but not Clerk-session-authenticated. They must:

1. Accept `orgId` as a trusted function argument — it must have been written to the job queue by authenticated server-side code, never by client-submitted data.
2. Re-fetch any tenant record at the start of the function using `orgId` from the job payload, not from any secondary source.
3. Validate that the record still exists and belongs to the org before processing.

---

## File Access

Files are stored in Cloudflare R2 with private bucket access. The `FileAsset` model stores `orgId`, `objectKey`, and `bucket`.

Rules:

1. Generate signed URLs server-side, after verifying the `FileAsset` record belongs to the active `orgId`.
2. Never expose `objectKey` or `bucket` directly to clients as navigable paths.
3. Enforce role checks before generating signed URLs for sensitive files (signed contracts, invoices, customer photos).
4. Set short expiry times on signed URLs (15 minutes or less).
5. Log signed URL generation for sensitive file types in the audit log.

---

## What to Never Do

- Never accept `orgId` from request body, query string, or headers for data access decisions.
- Never use `findUnique({ where: { id } })` on a tenant-owned model without `orgId`.
- Never use `prisma.organization.findMany()` without a specific filter — no query should return all orgs.
- Never return data from one org in a response to a user in a different org.
- Never log full JWT tokens, Clerk secret keys, Stripe secret keys, or customer PII in audit logs.
- Never hard-delete an `Organization` record in response to an automated webhook without explicit admin confirmation.
- Never share a `PrismaClient` instance between test cases that have different org contexts.

---

## Testing Requirements

Every service function that reads or writes tenant data must have at least one test that:

1. Attempts the operation with a valid `orgId` and expects success.
2. Attempts the operation with a mismatched `orgId` and expects a not-found error or empty result.
3. Does not allow cross-org record access even when the record ID is valid.

This test pattern should be enforced in Phase 1 and expanded in later phases.

---

## References

- `docs/02-architecture/clerk-org-sync-plan.md` — how clerkOrgId maps to orgId
- `docs/06-build/phase-1-auth-tenant-core-plan.md` — requireActiveOrg implementation
- `docs/06-build/architecture-checkpoint-2026-06-23.md` — schema risk decisions
- `docs/07-security/security-deploy-legal.md` — security guardrails
