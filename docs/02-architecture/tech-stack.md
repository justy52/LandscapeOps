# Tech Stack

LandscapeOps uses a modern SaaS stack selected for strong developer velocity, managed infrastructure, and clean tenant boundaries.

## Application

- Next.js 14 App Router for routing, layouts, server components, and server actions.
- TypeScript for strict application contracts.
- Tailwind CSS and shadcn/ui conventions for consistent, accessible UI primitives.
- Vercel for hosting and preview deployments.

## Data and Auth

- Prisma 5 as the typed database layer.
- Neon PostgreSQL as the production database.
- Clerk auth and organizations as the identity and tenant source of truth.

## Integrations

- Cloudflare R2 for private file and photo storage.
- Stripe for invoices, payment collection, and webhook-driven payment state.
- Dropbox Sign for contracts and signed proposal documents.
- Resend for transactional email.
- Twilio for SMS notifications.
- Inngest for background jobs and retries.
- Sentry for error monitoring.
- PostHog for product analytics.

## Architecture Notes

All tenant-owned models include `orgId`. Server-side data access must derive `orgId` from the active Clerk organization and never from client-submitted input alone. Integrations that accept webhooks must verify signatures and write audit logs for state changes.
