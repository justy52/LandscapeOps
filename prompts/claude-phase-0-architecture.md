# Claude Phase 0 Architecture Prompt

You are Claude working on LandscapeOps Phase 0. Read `AGENTS.md`, `CLAUDE.md`, and the product, architecture, data model, API, auth, finance, build, and security docs before writing code.

Your job is to validate and improve the foundation without moving past Phase 0. Focus on:

- Multi-tenant domain boundaries and `orgId` enforcement.
- Prisma model correctness and future migration safety.
- API route and server action shape for later phases.
- Clerk organization mapping and role strategy.
- Financial and audit-log guardrails.
- Deployment, secret, and webhook security assumptions.

Do not implement production auth, payments, document signing, R2 uploads, or notifications unless the user explicitly expands the phase. Leave clear notes for later phases when a design decision is intentionally deferred.
