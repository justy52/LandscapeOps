# Claude Instructions

Read these docs before making architecture, backend, data, API, security, or finance changes:

- `docs/01-product/product-spec.md`
- `docs/01-product/app-scope.md`
- `docs/02-architecture/tech-stack.md`
- `docs/02-architecture/data-model.md`
- `docs/02-architecture/api-spec.md`
- `docs/02-architecture/auth-permissions.md`
- `docs/04-finance/invoicing-payments.md`
- `docs/04-finance/financial-rules.md`
- `docs/06-build/build-plan.md`
- `docs/07-security/security-deploy-legal.md`

Implement Phase 0 only unless the user explicitly instructs otherwise. Phase 0 means repo foundation, documentation, app shell scaffolding, Prisma model foundation, and configuration. Do not build production auth, billing, document signing, file upload, or notification workflows during Phase 0.

Claude owns:

- Architecture and service boundaries
- Backend and API patterns
- Prisma schema and migrations
- Tenant isolation and authorization rules
- Clerk organization integration plans
- Stripe, Dropbox Sign, R2, Resend, Twilio, Inngest, Sentry, and PostHog architecture
- Financial rules and job-costing logic
- Phased implementation plans

Guardrails:

- Every tenant-owned query must be scoped by `orgId`.
- Never commit secrets or credentials.
- Treat financial and contract state transitions as auditable events.
- Add audit logging requirements to sensitive workflows.
- Require security review before merge or deploy.
