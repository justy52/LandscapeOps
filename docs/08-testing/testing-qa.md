# Testing and QA

Testing should scale with risk. UI scaffolding needs lint, typecheck, build, and responsive review. Auth, finance, contracts, files, and webhooks require stronger coverage.

## Phase 0 Checks

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Visual review of the dashboard shell on mobile and desktop.

## Later Test Areas

- Tenant scoping helpers.
- Clerk organization sync.
- Role-based access control.
- Estimate and invoice calculations.
- Stripe webhook verification and idempotency.
- Dropbox Sign webhook status updates.
- R2 file permissions and signed URL expiry.
- Inngest retry behavior.

## QA Notes

Every feature should include empty, loading, success, error, and permission-denied states. Mobile layouts should be tested with real operational content lengths.
