# LandscapeOps

LandscapeOps is a premium SaaS operations platform for landscape contractors. It brings the full lifecycle of a landscape business into one polished workspace: leads, CRM, estimating, proposals, contracts, scheduling, field operations, subcontractors, photos and files, invoices, payments, reporting, job costing, and profitability.

The product direction is modern, mobile-first, and operationally serious. The app should feel expensive and calm: dark graphite/navy navigation, warm off-white work surfaces, muted landscape greens, brass accents, confident spacing, clear status color, and typography that works in the truck, office, and client meeting.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui conventions
- Prisma 5
- Neon PostgreSQL
- Clerk auth and organizations
- Cloudflare R2 for files and photos
- Stripe for payments
- Dropbox Sign for contracts
- Resend for email
- Twilio for SMS
- Inngest for background jobs
- Vercel hosting
- Sentry error monitoring
- PostHog product analytics

## Repo Layout

- `app/` - Next.js App Router routes, layout, and global styles.
- `components/` - reusable UI and shell components.
- `hooks/` - client hooks shared by UI components.
- `lib/` - utilities, constants, and service clients.
- `types/` - shared TypeScript domain types.
- `prisma/` - Prisma schema and database foundation.
- `docs/` - product, architecture, feature, design, finance, security, testing, and operations docs.
- `prompts/` - AI build and review prompts for Claude, Codex, and security review.
- `scripts/` - future operational scripts and command documentation.
- `.github/` - CI workflow and contribution templates.

## Docs Map

- Product: `docs/01-product/product-spec.md`, `docs/01-product/app-scope.md`
- Architecture: `docs/02-architecture/tech-stack.md`, `data-model.md`, `api-spec.md`, `auth-permissions.md`
- Features: CRM, estimating, contracts, job lifecycle, scheduling, field operations, client portal, reporting
- Finance: invoicing, payments, profitability rules, and financial guardrails
- Design: design tokens, premium UI direction, dashboard density, mobile-first polish
- Build: phased plan, AI workflow, and dev handoff playbook
- Security: deploy, legal, secret handling, tenant isolation, and pre-merge review
- Testing and operations: QA expectations, settings, onboarding, and admin workflows

## AI Workflow

LandscapeOps uses a split-agent workflow. Claude owns architecture, backend boundaries, Prisma, APIs, financial logic, multi-tenancy, and phased plans. Codex owns UI/UX implementation, Tailwind, shadcn-style components, responsive layout, accessibility, and visual polish.

Every substantial change should start by reading the relevant docs, updating the implementation within the current phase, running checks, and requesting security review before merge or deploy. Multi-tenant isolation is non-negotiable, and secrets must never be committed.

## Phase 0 Milestone

Phase 0 establishes the repo foundation:

- Next.js app shell with a premium dashboard preview.
- Tailwind and shadcn-compatible configuration.
- Prisma schema foundation for core tenant-owned models.
- Documentation for product, architecture, features, finance, design, security, testing, and operations.
- CI workflow for install, lint, typecheck, and build.

Phase 0 intentionally does not include real Clerk auth, production data access, Stripe payments, R2 uploads, or transactional workflows yet. Those belong to later phases after the architecture and security boundaries are reviewed.

## Local Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` for local development values. Do not commit `.env`, `.env.local`, API keys, credentials, or customer data.
