# App Scope

LandscapeOps will be built in phases. Phase 0 creates the foundation and visible product direction without enabling production workflows.

## Phase 0 In Scope

- Repo structure and documentation.
- Next.js 14 App Router foundation.
- Tailwind and shadcn/ui-compatible setup.
- Premium dashboard shell preview.
- Prisma schema foundation for core models.
- Environment template for planned services.
- CI workflow for install, lint, typecheck, and build.

## Phase 0 Out of Scope

- Real Clerk authentication and organization switching.
- Live database reads or writes.
- R2 uploads and signed file access.
- Stripe payments and webhooks.
- Dropbox Sign contracts.
- Email, SMS, or Inngest automations.
- Production reporting calculations.

## Later Phase Direction

Phase 1 should establish Clerk auth, org-scoped database access, user profiles, protected routes, and seed data. Later phases should add CRM, estimating, job lifecycle, field workflows, billing, reporting, and client portal features in controlled increments.
