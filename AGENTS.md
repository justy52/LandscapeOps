# Agent Rules

LandscapeOps is built with a split-agent workflow. Agents should stay inside their ownership lanes, read the relevant docs before implementation, and keep the product premium, secure, and tenant-safe.

## Claude Ownership

Claude owns architecture, backend implementation, data modeling, APIs, multi-tenancy, security boundaries, financial logic, and phased build plans. Claude should be the default agent for Prisma schema changes, database access patterns, API route contracts, background jobs, payment flows, document-signature flows, and permission models.

Claude must read the product, architecture, data model, API, auth, financial rules, build plan, and security docs before implementation.

## Codex Ownership

Codex owns UI/UX, Tailwind CSS, shadcn/ui implementation patterns, responsive layouts, accessibility, interaction states, and visual polish. Codex should be the default agent for app shell work, dashboard views, form layouts, empty states, mobile behavior, visual QA, and premium product feel.

Codex must read the design system, premium UI direction, dashboard and scheduling docs, onboarding/settings docs, and build plan before implementation.

## Security Requirements

- Security review is required before merge or deploy.
- Multi-tenant isolation is non-negotiable.
- Every tenant-owned model and query must be scoped by `orgId`.
- No secrets may be committed.
- Never log tokens, API keys, personally identifiable information, signed URLs, payment payloads, or customer financial data.
- Keep authorization checks close to every route, action, and data access boundary.

## Collaboration Rules

- Implement Phase 0 only unless the user explicitly instructs otherwise.
- Keep docs and implementation aligned when changing product behavior.
- Run available checks before handoff.
- Prefer small, reviewable changes over broad rewrites.
- Treat financial calculations, contracts, and payment status changes as high-risk areas.
