# Auth and Permissions

Clerk is the identity provider and organization source of truth. LandscapeOps users operate inside an active Clerk organization that maps to `Organization.clerkOrgId`.

## Roles

Initial app roles:

- `OWNER` - account owner, billing control, security-sensitive settings.
- `ADMIN` - organization management and operational configuration.
- `MANAGER` - CRM, estimating, scheduling, jobs, invoices, and reports.
- `FIELD` - mobile field operations, assigned jobs, photos, notes, and punch lists.
- `MEMBER` - limited internal access for later refinement.

## Permission Rules

- Resolve active `orgId` server-side from Clerk.
- Never trust a client-submitted `orgId` without checking it against the active organization.
- Restrict financial, contract, payment, and settings mutations to approved roles.
- Field users should see only assigned or explicitly permitted work in later phases.
- Client portal users should be modeled separately before launch.

## Audit Requirements

Changes to roles, invoices, payments, contracts, estimates, job closeout, and file visibility should create audit log entries with actor, organization, entity, action, timestamp, and sanitized metadata.
