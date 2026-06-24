# Tenant Service Pattern

**Status:** Active — enforced from Phase 2 onward
**Owner:** Claude (architecture/backend lead)

---

## Overview

Phase 2 introduces a formal service layer at `lib/services/`. Every write path for tenant-owned data flows through a service function. Services are the single place where:

- Cross-model org-membership is verified
- Business rules (status machines, computed fields) are enforced
- Prisma calls are made

Server actions and API route handlers are thin wrappers that:
1. Resolve `orgId` via `requireActiveOrg()`
2. Check roles via `requireRole()`
3. Validate and parse input via Zod schemas in `lib/validation/`
4. Call the service function
5. Write an audit log entry

---

## orgId Flow

```
Browser request
  → Server action / API route
      → requireActiveOrg()          // resolves orgId from Clerk session
      → requireRole("MANAGER")      // checks caller's role
      → schema.parse(rawInput)      // validates and sanitizes input
      → service(orgId, input)       // all Prisma access scoped to orgId
          → prisma.model.findFirst({ where: { id, orgId } })
      → auditLog.write(...)         // after successful service call
  → Response
```

The `orgId` passed to a service function must always come from `requireActiveOrg()`. Never extract orgId from request body, query string, URL segments, or headers. Services trust their `orgId` argument; they do not re-verify the Clerk session.

---

## Service Function Signatures

All service functions follow this parameter convention:

```typescript
// Read
function getCustomer(orgId: string, id: string): Promise<Customer | null>
function listCustomers(orgId: string, filter?: CustomerFilter): Promise<Customer[]>

// Write
function createCustomer(orgId: string, input: CreateCustomerInput): Promise<Customer>
function updateCustomer(orgId: string, id: string, input: UpdateCustomerInput): Promise<Customer | null>
function deleteCustomer(orgId: string, id: string): Promise<Customer | null>
```

`orgId` is always the first parameter. Functions that update or delete a record return `null` when the record is not found in the org (never throw a not-found error — that is the caller's responsibility to handle as HTTP 404 or redirect).

---

## Tenant-Scoped Reads

Every read must include `orgId` in the WHERE clause:

```typescript
// CORRECT
await prisma.customer.findFirst({ where: { id, orgId } });
await prisma.customer.findMany({ where: { orgId } });

// WRONG — id alone can return records from any org
await prisma.customer.findUnique({ where: { id } });
await prisma.customer.findFirst({ where: { id } });
```

Do not use `findUnique` on tenant-owned models with `id` alone. Use `findFirst` with `{ id, orgId }`.

---

## Tenant-Scoped Writes

On create: inject `orgId` from the server-resolved value, never from input:

```typescript
return prisma.customer.create({
  data: { ...validatedInput, orgId },  // orgId injected by service
});
```

On update and delete: verify the record belongs to `orgId` before mutating:

```typescript
const existing = await prisma.customer.findFirst({
  where: { id, orgId },
  select: { id: true },
});
if (!existing) return null;

return prisma.customer.update({ where: { id }, data: validatedInput });
// NOTE: update uses { id } alone because Prisma requires unique field in where.
// The org-scope was enforced by the findFirst check above.
```

---

## Cross-Model Relation Safety

PostgreSQL FK constraints verify that a referenced record exists but cannot verify that it belongs to the same org. The service layer fills this gap.

Before connecting a record to another tenant-owned record, verify that the referenced record belongs to `orgId`:

```typescript
// Creating an Estimate that references a Customer
const customer = await prisma.customer.findFirst({
  where: { id: input.customerId, orgId },
  select: { id: true },
});
if (!customer) throw new Error("Customer not found in this organization");

// Now safe to create the Estimate
await prisma.estimate.create({
  data: { ...input, orgId, customerId: customer.id },
});
```

This pattern applies to every cross-model link:

| Creating | Must verify belongs to same org |
|---|---|
| `Lead` | `Customer` (if customerId), `UserProfile` (if assignedToId) |
| `Estimate` | `Customer`, `Lead` (if leadId) |
| `Job` | `Customer`, `UserProfile` (if managerId) |
| `Invoice` | `Customer`, `Job` (if jobId) |
| `Payment` | `Invoice` |
| `FileAsset` | `Customer`, `Lead`, `Estimate`, `Job`, `Invoice` |
| `AuditLog` | `UserProfile` (actor) |

---

## Status Machine Enforcement

Status transitions must be validated in the service layer. Callers may not skip intermediate states or move backward unless the transition graph permits it.

Define allowed transitions as a constant in the validation file:

```typescript
// lib/validation/estimate.ts
export const ESTIMATE_STATUS_TRANSITIONS: Record<EstimateStatus, EstimateStatus[]> = {
  DRAFT: ["INTERNAL_REVIEW", "SENT"],
  INTERNAL_REVIEW: ["DRAFT", "SENT"],
  SENT: ["APPROVED", "DECLINED", "EXPIRED"],
  APPROVED: [],
  DECLINED: [],
  EXPIRED: [],
};
```

Enforce in the service:

```typescript
const allowed = ESTIMATE_STATUS_TRANSITIONS[existing.status];
if (!allowed.includes(newStatus)) {
  throw new Error(`Cannot transition from ${existing.status} to ${newStatus}`);
}
```

Terminal states (`APPROVED`, `DECLINED`, `EXPIRED`) have empty transition arrays and are immutable once reached.

---

## Computed Fields

Fields that are derived from other fields must be computed in the service, never accepted from client input:

| Field | Computed as |
|---|---|
| `Estimate.totalCents` | `subtotalCents + taxCents` |
| `Estimate.number` | `EST-{YYYY}-{NNNN}` — generated server-side |
| `Estimate.sentAt` | Set to `new Date()` when status transitions to `SENT` |
| `Estimate.approvedAt` | Set to `new Date()` when status transitions to `APPROVED` |

These fields must not appear in any client-facing input schema (Zod schemas in `lib/validation/`).

---

## Validation Contract

Input validation happens before the service is called. Use Zod schemas in `lib/validation/`:

```typescript
// In server action
const { orgId } = await requireRole("MANAGER");
const input = CreateCustomerSchema.parse(rawFormData); // throws ZodError on invalid input
const customer = await createCustomer(orgId, input);
```

Services receive already-validated input. Services do not re-run Zod validation. Services do perform business-logic validation (cross-model org checks, status machine checks) that Zod cannot express.

Zod errors should be caught at the server action boundary and returned as structured validation error responses, not propagated as 500 errors.

---

## Error Contract

| Situation | Service returns / throws |
|---|---|
| Record not found in org (read) | `null` |
| Record not found in org (update/delete) | `null` (no mutation) |
| Cross-model reference not in org | `throw new Error("X not found in this organization")` |
| Invalid status transition | `throw new Error("Cannot transition from X to Y")` |
| Prisma unique constraint violation | Propagated as-is (caller handles) |

Callers (server actions) are responsible for mapping `null` returns and thrown errors to appropriate HTTP responses or user-facing messages.

---

## Audit Logging

Audit log writes are the responsibility of the server action layer, not the service layer.

```typescript
// In server action
const { orgId, profile } = await requireRole("MANAGER");
const input = CreateCustomerSchema.parse(rawInput);
const customer = await createCustomer(orgId, input);

await prisma.auditLog.create({
  data: {
    orgId,
    actorId: profile.id,
    action: "customer.created",
    entityType: "Customer",
    entityId: customer.id,
    metadata: { name: customer.name },
  },
});
```

Services do not write audit logs. This keeps services focused and makes audit log writes testable at the action layer independently.

---

## Testing Requirements

Every service function must have at least:

1. A test with a valid `orgId` that expects success
2. A test with a mismatched `orgId` (cross-org record) that expects `null` or a thrown error
3. A cross-model relation test that verifies the referenced record's org is checked

Use `vi.mock("@/lib/prisma", ...)` to mock Prisma in tests. Services must be testable without a real database.

Tests live at `lib/services/__tests__/tenant-safety.test.ts`.

Example pattern:

```typescript
vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: { findFirst: vi.fn(), create: vi.fn(), ... },
  },
}));

it("getCustomer returns null for record in different org", async () => {
  mockedPrisma.customer.findFirst.mockResolvedValue(null);
  const result = await getCustomer("org-a", "id-from-org-b");
  expect(result).toBeNull();
  expect(mockedPrisma.customer.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({ where: expect.objectContaining({ orgId: "org-a" }) })
  );
});
```

---

## References

- `docs/02-architecture/tenant-isolation-rules.md` — non-negotiable query rules
- `docs/02-architecture/permission-matrix.md` — role permission table
- `docs/06-build/phase-2-crm-estimating-plan.md` — Phase 2 scope and decisions
- `lib/auth/require-active-org.ts` — orgId resolution helper
- `lib/auth/roles.ts` — requireRole guard
- `lib/validation/` — Zod input schemas
- `lib/services/` — service implementations
