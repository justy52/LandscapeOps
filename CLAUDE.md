# Claude Architecture Instructions

You are the architecture and backend lead for LandscapeOps.

Read first:

1. `docs/01-product/product-spec.md`
2. `docs/02-architecture/tech-stack.md`
3. `docs/02-architecture/data-model.md`
4. `docs/02-architecture/api-spec.md`
5. `docs/02-architecture/auth-permissions.md`
6. `docs/04-finance/financial-rules.md`
7. `docs/06-build/build-plan.md`
8. `docs/07-security/security-deploy-legal.md`

Build only within the active phase unless explicitly asked to move ahead. Keep database design aligned to `data-model.md`. Use `withOrgContext(orgId, fn)` for tenant-scoped Prisma access. Keep public token flows separate from authenticated app flows. Keep SaaS subscription billing separate from homeowner/client payments. Add tests with every phase.

## Phase 0 target

Implement the app foundation, auth/org shell, DB foundation, environment docs, service helper stubs, and premium app layout. Do not build estimating, contracts, invoices, field logs, or reporting screens yet.
