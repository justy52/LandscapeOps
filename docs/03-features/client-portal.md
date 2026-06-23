# Client Portal

The client portal is deferred beyond Phase 0, but the data model should keep it in mind.

## Planned Capabilities

- View approved proposals and signed contracts.
- Review scheduled visits and job progress.
- Access selected photos and files.
- Pay invoices through Stripe.
- Submit questions, approvals, and change requests.

## Access Model

Client users should not share the same permission model as internal users. Portal access should be scoped to specific customer records, contacts, and visible files.

## Security Notes

Portal links, invitations, and document access must be short-lived or account-protected. Do not expose internal notes, margin, cost, or staff-only files to clients.
