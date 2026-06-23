# LandscapeOps

LandscapeOps is a modern, multi-tenant SaaS platform for landscaping companies. It is intended to become the single system of record from first lead through estimate, contract, scheduling, field operations, invoicing, payment tracking, reporting, and client portal workflows.

## Product direction

LandscapeOps should feel premium, expensive, and state-of-the-art. The UI should look like high-end field operations software: clean, fast, spacious, confident, mobile-first, and built for owners, office staff, estimators, crews, and subcontractors.

## Build stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma 5
- Neon PostgreSQL
- Clerk organizations/auth
- Cloudflare R2 file storage
- Stripe SaaS subscriptions
- Dropbox Sign contracts
- Resend email
- Twilio SMS
- Inngest background jobs
- Vercel deployment
- Sentry monitoring
- PostHog analytics

## Repo layout

```text
app/                  Next.js app routes
components/           Shared UI and layout components
lib/                  Server/client utilities
hooks/                React hooks
types/                Shared TypeScript types
prisma/               Prisma schema and migrations
scripts/              Setup, seed, and maintenance scripts
docs/                 Organized product/build documentation
prompts/              Claude/Codex handoff prompts
.github/              CI workflows and issue templates
```

## Documentation map

Start here:

1. `docs/01-product/product-spec.md` — product vision and operating principles
2. `docs/02-architecture/tech-stack.md` — required stack and architecture choices
3. `docs/02-architecture/data-model.md` — database/source-of-truth domain model
4. `docs/06-build/build-plan.md` — phased build sequence and acceptance criteria
5. `docs/05-design/premium-ui-direction.md` — premium visual direction for Codex/UI work
6. `docs/06-build/ai-build-workflow.md` — Claude/Codex build workflow
7. `docs/06-build/dev-handoff-playbook.md` — source handoff instructions

The original uploaded source docs are preserved in `docs/source/`.

## AI workflow

- Claude owns architecture, domain modeling, data flow, API contracts, multi-tenancy, and backend implementation plans.
- Codex owns UI/UX implementation, CSS/Tailwind polish, responsive behavior, accessibility, and front-end cleanup.
- Security review runs after each feature milestone before merge/deploy.

Use `CLAUDE.md`, `CODEX.md`, and `AGENTS.md` as the operating rules for AI agents.

## First milestone

Build Phase 0 from `docs/06-build/build-plan.md`:

- Next.js shell
- Clerk auth/org setup
- Prisma/Neon foundation
- tenant-safe query pattern
- base navigation
- premium dashboard placeholder
- `.env.example`
- CI checks
