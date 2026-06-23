# Architecture Checkpoint — 2026-06-23

**Type:** Pre-Phase-1 architecture review  
**Reviewer:** Claude (architecture/backend lead)  
**Status:** Decisions recorded — ready for Phase 1 implementation

---

## What Was Reviewed

- `README.md`, `AGENTS.md`, `CLAUDE.md`, `CODEX.md`
- `package.json`
- `prisma/schema.prisma`
- `docs/01-product/product-spec.md`
- `docs/01-product/app-scope.md`
- `docs/02-architecture/tech-stack.md`
- `docs/02-architecture/data-model.md`
- `docs/02-architecture/api-spec.md`
- `docs/02-architecture/auth-permissions.md`
- `docs/04-finance/financial-rules.md`
- `docs/06-build/build-plan.md`
- `docs/07-security/security-deploy-legal.md`
- `.github/workflows/ci.yml`

---

## Summary Assessment

The Phase 0 foundation is sound. The schema design is intentional and the right models are present. The documentation covers principles well but lacked implementation-level detail for Phase 1. The main action items are:

1. Add implementation-detail docs before Phase 1 starts (done in this commit).
2. Document and mitigate cross-org FK relation risks at the service layer.
3. Defer composite FK constraint changes to Phase 2.
4. Add a `suspendedAt` field to `Organization` for safe org deletion handling.

---

## Prisma Schema Findings

### What is good

- Every model has `orgId String` that references `Organization.id`.
- All `orgId` FKs use `onDelete: Cascade` from `Organization`, ensuring org-owned data is properly scoped.
- `@@unique([orgId, number])` on `Estimate` and `Invoice` prevents duplicate document numbers within an org.
- `@@unique([orgId, clerkUserId])` on `UserProfile` is correct — users can belong to multiple orgs.
- `@@unique([orgId, objectKey])` on `FileAsset` prevents duplicate object keys within an org's bucket prefix.
- Comments on every model call out the tenant-safety requirement.
- Enum values are sensible and cover the expected lifecycle states.

### Cross-org FK relation risks (medium severity)

The following FK relations reference another tenant-owned model by `id` alone with no DB-level guarantee that both records share the same `orgId`. PostgreSQL enforces FK validity (the referenced `id` must exist) but cannot enforce cross-org membership because `id` is globally unique (cuid).

This means a malicious or buggy server action could create:

```
Estimate { orgId: "org_A", customerId: "customer_from_org_B" }
```

...and PostgreSQL would accept it without a constraint violation.

**Relations with this risk:**

| Model | FK | References |
|---|---|---|
| `Estimate` | `customerId` | `Customer.id` |
| `Estimate` | `leadId` | `Lead.id` |
| `Estimate` | `jobId` | `Job.id` |
| `Job` | `customerId` | `Customer.id` |
| `Job` | `managerId` | `UserProfile.id` |
| `Invoice` | `customerId` | `Customer.id` |
| `Invoice` | `jobId` | `Job.id` |
| `Payment` | `invoiceId` | `Invoice.id` |
| `FileAsset` | `customerId` | `Customer.id` |
| `FileAsset` | `leadId` | `Lead.id` |
| `FileAsset` | `estimateId` | `Estimate.id` |
| `FileAsset` | `jobId` | `Job.id` |
| `FileAsset` | `invoiceId` | `Invoice.id` |
| `AuditLog` | `actorId` | `UserProfile.id` |
| `Lead` | `customerId` | `Customer.id` |
| `Lead` | `assignedToId` | `UserProfile.id` |

**Severity assessment:** Medium. These are risks at the write path. Read paths are protected by `orgId` scoping in queries. The exploit requires a server-side bug or intentional manipulation in a server action — not a client-side injection. However, a single miscoded mutation could permanently associate cross-tenant data in ways that are hard to detect and correct.

---

## Decision: Service-Layer Guards First, Schema Constraints in Phase 2

**Decision:** Phase 1 will mitigate all cross-org FK risks through service-layer guards. Schema-level composite FK constraints are deferred to Phase 2.

**Rationale:**

1. Composite FK constraints require `@@unique([id, orgId])` on every referenced model. That changes the unique constraint structure for all core models and requires a careful migration.
2. All FK columns would then need to change from `customerId String` to a composite reference `[customerId, orgId]` — which is a significant schema refactor.
3. Service-layer guards are the primary defense regardless of whether composite FKs exist. The DB constraint is defense-in-depth, not the first line of defense.
4. Phase 1 is the right time to establish the service-layer pattern, not the right time for a migration-heavy schema change.

**Phase 1 mitigation (required):**

Before creating any record that references another tenant-owned record by FK, the service action must:

1. Fetch the referenced record with `{ id: foreignId, orgId }`.
2. If not found, throw an error and abort.
3. Use the returned record's confirmed `id` in the create call.

This is documented fully in `docs/02-architecture/tenant-isolation-rules.md`.

**Phase 2 recommendation:**

Add `@@unique([id, orgId])` to:
- `Customer`
- `Lead`
- `Estimate`
- `Job`
- `Invoice`
- `FileAsset`
- `UserProfile`

Then update cross-model FK relations to use composite keys, providing DB-level enforcement as defense-in-depth.

---

## Decision: Organization Deletion — Soft-Delete Pattern

**Decision:** Add `suspendedAt DateTime?` to `Organization` in the Phase 1 migration. Handle `organization.deleted` Clerk webhook events by setting `suspendedAt` and logging the event, not by hard-deleting the record.

**Rationale:**

- Hard-delete cascades through all tenant data (customers, leads, estimates, jobs, invoices, payments, files, audit logs) — this is irreversible.
- Automation-driven hard-delete based on a webhook is too dangerous without explicit confirmation.
- `suspendedAt` allows the data to be preserved for the required period (30 days or per legal requirements) before a deliberate admin-level hard-delete.

**Required schema change:**

```prisma
model Organization {
  // ... existing fields
  suspendedAt DateTime?
}
```

This is the only schema change recommended for Phase 1. It is non-breaking and requires a simple migration.

---

## Documentation Gap Assessment

| Doc | Gap before this commit | Status |
|---|---|---|
| `build-plan.md` | Phase 1 described in 4 bullets — no implementation guidance | Supplemented by `phase-1-auth-tenant-core-plan.md` |
| `auth-permissions.md` | Role definitions present; no permission matrix | Supplemented by `permission-matrix.md` |
| `api-spec.md` | Webhook route shapes listed; no handler patterns or validation contract | Referenced in `clerk-org-sync-plan.md` |
| `data-model.md` | Principle stated; no access patterns or query rules | Supplemented by `tenant-isolation-rules.md` |
| `tech-stack.md` | Stack listed; no integration patterns | Adequate for Phase 0 |
| `security-deploy-legal.md` | Principles stated; no enforcement patterns | Supplemented by `tenant-isolation-rules.md` |

---

## CI Assessment

The CI workflow at `.github/workflows/ci.yml` runs:

- `npm install`
- `npm run prisma:generate`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

This is correct for Phase 0 and Phase 1. The build does not require a live database because Prisma client is generated from the schema, not the database.

Recommended additions for later phases (not Phase 1):

- `npx prisma migrate deploy` step in a staging environment job
- Test runner step once unit/integration tests are added

---

## Open Questions for Phase 1 Implementation

1. **First-org OWNER assignment:** The current schema has no initialization flow for setting `OWNER` on a freshly synced org. The webhook handler should auto-assign `OWNER` to the first `organizationMembership.created` event for each org. Confirm this logic before wiring the webhook.

2. **Webhook ordering guarantee:** Clerk does not guarantee ordering of `organization.created` and `organizationMembership.created` events. The webhook handler must return `503` (retry) if the org is not yet in Prisma when a membership event arrives. Confirm this retry behavior in Clerk dashboard settings.

3. **Org suspension vs. deletion UX:** The `suspendedAt` field needs a Phase 2 admin UI entry point. Phase 1 should only implement the DB field and webhook handler — no UI needed yet.

4. **Svix version:** `@clerk/nextjs` v6 bundles Svix internally. Confirm whether `npm install svix` is still required or whether it is re-exported from the Clerk package before adding the dependency.

5. **Prisma seed tool:** `ts-node` is not currently in `devDependencies`. Either add it or use `tsx` (more modern, zero-config TypeScript runner) for the seed script. Confirm which is preferred before writing `prisma/seed.ts`.

---

## What Was Not Reviewed

- Feature docs (`docs/03-features/`) — out of scope for Phase 1
- Design docs (`docs/05-design/`) — Codex ownership
- Finance docs (`docs/04-finance/invoicing-payments.md`) — Phase 4
- Testing and operations docs — Phase 2+
- The actual app shell code (`app/`, `components/`, `lib/`) — Phase 0 deliverable, Codex ownership

---

## Next Checkpoint

Schedule an architecture checkpoint before Phase 2 begins to verify:

- All Phase 1 acceptance criteria are met
- Webhook handler tested against Clerk event replay
- `requireActiveOrg()` helper in use across all server actions
- No client-side `orgId` submission found in code review
- Audit log entries confirmed for all Phase 1 events
- Decision recorded on composite FK constraint timing

---

## References

- `docs/06-build/phase-1-auth-tenant-core-plan.md`
- `docs/02-architecture/tenant-isolation-rules.md`
- `docs/02-architecture/clerk-org-sync-plan.md`
- `docs/02-architecture/permission-matrix.md`
