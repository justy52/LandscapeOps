# API Spec

Phase 0 does not ship production APIs, but future APIs should follow consistent route and server action conventions.

## Route Shape

- `/api/webhooks/clerk` for Clerk organization and user sync.
- `/api/webhooks/stripe` for payment and invoice status updates.
- `/api/webhooks/dropbox-sign` for contract signature status updates.
- `/api/inngest` for background job handlers.
- Protected app routes under the App Router for dashboard, CRM, estimates, jobs, schedule, field operations, invoices, reports, and settings.

## Server Actions

Server actions should validate auth, active organization, role, input schema, and tenant ownership before touching data. They should return typed results suitable for forms and avoid leaking database internals to clients.

## Response Expectations

- Use clear success and error states.
- Return stable ids and status fields.
- Avoid exposing secrets, provider payloads, or internal stack traces.
- Log auditable state transitions.

## Future Validation

Use structured validation before Phase 1 implementation. Financial values should be handled in cents, never floating point numbers, and any calculated totals should be reproducible from stored line items.
