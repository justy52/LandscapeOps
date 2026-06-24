# Phase 2: CRM and Estimating — Architecture Plan

**Status:** Ready for implementation
**Date drafted:** 2026-06-24
**Owner:** Claude (architecture/backend lead)
**Scope:** Customer management, lead pipeline, estimate lifecycle, service layer scaffolding, composite unique constraints

---

## Prerequisites

Phase 1 (Auth and Tenant Core) must be complete and security-reviewed before Phase 2 begins. The following Phase 1 deliverables are load-bearing for Phase 2:

- `lib/auth/require-active-org.ts` — server-side orgId resolution
- `lib/auth/require-user-profile.ts` — user profile and role resolution
- `lib/auth/roles.ts` — `requireRole()` guard
- `prisma/schema.prisma` — Organization, Customer, Lead, Estimate models
- Tenant isolation rules documented in `docs/02-architecture/tenant-isolation-rules.md`

---

## Phase 2 Scope

### CRM

- Customer create, read, update, delete (CRUD) with contact info
- Lead create, read, update, delete
- Lead status pipeline: `NEW → CONTACTED → QUALIFIED → ESTIMATE_REQUESTED → WON / LOST`
- Lead assignment to internal users
- Lead source tracking (free text, e.g. "referral", "website", "door-knock")
- Customer contact info: name, company, email, phone, address
- Notes on customers and leads (single text field; versioned note history deferred)
- Next action dates on leads

### Estimating

- Estimate CRUD tied to org, customer, and optional lead
- Estimate number generation: `EST-{YYYY}-{NNNN}` sequential per org per year
- Status flow: `DRAFT → INTERNAL_REVIEW → SENT → APPROVED / DECLINED / EXPIRED`
- Stored totals in cents: `subtotalCents`, `taxCents`, `totalCents`
- `totalCents` computed by the service as `subtotalCents + taxCents`; never accepted from client
- Margin percentage stored as Decimal(5,2) for review
- `sentAt` and `approvedAt` timestamps set automatically on status transitions

---

## Out-of-Scope Items for Phase 2

The following must NOT be built during Phase 2:

| Item | Deferred to |
|---|---|
| Proposal PDF generation | Phase 4 |
| Contract signing (Dropbox Sign) | Phase 4 |
| Invoice / payment conversion from estimates | Phase 4 |
| Job creation from approved estimates | Phase 3 |
| Estimate line items, assemblies, labor rates | Future |
| File uploads for estimates (photos, plans) | Phase 4 (R2) |
| Email / SMS notifications (Resend, Twilio) | Phase 5 |
| Client portal access to estimates | Phase 5 |
| Versioned change orders after approval | Phase 3+ |
| Note history / versioned notes | Phase 3+ |
| Full UI screens (data tables, forms, detail pages) | Phase 2 UI (separate) |
| Inngest background jobs | Phase 5 |

---

## Service Layer Architecture

Phase 2 introduces a formal service layer at `lib/services/`. See `docs/02-architecture/tenant-service-pattern.md` for the complete pattern.

Key decisions:

**Services accept `orgId` as a parameter, not from session.** The orgId must be resolved by the caller (server action or API route) via `requireActiveOrg()` before calling the service. This makes services:
- Testable without Clerk or Next.js context
- Usable from webhooks and background jobs
- Clear about what they require

**Services enforce orgId on every read, write, update, and delete.** No service function may query or mutate a tenant record without validating that the record belongs to the supplied orgId.

**Services enforce cross-model org ownership before connecting records.** Before creating an Estimate that references a Customer or Lead, the service verifies those records belong to the same orgId. This fills the gap that PostgreSQL FK constraints cannot enforce (they verify record existence but not same-org membership).

---

## Estimate Number Generation

Format: `EST-{YYYY}-{NNNN}`
- `{YYYY}` = 4-digit calendar year (resets each year per org)
- `{NNNN}` = zero-padded 4-digit sequential integer per org per year

Examples: `EST-2026-0001`, `EST-2026-0042`, `EST-2027-0001`

Generation algorithm:
1. Compute prefix = `EST-{currentYear}-`
2. Query `Estimate.findFirst` where `orgId = orgId AND number startsWith prefix ORDER BY number DESC`
3. Parse the 4-digit sequence from the last number; default to 0 if none found
4. Increment by 1; format as `${prefix}${seq.padStart(4, "0")}`

The `@@unique([orgId, number])` constraint on the Estimate model prevents duplicate numbers if two requests race. If a conflict occurs, Prisma throws a unique constraint violation. For Phase 2, this is sufficient; a dedicated sequence table or advisory lock can be added if high-concurrency estimate creation becomes a requirement.

The number is generated server-side inside the service function before the `prisma.estimate.create` call. Number is never accepted from client input.

---

## Composite Unique Constraint Decision

**Decision: Add `@@unique([id, orgId])` to Customer, Lead, and Estimate in Phase 2. Defer Job, Invoice, FileAsset, UserProfile to Phase 3+.**

Rationale:
- The tenant-isolation-rules.md document explicitly deferred these to Phase 2+
- Customer, Lead, and Estimate are the active models this phase
- Adding `@@unique([id, orgId])` is a safe migration: `id` is already globally unique (cuid), so adding a composite index cannot fail on existing data
- The constraint enables future composite FK references at the database level (defense-in-depth)
- For Phase 2, the service layer enforces cross-model org ownership; the DB constraint is defense-in-depth preparation

**Composite FK references are NOT added in Phase 2.** Updating FK columns (e.g., `Estimate.customerId` → composite FK on `Customer(id, orgId)`) requires a more invasive migration and Prisma preview features. This is deferred until Phase 3 when the data model has stabilized.

Migration command to run before Phase 2 development begins:

```bash
npx prisma migrate dev --name phase-2-composite-unique
```

---

## Validation Strategy

All inputs entering the service layer must be validated using Zod schemas defined in `lib/validation/`. Server actions and API route handlers call `schema.parse(rawInput)` before passing to the service.

Rules:
- String fields have max length limits to prevent storage abuse
- Monetary fields (cents) must be non-negative integers; no floats accepted
- `totalCents` is always computed server-side: `subtotalCents + taxCents`; it is not in any input schema
- Enum fields use `z.nativeEnum()` against Prisma-generated enum types to stay in sync
- Optional relation IDs (customerId, leadId) are validated as cuid strings; existence and org-membership are verified in the service

---

## Permission Checks

Phase 2 operations follow the permission matrix at `docs/02-architecture/permission-matrix.md`.

Summary for Phase 2 operations:

| Operation | Minimum role |
|---|---|
| List / view customers, leads, estimates | MANAGER |
| Create customer, lead, estimate | MANAGER |
| Edit customer, lead, estimate | MANAGER |
| Assign lead | MANAGER |
| Transition estimate status | MANAGER |
| Delete customer, lead | ADMIN |
| Delete estimate | ADMIN |

Server actions must call `requireRole("MANAGER")` or `requireRole("ADMIN")` before calling service functions. Role checks are enforced in server actions, not in services. Services are role-agnostic — they assume the caller has already performed role verification.

---

## Audit Logging Expectations

Phase 2 must write audit log entries for the following events:

| Event | Entity | Action | Trigger |
|---|---|---|---|
| Customer created | Customer | `customer.created` | createCustomer |
| Customer updated | Customer | `customer.updated` | updateCustomer |
| Customer deleted | Customer | `customer.deleted` | deleteCustomer |
| Lead created | Lead | `lead.created` | createLead |
| Lead status changed | Lead | `lead.status_changed` | updateLeadStatus |
| Lead assigned | Lead | `lead.assigned` | assignLead |
| Lead deleted | Lead | `lead.deleted` | deleteLead |
| Estimate created | Estimate | `estimate.created` | createEstimate |
| Estimate status transitioned | Estimate | `estimate.status_changed` | transitionEstimateStatus |
| Estimate deleted | Estimate | `estimate.deleted` | deleteEstimate |

Audit log entries must include:
- `orgId` — the active org
- `actorId` — the UserProfile.id of the user performing the action
- `entityType` — the model name (Customer, Lead, Estimate)
- `entityId` — the record id
- `action` — the action string from the table above
- `metadata` — sanitized relevant data (e.g., `{ from: "DRAFT", to: "SENT" }` for status changes)

Audit log writes are the responsibility of the server action layer, not the service layer. Services return the mutated record; server actions write the audit log after a successful service call.

---

## Implementation Order

1. Apply schema migration for composite unique constraints
2. Run `prisma generate` to update the client
3. Implement validation schemas (`lib/validation/`)
4. Implement service functions (`lib/services/`)
5. Write and pass tenant-safety tests (`lib/services/__tests__/tenant-safety.test.ts`)
6. Implement server actions (`app/actions/`) with role checks and audit logging
7. Security review before any UI is wired up
8. Phase 2 UI: data tables, forms, detail pages (separate from this plan)

---

## Acceptance Criteria

### CRM

- [ ] Customer CRUD works with orgId scoping on all operations
- [ ] Lead CRUD works with orgId scoping on all operations
- [ ] Lead status transitions are persisted
- [ ] Lead assignment verifies the assignee belongs to the org
- [ ] Creating a lead with a customerId from another org is rejected
- [ ] Deleting a customer with active estimates is rejected (Prisma Restrict FK)

### Estimating

- [ ] Estimate CRUD works with orgId scoping on all operations
- [ ] Estimate numbers are generated in `EST-{YYYY}-{NNNN}` format server-side
- [ ] `totalCents` is always computed as `subtotalCents + taxCents`; never accepted from client
- [ ] Status transitions enforce the allowed transition graph
- [ ] `sentAt` and `approvedAt` are set automatically on the corresponding status transitions
- [ ] Creating an estimate with a customerId from another org is rejected
- [ ] Creating an estimate with a leadId from another org is rejected

### Tenant Safety

- [ ] All service functions include orgId in every Prisma WHERE clause
- [ ] Cross-tenant negative tests pass for Customer, Lead, and Estimate
- [ ] No service function accepts orgId from a parameter that could originate from client input

### Checks

- [ ] `npm run prisma:generate` passes
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `npm test` passes

---

## References

- `docs/02-architecture/tenant-isolation-rules.md` — non-negotiable query rules
- `docs/02-architecture/tenant-service-pattern.md` — service layer pattern
- `docs/02-architecture/permission-matrix.md` — role permission table
- `docs/03-features/crm.md` — CRM feature specification
- `docs/03-features/estimating.md` — estimating feature specification
- `docs/07-security/phase-2-crm-estimating-security-checklist.md` — security checklist
