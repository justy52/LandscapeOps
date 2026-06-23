# Security, Deploy, and Legal

Security review is required before merge or deploy.

## Tenant Isolation

Multi-tenant isolation is non-negotiable. Every tenant-owned database query must include `orgId` from the active Clerk organization. Never rely on client-submitted `orgId` alone.

## Secrets

No secrets may be committed. Use environment variables for database URLs, Clerk keys, R2 credentials, Stripe keys, Dropbox Sign keys, Resend, Twilio, Inngest, Sentry, and PostHog.

## Webhooks

Verify signatures for Clerk, Stripe, Dropbox Sign, and any future webhook provider. Reject unsigned or stale requests. Store sanitized payload references only when needed.

## Files

R2 buckets should be private. Serve files through short-lived signed URLs and role checks. Signed contracts, invoices, and customer photos are sensitive.

## Legal and Financial

Contracts, signatures, invoices, payments, refunds, and tax settings require careful audit logs. Legal terms and customer-facing contract templates should be reviewed by qualified counsel before production use.
