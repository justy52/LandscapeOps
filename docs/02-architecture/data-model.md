# Data Model

The Phase 0 schema defines the core tenant-owned objects needed for CRM, estimating, production, billing, files, and audit history.

## Tenant Root

`Organization` maps to a Clerk organization. It owns user profiles, customers, leads, estimates, jobs, invoices, payments, files, and audit logs.

## Core Models

- `UserProfile` stores app role and display details for a Clerk user inside an organization.
- `Customer` stores residential, commercial, and property-management customer records.
- `Lead` tracks opportunities before they become estimates or jobs.
- `Estimate` tracks draft, sent, approved, declined, and expired pricing packages.
- `Job` tracks approved work through planning, scheduling, production, completion, and closeout.
- `Invoice` tracks billing totals, due dates, payment progress, and status.
- `Payment` tracks Stripe or manual payments against invoices.
- `FileAsset` stores metadata for R2 objects such as photos, plans, signed contracts, and invoices.
- `AuditLog` records important state changes and sensitive actions.

## Non-Negotiable Rule

All tenant-owned queries must include `orgId` from the authenticated Clerk organization. A record id alone is never enough. This applies to reads, writes, updates, deletes, search, exports, reports, files, and webhooks that map back into tenant data.
