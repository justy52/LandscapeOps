# Permission Matrix

**Status:** Draft — covers Phase 1 and Phase 2 scope  
**Owner:** Claude (architecture/backend lead)  
**Last updated:** 2026-06-23

---

## Role Definitions

| Role | Who it is | Granted by |
|---|---|---|
| `OWNER` | Account owner. Billing control, org deletion, security settings, full access. | Auto-assigned to first org member; transferable by existing OWNER |
| `ADMIN` | Operations lead or office manager. Manages users, settings, all workflows. | OWNER |
| `MANAGER` | Estimator, project manager, or account manager. Runs CRM, estimates, jobs, invoices. | OWNER or ADMIN |
| `FIELD` | Crew lead or field technician. Mobile-first, scoped to assigned work. | OWNER or ADMIN |
| `MEMBER` | General internal access, no write access to operational or financial records. | Default for new Clerk org members |

Role hierarchy for guard comparisons (higher number = more authority):

```
OWNER(5) > ADMIN(4) > MANAGER(3) > FIELD(2) > MEMBER(1)
```

---

## Permission Matrix

Legend: `✓` = allowed · `—` = not allowed · `(own)` = only own/assigned records · `Phase N` = not built yet

### Organization and User Management

| Action | OWNER | ADMIN | MANAGER | FIELD | MEMBER |
|---|---|---|---|---|---|
| View org settings | ✓ | ✓ | — | — | — |
| Update org name / slug | ✓ | — | — | — | — |
| Invite users to org | ✓ | ✓ | — | — | — |
| Remove users from org | ✓ | ✓ | — | — | — |
| Change user role | ✓ | ✓ | — | — | — |
| View user list | ✓ | ✓ | ✓ | — | — |
| Delete organization | ✓ | — | — | — | — |
| View audit log | ✓ | ✓ | — | — | — |

### CRM — Customers (Phase 2+)

| Action | OWNER | ADMIN | MANAGER | FIELD | MEMBER |
|---|---|---|---|---|---|
| View customer list | ✓ | ✓ | ✓ | — | — |
| View customer detail | ✓ | ✓ | ✓ | — | — |
| Create customer | ✓ | ✓ | ✓ | — | — |
| Edit customer | ✓ | ✓ | ✓ | — | — |
| Delete customer | ✓ | ✓ | — | — | — |

### CRM — Leads (Phase 2+)

| Action | OWNER | ADMIN | MANAGER | FIELD | MEMBER |
|---|---|---|---|---|---|
| View lead list | ✓ | ✓ | ✓ | — | — |
| View lead detail | ✓ | ✓ | ✓ | (own) | — |
| Create lead | ✓ | ✓ | ✓ | — | — |
| Edit lead | ✓ | ✓ | ✓ | (own) | — |
| Delete lead | ✓ | ✓ | — | — | — |
| Assign lead | ✓ | ✓ | ✓ | — | — |

### Estimating (Phase 2+)

| Action | OWNER | ADMIN | MANAGER | FIELD | MEMBER |
|---|---|---|---|---|---|
| View estimate list | ✓ | ✓ | ✓ | — | — |
| View estimate detail | ✓ | ✓ | ✓ | — | — |
| Create estimate | ✓ | ✓ | ✓ | — | — |
| Edit draft estimate | ✓ | ✓ | ✓ | — | — |
| Send estimate to customer | ✓ | ✓ | ✓ | — | — |
| Approve estimate internally | ✓ | ✓ | ✓ | — | — |
| Mark estimate as approved/declined | ✓ | ✓ | ✓ | — | — |
| Delete estimate | ✓ | ✓ | — | — | — |
| View margin / line-item cost | ✓ | ✓ | ✓ | — | — |

### Jobs (Phase 3+)

| Action | OWNER | ADMIN | MANAGER | FIELD | MEMBER |
|---|---|---|---|---|---|
| View job list | ✓ | ✓ | ✓ | (own) | — |
| View job detail | ✓ | ✓ | ✓ | (own) | — |
| Create job | ✓ | ✓ | ✓ | — | — |
| Edit job details | ✓ | ✓ | ✓ | — | — |
| Update job status | ✓ | ✓ | ✓ | (own) | — |
| Assign job manager | ✓ | ✓ | ✓ | — | — |
| Close job | ✓ | ✓ | ✓ | — | — |
| Delete job | ✓ | ✓ | — | — | — |
| Add field notes | ✓ | ✓ | ✓ | (own) | — |
| Upload photos | ✓ | ✓ | ✓ | (own) | — |
| View job costing | ✓ | ✓ | ✓ | — | — |

### Invoices (Phase 4+)

| Action | OWNER | ADMIN | MANAGER | FIELD | MEMBER |
|---|---|---|---|---|---|
| View invoice list | ✓ | ✓ | ✓ | — | — |
| View invoice detail | ✓ | ✓ | ✓ | — | — |
| Create invoice | ✓ | ✓ | ✓ | — | — |
| Edit draft invoice | ✓ | ✓ | ✓ | — | — |
| Send invoice | ✓ | ✓ | ✓ | — | — |
| Void invoice | ✓ | ✓ | — | — | — |
| Record manual payment | ✓ | ✓ | ✓ | — | — |
| Issue refund | ✓ | ✓ | — | — | — |
| View payment history | ✓ | ✓ | ✓ | — | — |

### Files and Assets (Phase 4+)

| Action | OWNER | ADMIN | MANAGER | FIELD | MEMBER |
|---|---|---|---|---|---|
| Upload file | ✓ | ✓ | ✓ | (own jobs) | — |
| View/download file | ✓ | ✓ | ✓ | (own jobs) | — |
| Delete file | ✓ | ✓ | ✓ | — | — |
| View signed contract | ✓ | ✓ | ✓ | — | — |

### Contracts (Phase 4+)

| Action | OWNER | ADMIN | MANAGER | FIELD | MEMBER |
|---|---|---|---|---|---|
| Send contract for signature | ✓ | ✓ | ✓ | — | — |
| Void contract | ✓ | ✓ | — | — | — |
| View contract status | ✓ | ✓ | ✓ | — | — |

### Reporting (Phase 5+)

| Action | OWNER | ADMIN | MANAGER | FIELD | MEMBER |
|---|---|---|---|---|---|
| View revenue reports | ✓ | ✓ | ✓ | — | — |
| View profitability reports | ✓ | ✓ | ✓ | — | — |
| View labor and field reports | ✓ | ✓ | ✓ | (own) | — |
| Export data | ✓ | ✓ | — | — | — |

---

## Implementation Notes

### Enforcement location

Permission checks must happen in server actions or API route handlers — never only in the UI. Client-side visibility guards (hiding buttons, disabling inputs) are a UX convenience, not a security control.

### Pattern for role guards

```typescript
// In server action
const { profile } = await requireRole('MANAGER');
// proceeds if MANAGER, ADMIN, or OWNER; throws for FIELD and MEMBER
```

### Pattern for ownership guards

For `(own)` cells (FIELD accessing their own assigned work):

```typescript
const { orgId, profile } = await requireUserProfile();

const job = await prisma.job.findFirst({
  where: {
    id: jobId,
    orgId,
    ...(profile.role === 'FIELD' ? { managerId: profile.id } : {}),
  },
});
if (!job) throw new Error('Not found');
```

Adjust the `assignedTo` or `managerId` filter based on the entity type.

### Financial mutation escalation

Any action that changes invoice totals, payment status, estimate approval state, or job contract value should require at minimum `MANAGER` role and write an audit log entry regardless of which role performs it.

### Client portal users

Client portal access is explicitly out of scope through Phase 4. When added, client portal users must be modeled as a separate identity layer with zero access to internal operational data, financial details of other customers, or audit logs.

---

## References

- `docs/02-architecture/auth-permissions.md` — role definitions
- `docs/06-build/phase-1-auth-tenant-core-plan.md` — requireRole implementation
- `docs/02-architecture/tenant-isolation-rules.md` — orgId enforcement
