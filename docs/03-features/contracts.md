# Contracts

Contracts formalize approved work and should integrate with Dropbox Sign after estimate approval.

## Initial Direction

- Contracts originate from approved estimates.
- Signed contract files should be stored as private R2 assets.
- Signature status should be updated through verified Dropbox Sign webhooks.
- Contract actions should create audit logs.

## Status Model

Planned statuses include draft, sent for signature, partially signed, signed, voided, and expired. A job should not move into active production without the correct contract or internal override policy.

## Security Notes

Contract documents can contain customer addresses, pricing, signatures, and legal terms. Access should be role-gated, org-scoped, and served with short-lived links.
