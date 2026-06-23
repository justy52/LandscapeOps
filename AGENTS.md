# LandscapeOps AI Agent Rules

This repo is built with a Claude + Codex workflow.

## Non-negotiables

1. Follow the docs in `docs/` as source of truth.
2. Do not invent product behavior that conflicts with the specs.
3. Preserve multi-tenant isolation in every data-access path.
4. Use the financial rules doc as the final authority for calculations.
5. Keep the UI premium, modern, mobile-first, and field-usable.
6. Every phase must satisfy its acceptance criteria before starting the next phase.
7. Never commit secrets, `.env`, credentials, API keys, or downloaded private customer files.

## Agent ownership

Claude owns architecture, data model, APIs, backend workflows, tenancy, and phase planning.
Codex owns UI/UX implementation, Tailwind/shadcn styling, responsive layouts, accessibility, and visual polish.
Security review owns auth, RLS, webhook validation, file access, payment boundaries, and secret handling.
