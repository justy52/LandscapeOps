# Financial Rules

LandscapeOps should use conservative financial logic and preserve auditability.

## Money Handling

- Store money in integer cents.
- Avoid floating point math for money.
- Store tax, discount, markup, and margin assumptions explicitly.
- Keep calculated totals reproducible from source records.

## Margin and Job Costing

Estimated cost, actual cost, contract value, and margin variance should be clearly separated. Jobs should not hide whether margin is projected, committed, invoiced, or realized.

## State Changes

Estimate approvals, contract signatures, invoice sends, payment events, refunds, manual adjustments, and job closeout should create audit logs.

## Review Requirement

Any change to financial calculations, payment state, invoice totals, or profitability reports requires extra review and test coverage.
