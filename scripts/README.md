# Scripts

This folder is reserved for repeatable operations that should be reviewed before use. Phase 0 does not include executable scripts yet.

Planned script categories:

- Database seed data for local demo organizations.
- Prisma maintenance helpers after the schema is stabilized.
- R2 file inventory and cleanup checks.
- Stripe webhook replay notes for local development.
- Data-quality reports for job costing and invoices.

Scripts must be idempotent where possible, document required environment variables, and avoid destructive defaults. Any script that touches production data must require an explicit environment flag and security review.
