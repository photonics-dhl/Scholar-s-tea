# Testing

> Current state: **No formal test framework** is configured in this project.

## Manual Testing

- Ad-hoc scripts in `scripts/test/` for API and integration checks.
- Example: `ai-api-test.mjs`, `paper-quality-test.mjs`, `test-prisma.js`.

## Future Addition

If tests are added, prefer **Vitest + React Testing Library** for unit tests and **Playwright** for E2E.

## Verification Gates (Current)

| Task Type | Check |
|-----------|-------|
| API / Frontend | `npm run lint` + `npm run typecheck` |
| Database | `npx prisma validate` |
| AI / RAG | Output format check, no credential leaks |
