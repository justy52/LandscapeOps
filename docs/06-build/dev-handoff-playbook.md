# Dev Handoff Playbook

Every handoff should explain what changed, why it changed, how it was checked, and what remains.

## Handoff Contents

- Summary of changed files.
- Phase and feature area.
- Data model or API changes.
- UI states added or changed.
- Checks run and results.
- Security concerns or review requests.
- Manual setup still required.

## Before Handoff

- Run formatting when practical.
- Run lint and typecheck.
- Run build before merge.
- Inspect git status.
- Confirm no `.env`, secrets, credentials, customer data, or local artifacts are staged.

## Review Focus

Reviewers should look closely at tenant scoping, permission checks, financial calculations, webhook verification, file access, mobile layout, and accessibility.
