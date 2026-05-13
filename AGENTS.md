<!-- AGENTS.md — Scholar's Tea Agent Guide -->

> AI coding assistant guide. Read this before any code change.

---

## 0. First Step — Read the Skill

- **每次对话和任务开始前必须首先阅读此技能**：`.kimi/skills/superpowers-karpathy/SKILL.md`。融合 superpowers 工作流框架与 Karpathy 编码准则，确保在采取任何行动之前正确调用相关技能并遵循高质量编码原则。

---

## 1. Project Overview

**Scholar's Tea（学者茶话会）** is a full-stack academic community platform for research groups. It supports group profiles, hierarchical discipline boards, real-time chat, monthly voting, and an AI-powered workshop.

| Module | Route | What |
|--------|-------|------|
| Groups | `/groups` | Research group profiles, members, papers, patents |
| Disciplines | `/disciplines` | Hierarchical: discipline → sub-discipline → research direction |
| Top10 | `/top-questions` | Monthly community votes on hot questions |
| Tea Party | `/tea-party` | Socket.io real-time chat rooms |
| AI Workshop | `/workshop` | Claude API academic assistant with RAG knowledge base |
| Knowledge | `/knowledge` | RAG vector-store documents |
| Profile / Settings | `/profile`, `/settings` | User profiles and preferences |

Design inspirations: GitHub Organizations (groups), cc98/Reddit (discussions), Discord (chat), Notion (editor).

### Subprojects

| Directory | Tech | Purpose |
|-----------|------|---------|
| `server/` | Node.js + Socket.io v4 | Standalone realtime server (port 3001) |
| `hermes/` | YAML config + `.env` | Hermes AI agent configuration (MiniMax provider) |
| `hermes-home/` | YAML config + cron | Hermes agent runtime home, backups, gateway state |
| `optics_tracker/` | Python | Academic paper tracker (arXiv / Semantic Scholar) with Feishu card push |

---

## 2. Technology Stack

### Frontend

| Layer | Tech | Version |
|-------|------|---------|
| Framework | Next.js App Router | 14.2.35 |
| Language | TypeScript | 5.4.x (strict) |
| Styling | Tailwind CSS | 3.4.x |
| UI Base | shadcn/ui + Radix UI | — |
| Icons | Lucide React | 0.372.0 |
| State | Zustand | 4.5.x |
| Data Fetching | TanStack Query (React Query) | 5.28.x |
| Auth | NextAuth.js | 4.24.x |
| Editor | Tiptap | 2.3.x |
| Validation | Zod | 3.22.x |

### Backend

| Layer | Tech | Note |
|-------|------|------|
| API | Next.js API Routes | `src/app/api/v1/`, domain-subdirs |
| Realtime | Node.js + Socket.io v4 | `server/`, port 3001, separate process |
| Database | PostgreSQL 9.2.24 + pgvector | Unix socket in production |
| ORM | Prisma | 5.14.x (root) / 5.22.x (server) |
| Cache | Redis | Optional, used for sessions / queues |
| Storage | MinIO | S3-compatible object storage |
| AI | Claude API (primary) | `claude-sonnet-4-20250514` via env `CLAUDE_API_KEY` |
| AI (alt) | MiniMax API | `HERMES_MODEL=MiniMax-M2.7` via `MINIMAX_API_KEY` |
| AI (vision) | ZCHAT API | Multimodal: `gpt-5`, `claude-sonnet-4-5`, etc. via `ZCHAT_API_KEY` |
| Process Manager | PM2 | `ecosystem.config.js` |

### Design System

- **Fonts**: Crimson Pro (serif headings), Source Serif 4 (body), Inter (UI), JetBrains Mono (code).
- **Dual-track color system** in Tailwind:
  - `journal-*` — Academic zone (teal primary `#1A5F5C`, gold accent `#D4A853`).
  - `tea-*` — Social zone (mint primary `#6AB894`, orange accent `#E8924A`).
  - `convo-*` — Dialog system (blue `#6BA3D6`, blush `#E8A0A0`).
- CSS variables defined in `src/styles/globals.css` with dark-mode overrides.
- Use **semantic tokens only**; no hardcoded hex colors in components.

---

## 3. Project Structure

```
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, register, signin, signup
│   │   ├── (main)/          # Main site pages
│   │   │   ├── groups/
│   │   │   ├── disciplines/
│   │   │   ├── tea-party/
│   │   │   ├── tea-party/[roomId]/
│   │   │   ├── top-questions/
│   │   │   ├── workshop/
│   │   │   ├── knowledge/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── api/v1/          # REST API routes (domain subdirs)
│   │   │   ├── admin/
│   │   │   ├── ai/
│   │   │   ├── auth/
│   │   │   ├── citations/
│   │   │   ├── comments/
│   │   │   ├── disciplines/
│   │   │   ├── groups/
│   │   │   ├── hermes/
│   │   │   ├── institutions/
│   │   │   ├── knowledge/
│   │   │   ├── posts/
│   │   │   ├── publications/
│   │   │   ├── tea-party/
│   │   │   ├── top-questions/
│   │   │   ├── upload/
│   │   │   └── user/
│   │   ├── admin/           # Admin panel
│   │   ├── layout.tsx       # Root layout (fonts, Live2D script, FloatingChat)
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── ui/              # shadcn base components — NO business logic
│   │   ├── features/        # Business components
│   │   │   ├── groups/
│   │   │   ├── hermes/
│   │   │   ├── home/
│   │   │   ├── posts/
│   │   │   ├── search/
│   │   │   ├── tea-party/
│   │   │   ├── workshop/
│   │   │   └── editor/
│   │   ├── forms/           # Form-specific components
│   │   ├── layout/          # Layout shells
│   │   └── providers/       # Global providers (NextAuth, QueryClient, etc.)
│   ├── lib/
│   │   ├── db/prisma.ts     # Prisma singleton — ALL DB ops go here
│   │   ├── auth/            # NextAuth config, providers, password utils
│   │   ├── ai/              # Claude wrapper, RAG service, prompts, citation detector
│   │   │   ├── skills/      # AI skill engine (types, engine, paper-generation)
│   │   ├── socket/          # Socket.io client utilities
│   │   └── utils/           # cn(), sanitize, helpers
│   ├── services/            # Client-side business logic
│   ├── types/               # TypeScript definitions
│   └── styles/              # Global CSS
├── server/
│   ├── src/
│   │   ├── index.ts         # Entry point, port 3001
│   │   ├── db.ts            # Native pg Pool (bypasses Prisma for realtime)
│   │   ├── env.ts           # Env validation
│   │   ├── middleware/auth.ts # Socket JWT verification
│   │   └── handlers/        # room.ts, message.ts
│   ├── dist/                # Compiled output (`tsc`)
│   └── package.json
├── prisma/
│   ├── schema.prisma        # 569 lines, ~30 models
│   └── seed.ts
├── scripts/
│   ├── start/               # start-nextjs.sh, full-restart.sh, …
│   ├── deploy/              # Python/Shell deploy helpers
│   ├── check/               # Health check scripts
│   ├── build/               # build-start.sh, clean-rebuild.sh
│   ├── test/                # Ad-hoc test scripts (no formal framework yet)
│   └── auto-sync.sh         # Auto commit+push every 30 min to `develop`
├── docs/
│   ├── DEPLOYMENT.md        # Full deploy guide (Chinese)
│   ├── SERVER_DEPLOYMENT.md # Server env, Singularity, Nginx, Feishu bot
│   ├── FEISHU_BOT_ARCHITECTURE.md
│   ├── TOKEN_MONITORING.md
│   └── UI_PROGRESS.md
├── hermes/                  # Hermes AI agent configs
├── hermes-home/             # Hermes runtime home (cron, backups, gateway state)
├── optics_tracker/          # Python paper tracker
├── public/
│   ├── hermes/              # Hermes avatar assets
│   ├── live2d/              # Live2D model assets
│   └── uploads/             # User uploads
├── ecosystem.config.js      # PM2 config (Next.js port 3002, socket port 3001)
├── package.json             # Root Next.js dependencies
└── .env.example             # Required env template
```

**Key paths to remember:**
- `src/app/api/v1/` — All REST routes, grouped by domain.
- `src/components/ui/` — shadcn only, no business logic.
- `src/lib/db/prisma.ts` — Prisma singleton, required for all DB ops in Next.js.
- `server/src/handlers/` — Socket.io event handlers.
- `server/src/db.ts` — Native `pg` Pool for the socket server.

---

## 4. Commands

### Root (Next.js)

```bash
npm install
npm run dev          # Port 3000
npm run build        # Production build
npm run start        # Port 3002 (PM2)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run format       # Prettier: src/**/*.{ts,tsx,md}
```

### Database

```bash
npx prisma migrate dev      # Dev migration
npx prisma db push          # Quick schema push (prototype / dev)
npx prisma generate         # Regenerate Client
npx prisma studio           # GUI
npm run db:seed             # Seed (tsx prisma/seed.ts)
```

### Socket Server

```bash
cd server
npm install
npm run dev     # tsx watch, port 3001
npm run build   # tsc → dist/
npm run start   # node dist/index.js
```

### Production (PM2)

```bash
pm2 start ecosystem.config.js
pm2 logs scholars-tea
pm2 logs scholars-tea-socket
```

---

## 5. Code Style

### Lint & Format

- **ESLint**: `.eslintrc.json`, extends `next/core-web-vitals`.
  - Custom rules: `no-console: warn`, `react/no-unescaped-entities: off`.
- **Prettier**: `.prettierrc`
  - `semi: false`
  - `singleQuote: true`
  - `trailingComma: es5`
  - `printWidth: 100`
  - `tabWidth: 2`
  - Plugin: `prettier-plugin-tailwindcss`

### Naming Conventions

| Type | Case | Example |
|------|------|---------|
| React components | PascalCase | `ResearchGroupCard` |
| Functions / vars | camelCase | `calculateGroupScore` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Types / interfaces | PascalCase | `UserProfile` |
| DB tables / columns | snake_case | `research_group` |

### TypeScript

- `strict: true` enforced.
- Path alias `@/*` → `./src/*`.
- `moduleResolution: bundler`.

### Tailwind / CSS

- Use semantic color tokens (`journal-*`, `tea-*`, `convo-*`).
- No arbitrary hardcoded colors in JSX class names.
- Custom animations for the Hermes avatar are defined in `tailwind.config.ts`; prefer existing animation tokens before adding new ones.

### Git

- Branches: `feature/*`, `fix/*`, `refactor/*`, `docs/*`.
- Commits: Conventional Commits
  ```
  feat(groups): add scoring
  fix(discussion): sort comments
  refactor(api): auth middleware
  docs(readme): update
  ```

---

## 6. Testing

⚠️ **No formal test framework is configured.**

- `tests/` contains ad-hoc scripts and screenshots, but no Jest / Vitest / Playwright / Cypress setup.
- `scripts/test/` has diagnostic scripts (`ai-api-test.mjs`, `paper-quality-test.mjs`, `test-prisma.js`) for manual API and integration checks.
- If you add tests: start with **Vitest + React Testing Library** for unit tests and **Playwright** for E2E.

---

## 7. Database

### Connection Patterns

- **Next.js**: Prisma Client via `src/lib/db/prisma.ts` — global singleton prevents HMR connection exhaustion.
- **Socket server**: Native `pg` Pool via `server/src/db.ts` — bypasses Prisma for realtime performance.

### Core Models

The schema (`prisma/schema.prisma`, 569 lines) includes:

- **Auth**: `User`, `Account`, `Session`, `VerificationToken`
- **Org hierarchy**: `Institution`, `College`, `Department`
- **Groups**: `ResearchGroup`, `GroupMember`, `ScoreHistory`
- **Academic taxonomy**: `Discipline`, `GroupDiscipline`
- **Content**: `Post`, `Comment`, `Vote`, `TopTenVote`, `Tag`, `PostTag`
- **Research output**: `Publication`, `Citation`, `News`, `Patent`, `PostPublication`, `CommunityCitation`
- **Chat**: `TeaPartyRoom`, `TeaPartyRoomParticipant`, `Message`
- **RAG**: `KnowledgeDocument`, `ResearchMemory`
- **Admin**: `TopQuestion`, `QuestionVote`

### Migrations

```bash
npx prisma migrate dev --name <name>
npx prisma migrate deploy
npx prisma db seed
```

---

## 8. Auth & Authorization

- **NextAuth.js** with JWT strategy (`session.strategy: 'jwt'`).
- **OAuth providers** (optional, enabled via env): GitHub, Google, Feishu (Lark).
- **Credentials provider**: email + password with bcrypt hashing (`src/lib/auth/password.ts`).
- **Custom JWT/session callbacks** enrich the token/session with `id`, `name`, `bio`, `avatar`, `role`.
- **RBAC roles**: `USER`, `ADMIN`, `GROUP_ADMIN`.
- **Socket.io auth**: JWT verified via `socket.handshake.auth.token` in `server/src/middleware/auth.ts`.

---

## 9. AI & RAG Architecture

### Providers

| Provider | Env Key | Use Case |
|----------|---------|----------|
| MiniMax | `MINIMAX_API_KEY` | Primary academic assistant (Workshop), Hermes agent, paper enhancement |
| ZCHAT | `ZCHAT_API_KEY` | Fallback multimodal (images + text), vision models |
| Claude (Anthropic) | `CLAUDE_API_KEY` | Reserved for future use (not currently wired) |

### Key Files

- `src/lib/ai/claude-service.ts` — **MiniMax API wrapper** (legacy filename), stream handling, error recovery. Currently hardcodes `model: 'MiniMax-M2.7'`.
- `src/lib/ai/rag-service.ts` — Vector similarity search over `KnowledgeDocument` and `ResearchMemory`.
- `src/lib/ai/paper-enhancement.ts` — Paper quality scoring and improvement suggestions.
- `src/lib/ai/paper-generation-prompts.ts` — Prompt templates for academic writing.
- `src/lib/ai/peer-review-prompts.ts` — Peer review prompt templates.
- `src/lib/ai/citation-detector.ts` — Detects and verifies real-world citations in posts/comments.
- `src/lib/ai/agent-modes.ts` — Hermes personality / mode definitions.
- `src/lib/ai/skills/engine.ts` — AI skill engine for structured tool use.
- `src/lib/ai/skills/paper-generation.ts` — Paper generation skill implementation.

### RAG Storage

- Embeddings are stored as JSON text in `KnowledgeDocument.embedding` and `ResearchMemory.embedding` (OpenAI `text-embedding-3-small` format).
- pgvector is declared in the schema comment but the current embedding columns are plain `String?` / `String`; search is implemented via vector math in application code or Prisma raw queries.

---

## 10. Realtime (Socket.io)

- **Separate process**: `server/src/index.ts` runs on port `3001`.
- **CORS**: allows `localhost:3000`, `localhost:3002`, `10.72.212.33:3002`, `10.72.212.33:3005`, `scholars-tea.428312321.xyz`.
- **Handlers**:
  - `room.ts` — room creation, joining, leaving, participant management.
  - `message.ts` — message broadcasting, history, typing indicators.
- **DB access**: uses `server/src/db.ts` (native `pg`) directly, not Prisma, to avoid connection overhead in realtime paths.

---

## 11. Deploy

### Environment

- **OS**: CentOS 7 (`10.72.212.33`).
- **Node.js**: 20 LTS.
- **No Docker, no CI/CD** — fully manual deploy + PM2.

### Steps

1. Pull latest on server (`git pull`).
2. `npm install` (root + `cd server && npm install`).
3. `npx prisma generate` (migrate if schema changed).
4. `npm run build`.
5. `cd server && npm run build`.
6. `pm2 restart ecosystem.config.js` or `pm2 restart scholars-tea scholars-tea-socket`.

### PM2 Config (`ecosystem.config.js`)

| App | Script | Port | Memory Limit |
|-----|--------|------|--------------|
| `scholars-tea` | `next start -p 3002` | 3002 | 1 GB |
| `scholars-tea-socket` | `server/dist/index.js` | 3001 | 512 MB |

### Required Environment Variables

```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3002"
SOCKET_SERVER_URL="http://localhost:3001"
CLAUDE_API_KEY="sk-..."
MINIMAX_API_KEY="..."
ZCHAT_API_KEY="..."
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="scholars-tea"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Auto-sync

- `scripts/auto-sync.sh` runs every 30 minutes via cron to commit and push server-side changes to the `develop` branch.

---

## 12. Security

### Auth & Sessions
- NextAuth JWT sessions, 30-day expiry.
- SameSite cookies + CSRF token protection.
- Socket.io connections require valid JWT in handshake.

### Input & Data
- **All API params validated with Zod schemas** before processing.
- **SQL injection**: Prisma ORM only in Next.js; raw SQL in socket server uses parameterized queries via `pg`.
- **XSS**: React default escaping + DOMPurify-style sanitization (`src/lib/utils/sanitize.ts`).
- **File uploads**: MinIO S3-compatible storage, size limits enforced.

### Secrets
- `.env` is never committed (listed in `.gitignore`).
- API keys (Claude, MiniMax, ZCHAT, S3) are **env-only**; no hardcoding allowed.
- Verify no secrets leak before committing config changes.

---

## 13. Verification Gates

| Task Type | Gate |
|-----------|------|
| API / Frontend | `npm run lint` + `npm run typecheck` pass; response format matches API spec |
| Database | `npx prisma validate` pass; migrations pass `--dry-run` |
| AI / RAG | Output matches spec; no credential leaks; API key via env only |
| Config | No hardcoded secrets; `.local.json` files not in Git |
| Socket | `cd server && npm run build` succeeds; `dist/` is up-to-date |

---

## 14. Token Optimization Rules

> 实践验证：**禁止**引入 MCP 中间件/代理层做消息压缩（如 token-savior、entroly）。此类方案会增加进程间通信层，导致 MCP 堵塞与进程崩溃。以下策略全部基于工具调用行为规范，不引入额外依赖。

**核心原则：源头减量，精准读取，不增代理。**

### 硬性规则

| 规则 | 说明 |
|------|------|
| 限制读取范围 | `ReadFile` 必须携带 `n_lines`（默认 ≤ 100），超大文件禁止无限制全读。 |
| 先定位后读取 | 探索代码库时，先用 `Grep` / `Shell`（head/tail/findstr）定位，再用 `ReadFile` 精准读取目标片段。 |
| 强制并行 | 多个独立查询必须在一个响应内并行调用，禁止串行等待。 |
| 避免 Agent 滥用 | 简单查询（预计少于 3 步工具调用）禁止委派 `Agent`，避免上下文复制膨胀。 |
| 优先只读探索 | 优先使用 `Glob` / `Grep` 做只读扫描，而非递归 `ReadFile`。 |
| 分阶段清理 | 长任务必须用 `SetTodoList` 分阶段。每阶段完成后，不保留已完成阶段的详细中间结果。 |
| 按需加载 MCP | `mcp.json` 只保留当前任务必需的 server；不使用的 server 应临时注释或移除。 |
| 禁止中间件 | **严禁**使用任何在 MCP 协议层拦截、压缩、代理消息的工具或服务。 |

### 已废弃组件
- `.entroly/` — 已废弃，目录待清理，不再使用。
- `token-savior` — 已从 `mcp.json` 永久移除。

---

## 15. Limits & Notes

- **Node.js**: 20 LTS required in production.
- **PostgreSQL**: 9.2.24 (schema notes mention 16+ as a future goal).
- **Socket server**: `server/src/modules`, `plugins`, `services` are currently empty — all logic lives in `handlers/` + `middleware/`.
- **Tests**: None yet. Add Vitest + React Testing Library when needed.
- **CI/CD**: None. Rely on `scripts/auto-sync.sh` + manual PM2 restart.
- **Hermes agent**: Not part of the Next.js build; it runs as a standalone Python/Node process using the config in `hermes/config.yaml`.

---

> Updated: 2026-05-13
