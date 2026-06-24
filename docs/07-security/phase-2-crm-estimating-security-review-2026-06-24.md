# Phase 2 CRM & Estimating Security Review

**Date:** 2026-06-24  
**Reviewer:** Claude (architecture/backend lead)  
**Scope:** Phase 2 CRM and Estimating UI scaffold (commit 79428b2d)  
**Status:** PASS — Phase 2 feature work may continue

---

## Overall Status

No blockers or high findings were identified. One medium finding was fixed in this review session. Three low findings are documented; two were fixed, one is deferred by design.

---

## Files Reviewed

| File | Role |
|------|------|
| `app/actions/crm.ts` | 9 server actions for CRM mutations |
| `app/actions/__tests__/crm-actions.test.ts` | Action-level tests |
| `app/dashboard/layout.tsx` | Auth gate for all `/dashboard/*` routes |
| `app/dashboard/page.tsx` | Static demo dashboard (no tenant data) |
| `app/dashboard/crm/page.tsx` | CRM root redirect |
| `app/dashboard/crm/customers/page.tsx` | Customer list |
| `app/dashboard/crm/customers/new/page.tsx` | New customer form |
| `app/dashboard/crm/customers/[customerId]/edit/page.tsx` | Edit customer |
| `app/dashboard/crm/leads/page.tsx` | Lead list |
| `app/dashboard/crm/leads/new/page.tsx` | New lead form |
| `app/dashboard/crm/leads/[leadId]/edit/page.tsx` | Edit lead |
| `app/dashboard/crm/estimates/page.tsx` | Estimate list |
| `app/dashboard/crm/estimates/new/page.tsx` | New estimate form |
| `app/dashboard/crm/estimates/[estimateId]/page.tsx` | Estimate detail |
| `app/dashboard/crm/estimates/[estimateId]/edit/page.tsx` | Edit estimate |
| `components/crm/customer-form.tsx` | Customer form client component |
| `components/crm/lead-form.tsx` | Lead form client component |
| `components/crm/estimate-form.tsx` | Estimate form client component with transition panel |
| `components/app-shell.tsx` | App shell / nav |
| `lib/constants.ts` | Nav items and static demo data |
| `lib/action-state.ts` | ActionState type and emptyActionState |
| `lib/format.ts` | Currency and date formatting utilities |
| `lib/services/customers.ts` | Customer service layer |
| `lib/services/leads.ts` | Lead service layer |
| `lib/services/estimates.ts` | Estimate service layer |
| `lib/validation/customer.ts` | Customer Zod schemas |
| `lib/validation/lead.ts` | Lead Zod schemas |
| `lib/validation/estimate.ts` | Estimate Zod schemas |
| `lib/services/__tests__/tenant-safety.test.ts` | Cross-tenant negative tests |

---

## Review Goals and Results

| # | Goal | Result |
|---|------|--------|
| 1 | `app/dashboard/layout.tsx` calls `requireActiveOrg()` protecting all routes | PASS |
| 2 | Every CRM page calls `requireRole("MANAGER")` individually | PASS |
| 3 | Every CRM server action calls `requireRole("MANAGER")` as first statement | PASS |
| 4 | `orgId` is never read from form data or client-submitted input | PASS |
| 5 | All mutations route through the service layer; no direct Prisma in actions | PASS |
| 6 | Cross-model membership checks (customerId, leadId, assignedToId) are in the service layer | PASS |
| 7 | Audit logs are written after successful service calls, not before | PASS (fixed) |
| 8 | Zod validation runs before any service call | PASS |
| 9 | Server-owned fields (number, totalCents, sentAt, approvedAt) absent from all input schemas | PASS |
| 10 | Status machine is enforced server-side in `transitionEstimateStatus` | PASS |
| 11 | No Phase 3+ routes or server actions exposed; nav items beyond Phase 2 use `#` fragment anchors | PASS |
| 12 | Cross-tenant negative tests exist and cover all three models | PASS |

---

## Findings

### MEDIUM (Fixed)

#### M-01 — Audit log inside service try/catch masked successful writes as failures

**File:** `app/actions/crm.ts` — all 9 actions  
**Risk:** If `writeAuditLog` threw after a successful service call, the action returned `errorState` and `redirect` never fired. The record was already persisted, but the user saw an error and could resubmit, causing a duplicate write attempt (blocked by DB constraints) and user confusion.

**Before (all 9 actions shared this pattern):**
```typescript
try {
  const record = await serviceCall(orgId, input);
  await writeAuditLog({ ... }); // failure here masked the successful write
} catch (error) {
  return errorState(error); // fired even if only audit log failed
}
redirect("/dashboard/crm/...");
```

**After:**
```typescript
let record: ...; // declared outside
try {
  record = await serviceCall(orgId, input); // only service failure blocks
} catch (error) {
  return errorState(error);
}

try {
  await writeAuditLog({ ... }); // best-effort; never blocks redirect
} catch {
  // swallowed — audit log failure does not mask a successful write
}

revalidatePath("...");
redirect("..."); // always fires after successful service call
```

**Status:** Fixed in this review session. All 9 actions updated.

---

### LOW (Fixed)

#### L-01 — Monetary Zod fields had no upper bound

**Files:** `lib/validation/estimate.ts`, `lib/validation/lead.ts`  
**Risk:** Without an upper bound, a value exceeding Prisma's `Int` column maximum (2,147,483,647 cents ≈ $21.4M) would produce a confusing database-level overflow error instead of a clean validation message.

**Fix:** Added `.max(2_147_483_647)` to `subtotalCents` and `taxCents` in `CreateEstimateSchema` and `UpdateEstimateSchema`, and to `budgetCents` in `CreateLeadSchema`. The constant `PRISMA_INT_MAX = 2_147_483_647` was extracted to make the intent clear in the estimate schema.

**Status:** Fixed in this review session.

---

### LOW (Deferred — no fix)

#### L-02 — Estimate transition graph duplicated in client component

**File:** `components/crm/estimate-form.tsx` (`EstimateTransitionPanel`)  
**Risk:** The local `estimateTransitions` constant duplicates `ESTIMATE_STATUS_TRANSITIONS` from `lib/validation/estimate.ts`. If the server-side graph changes, the UI display could show stale transitions. This is not a security issue — the server enforces all state transitions and the client copy affects only button visibility.

**Why not fixed:** `ESTIMATE_STATUS_TRANSITIONS` cannot be safely imported in a client component because it imports from `@prisma/client`, and Prisma's generated types must not be bundled by the browser. Creating a separate UI-only constants file is the correct fix and is tracked as a follow-up.

**Follow-up:** Extract a `lib/constants/estimate-transitions.ts` (no Prisma import) that both the validation module and the client component can import. Schedule for next Phase 2 iteration.

---

#### L-03 — Action test coverage is partial

**File:** `app/actions/__tests__/crm-actions.test.ts`  
**Coverage:** 4 tests cover 3 of 9 actions (`createCustomerAction`, `createEstimateAction`, `transitionEstimateStatusAction`). The following actions have no action-level tests: `updateCustomerAction`, `createLeadAction`, `updateLeadAction`, `updateLeadStatusAction`, `assignLeadAction`, `updateEstimateAction`.

**Risk level:** Low. The service layer has 30 cross-tenant tests. The action layer's main responsibilities (requireRole call, orgId not from form data, audit log after service) are verified for the three covered actions. The uncovered actions follow identical patterns.

**Follow-up:** Add action-level tests for the remaining 6 actions before shipping. Priority: `updateLeadStatusAction` (two-step service call) and `assignLeadAction` (nullable assignedToId).

---

## Fixes Made in This Review Session

| Finding | File(s) | Change |
|---------|---------|--------|
| M-01 | `app/actions/crm.ts` | Split service try/catch from best-effort audit log try/catch in all 9 actions |
| L-01 | `lib/validation/estimate.ts` | Added `.max(2_147_483_647)` to `subtotalCents` and `taxCents`; extracted `PRISMA_INT_MAX` constant |
| L-01 | `lib/validation/lead.ts` | Added `.max(2_147_483_647)` to `budgetCents` |

---

## Open Follow-ups

| ID | Description | Priority | Phase |
|----|-------------|----------|-------|
| L-02 | Extract estimate transition constants to a shared file importable from client components | Low | Phase 2 |
| L-03 | Add action tests for `updateCustomerAction`, `createLeadAction`, `updateLeadAction`, `updateLeadStatusAction`, `assignLeadAction`, `updateEstimateAction` | Low | Phase 2 |
| — | Evaluate Zod v4 migration: `z.nativeEnum`, `.cuid()`, and `.flatten()` APIs are deprecated in Zod v4; project uses v3-style patterns — assess migration or pin to v3 | Low | Phase 2 / Phase 3 |

---

## Authorization to Continue

Phase 2 feature work may continue. The single medium finding has been fixed. No blockers or high findings were identified. The auth chain, tenant isolation, service layer pattern, and state machine enforcement all meet the Phase 2 security bar.

The next Phase 2 increment should address L-02 and L-03 before the phase closes.
