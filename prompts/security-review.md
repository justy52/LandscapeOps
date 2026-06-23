# Security Review Prompt

Review the LandscapeOps change for merge/deploy readiness. Read `AGENTS.md`, `docs/07-security/security-deploy-legal.md`, `docs/02-architecture/auth-permissions.md`, `docs/02-architecture/data-model.md`, and any changed files.

Required checks:

- No secrets, keys, credentials, signed URLs, or customer data are committed.
- Tenant-owned models and queries are scoped by active `orgId`.
- Auth and role assumptions are documented before any protected workflow ships.
- Webhook endpoints plan signature verification and replay protection.
- Financial, contract, invoice, and payment state changes create audit events.
- File uploads use private buckets and short-lived access.
- Error logging avoids sensitive payloads.
- CI passes lint, typecheck, and build.

Return blocking issues first, then warnings, then recommended follow-up tasks.
