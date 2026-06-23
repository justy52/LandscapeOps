# AI Build Workflow

LandscapeOps uses focused AI roles.

## Claude

Claude owns architecture, backend, data model, APIs, multi-tenancy, security boundaries, financial logic, and phased build planning.

## Codex

Codex owns UI/UX, Tailwind, shadcn implementation, responsive layouts, accessibility, visual polish, and frontend verification.

## Workflow

1. Read the relevant docs and agent instructions.
2. Confirm the current phase.
3. Implement only the requested scope.
4. Update docs if behavior or architecture changes.
5. Run lint, typecheck, build, and targeted checks.
6. Request security review before merge or deploy.

## Required Discipline

Do not commit secrets. Do not weaken tenant isolation. Do not ship financial or contract changes without audit and security review.
