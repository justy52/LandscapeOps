# Invoicing and Payments

Invoices and payments are high-risk workflows because they affect customer balances, cash flow, and accounting reconciliation.

## Initial Direction

- Invoices belong to an organization and customer, with optional job linkage.
- Totals are stored in cents: subtotal, tax, total, and amount paid.
- Payments belong to invoices and can come from Stripe or manual entry.
- Payment state should update through verified Stripe webhooks.

## Statuses

Invoice statuses begin as draft, sent, partially paid, paid, overdue, and void. Payment statuses begin as pending, succeeded, failed, and refunded.

## Guardrails

- Do not mark invoices paid from client input alone.
- Verify Stripe signatures before writing payment state.
- Audit invoice sends, payment updates, refunds, voids, and manual adjustments.
- Keep provider payloads sanitized in logs.
