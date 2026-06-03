# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Scholar's Tea** — full-stack academic community platform. Next.js 14 App Router + PostgreSQL 16 + pgvector + Socket.io + ZAI GLM-5.1 AI.

Detailed docs: `AGENTS.md` | Current task state: `.claude/HANDOFF.md` | Rules: `.claude/rules/`

## Commands

```bash
# Dev
npm run dev              # Next.js dev server, port 3000
npm run build            # Production build (copies pdfjs worker)
npm run start            # Production, port 3002

# Quality gates — run before committing
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit

# Tests
npm run test             # vitest run
npm run test:watch       # vitest --watch

# Database
npx prisma migrate dev --name <name>   # Dev migration
npx prisma migrate deploy              # Production migration
npx prisma generate                    # Regenerate client after schema change
npm run db:seed                        # Seed data

# Socket server (separate process)
cd server && npm run dev               # tsx watch, port 3001
cd server && npm run build             # tsc → dist/

# Production (on server via SSH)
pm2 restart ecosystem.config.js        # Restart all 3 processes
```

## Architecture

```
src/app/(auth)/         → Login, register
src/app/(main)/         → All page routes (groups, disciplines, tea-party, workshop, knowledge, profile, settings)
src/app/api/v1/         → REST API routes, domain subdirs (ai/, groups/, posts/, knowledge/, hermes/, etc.)
src/components/ui/      → shadcn base — NO business logic allowed
src/components/features/→ Business components (editor, groups, hermes, workshop, tea-party, etc.)
src/lib/db/prisma.ts    → Prisma singleton — ALL Next.js DB ops must use this
src/lib/ai/             → ZAI wrapper, RAG service, paper generation, citation tools
src/lib/ai/skills/      → AI skill engine (types, engine, registration)
src/lib/personal-kb/    → PDF extraction, chunking, embedding, storage
src/lib/auth/           → NextAuth config, providers, password utils
server/src/             → Standalone Socket.io server (port 3001)
server/src/db.ts        → Native pg Pool (bypasses Prisma for realtime perf)
prisma/schema.prisma    → ~30 models (547 lines)
```

### Critical patterns

- **Dual DB access**: Next.js uses Prisma (`src/lib/db/prisma.ts`); Socket server uses raw `pg` (`server/src/db.ts`). Changes to schema must work with both.
- **AI naming gotcha**: `claude-service.ts` is a **legacy filename** — it wraps ZAI GLM-5.1, not Anthropic Claude. New code should import from `zai-service.ts`.
- **pgvector queries**: Embeddings are `Unsupported("vector")` in Prisma. Raw SQL uses `(embedding <=> vec)::double precision` — the `::double precision` cast is mandatory (pg `real` type deserializes to `null` in Node.js).
- **Embedding pipeline**: Local BGE-M3 (port 9997) → fallback to ZCHAT API. `generateEmbedding()` in `rag-service.ts` handles this.
- **Paper generation dual-path**: Hermes Path (default) vs FastPath (fallback). Hermes path requires explicit `PAPER_GENERATION_SYSTEM_PROMPT` injection as system message.
- **Build step copies pdfjs worker**: `npm run build` runs `cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdfjs/`. If pdfjs-dist is upgraded, verify this path.

### Deploy model

Local Windows (`z:\321\DHL\Scholar's_Tea`) is a **RaiDrive SFTP mount** of remote server (`/data/home/zju321/321/DHL/Scholar's_Tea`). Local edits write through immediately. **Build and restart must happen on server** via `ssh ZJU-MSE-HPC`. No local build needed.

PM2 runs 3 processes: Next.js (3002), Socket.io (3001), Embedding server (9997).

### Design system

Tailwind semantic tokens only — `journal-*` (academic teal/gold), `tea-*` (social mint/orange), `convo-*` (dialog blue/blush). No hardcoded hex in JSX.

### Code style

- Prettier: `semi: false`, `singleQuote: true`, `trailingComma: es5`, `printWidth: 100`
- ESLint: `no-console: warn`
- Path alias: `@/*` → `./src/*`
- Conventional Commits: `feat(scope):`, `fix(scope):`, `refactor(scope):`
- TypeScript strict mode

## Session protocol

1. **Boot**: Read `.claude/HANDOFF.md` → report current task state to user
2. **Before /clear**: Update HANDOFF.md task table + archive to `.claude/sessions/`. Get user confirmation first.
3. **Token discipline**: Read ≤100 lines at a time. Grep/Glob before Read. Parallel independent calls.

## Verification

| Type | Command |
|------|---------|
| API / Frontend | `npm run lint && npm run typecheck` |
| Database | `npx prisma validate` |
| Socket server | `cd server && npm run build` |
