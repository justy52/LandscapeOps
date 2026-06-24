# Phase 2: CRM and Estimating — Security Checklist

**Status:** Pre-implementation checklist — must be reviewed before any Phase 2 server action or API route is exposed
**Date drafted:** 2026-06-24
**Owner:** Claude (architecture/backend lead)
**Scope:** Customer, Lead, Estimate service layer and server actions

Do not repeat the Phase 1 security review (commit d87325286fa08f6a399fe6d2d6b58dbc7adf6945). This checklist covers Phase 2 additions only.

---

## Pre-Implementation Requirements

Before writing any Phase 2 server actions or API routes, confirm:

- [ ] Phase 1 security review is complete (`docs/07-security/phase-1-auth-tenant-security-review-2026-06-23.md`)
- [ ] `requireActiveOrg()` is implemented and tested
- [ ] `requireRole()` is implemented and tested
- [ ] `@@unique([orgId, number])` is confirmed on the Estimate model
- [ ] Phase 2 schema migration for `@@unique([id, orgId])` on Customer, Lead, Estimate has been drafted and reviewed

---

## Tenant Isolation Checks

### For every service function in lib/services/

- [ ] `listX(orgId, ...)` — `orgId` appears in the Prisma `findMany` WHERE clause
- [ ] `getX(orgId, id)` — uses `findFirst({ where: { id, orgId } })` not `findUnique({ where: { id } })`
- [ ] `createX(orgId, input)` — `orgId` is injected from the parameter, never from `input`
- [ ] `updateX(orgId, id, input)` — verifies record belongs to `orgId` before mutating
- [ ] `deleteX(orgId, id)` — verifies record belongs to `orgId` before deleting

### Cross-model relation safety

- [ ] `createLead` with `customerId` — verifies `customer.findFirst({ where: { id: customerId, orgId } })` returns non-null before creating
- [ ] `createLead` with `assignedToId` — verifies `userProfile.findFirst({ where: { id: assignedToId, orgId } })` returns non-null before creating
- [ ] `updateLead` with `customerId` — re-verifies customer in org
- [ ] `updateLead` with `assignedToId` — re-verifies user in org
- [ ] `assignLead` with `assignedToId` — verifies user in org
- [ ] `createEstimate` with `customerId` — verifies customer in org before creating
- [ ] `createEstimate` with `leadId` — verifies lead in org before creating

### Negative tests (cross-tenant)

- [ ] `getCustomer` with id from org-b returns `null` when called with org-a's `orgId`
- [ ] `updateCustomer` with id from org-b returns `null` without calling `prisma.customer.update`
- [ ] `deleteCustomer` with id from org-b returns `null` without calling `prisma.customer.delete`
- [ ] `createLead` with `customerId` from org-b throws before `prisma.lead.create`
- [ ] `createLead` with `assignedToId` from org-b throws before `prisma.lead.create`
- [ ] `assignLead` with `assignedToId` from org-b throws without updating the lead
- [ ] `getEstimate` with id from org-b returns `null` when called with org-a's `orgId`
- [ ] `createEstimate` with `customerId` from org-b throws before `prisma.estimate.create`
- [ ] `createEstimate` with `leadId` from org-b throws before `prisma.estimate.create`

---

## Server Action Security Requirements

For every server action in `app/actions/` that exposes Phase 2 operations:

- [ ] Calls `requireActiveOrg()` or `requireRole()` before any Prisma access
- [ ] Does not accept `orgId` from form data, query string, or request body
- [ ] Does not accept `totalCents` from the client (must be computed server-side)
- [ ] Does not accept `Estimate.number` from the client (must be generated server-side)
- [ ] Does not accept `Estimate.sentAt` or `Estimate.approvedAt` from the client
- [ ] Validates all input with a Zod schema before calling the service
- [ ] Handles `null` returns from service as 404 (not 500)
- [ ] Handles thrown service errors gracefully (no raw stack traces to client)
- [ ] Writes an audit log entry after each successful mutation

---

## Estimate Number Security

- [ ] `Estimate.number` is generated server-side only; it is not in any client-facing input schema
- [ ] `generateEstimateNumber` is called inside the service function after cross-model checks pass
- [ ] The `@@unique([orgId, number])` constraint prevents duplicate numbers; Prisma unique constraint violation is handled by the caller (retry or error to user)
- [ ] No number is accepted or modified from client-submitted data

---

## Estimate Status Transition Security

- [ ] Status transitions are enforced via the `ESTIMATE_STATUS_TRANSITIONS` constant; only documented transitions are permitted
- [ ] Terminal states (`APPROVED`, `DECLINED`, `EXPIRED`) have empty allowed-transition arrays; service throws if a transition from a terminal state is attempted
- [ ] `sentAt` is set automatically on `SENT` transition; not accepted from client
- [ ] `approvedAt` is set automatically on `APPROVED` transition; not accepted from client
- [ ] Transitions to `APPROVED` and `DECLINED` set the final state; no further status changes are permitted

---

## Input Validation Requirements

- [ ] All string inputs have `max()` length constraints in Zod schemas to prevent storage abuse
- [ ] Monetary inputs (`subtotalCents`, `taxCents`) use `z.number().int().nonnegative()` — no floats, no negatives
- [ ] Optional relation ID fields (customerId, leadId, assignedToId) use `z.string().cuid()` to reject malformed IDs before Prisma is called
- [ ] Enum inputs use `z.nativeEnum(PrismaEnum)` to stay in sync with the Prisma schema
- [ ] ZodError is caught at the server action layer and returned as structured user-facing validation errors, not propagated as unhandled exceptions

---

## Audit Log Requirements

Audit logs must be written server-side (in server actions, not services) for:

- [ ] Customer created, updated, deleted
- [ ] Lead created, status changed, assigned, deleted
- [ ] Estimate created, status changed, deleted

Each audit log entry must include:
- [ ] `orgId` from `requireActiveOrg()` — never from client input
- [ ] `actorId` from the resolved `UserProfile.id` — never from client input
- [ ] `action` string matching the table in the Phase 2 plan
- [ ] `entityType` and `entityId`
- [ ] `metadata` with sanitized relevant context (no raw JWT tokens, passwords, or unrelated PII)

---

## Out-of-Scope Security Items (Not Phase 2)

The following security requirements are explicitly deferred:

| Item | Deferred to |
|---|---|
| Rate limiting on CRM/estimate endpoints | Phase 3+ (add when API surface is larger) |
| File upload validation for estimate attachments | Phase 4 (R2 not built yet) |
| Client portal isolation for estimate visibility | Phase 5 |
| Stripe webhook signature verification for payments | Phase 4 |
| Dropbox Sign webhook verification for contracts | Phase 4 |
| Inngest background job orgId source validation | Phase 5 |
| Bulk export permission checks | Phase 5 |

---

## Sign-Off Checklist

Before merging Phase 2 server actions to main:

- [ ] All tenant-safety tests in `lib/services/__tests__/tenant-safety.test.ts` pass
- [ ] Every new server action has been manually tested with a cross-org record ID substitution attack (confirm it returns not-found, not the other org's data)
- [ ] `npm run lint` passes with no warnings on new files
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] A second reviewer has read the service functions and confirmed `orgId` is present in every WHERE clause

---

## References

- `docs/07-security/phase-1-auth-tenant-security-review-2026-06-23.md` — Phase 1 review (do not repeat)
- `docs/02-architecture/tenant-isolation-rules.md` — non-negotiable query rules
- `docs/02-architecture/tenant-service-pattern.md` — service layer pattern
- `docs/02-architecture/permission-matrix.md` — role permission table
- `docs/06-build/phase-2-crm-estimating-plan.md` — Phase 2 plan and decisions
