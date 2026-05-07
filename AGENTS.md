# Scholar's Tea — Agent Guide

> AI coding assistant guide. Read this before any code change.

---

## 可用 SKILL（第一优先级）

- 每次对话和任务开始前必须首先阅读此技能。融合 superpowers 工作流框架与 Karpathy 编码准则，确保在采取任何行动之前正确调用相关技能并遵循高质量编码原则：[superpowers-karpathy](.kimi/skills/superpowers-karpathy/SKILL.md)

---


## 1. Project

Scholar's Tea = fullstack academic community for research groups. Features:

| Module | Route | What |
|--------|-------|------|
| Groups | `/groups` | Group profiles, members, papers, patents |
| Disciplines | `/disciplines` | Hierarchical: discipline → sub-discipline → board |
| Top10 | `/top-questions` | Monthly community votes |
| Tea Party | `/tea-party` | Socket.io real-time chat |
| AI Workshop | `/workshop` | Claude API academic assistant + RAG |

Design refs: GitHub Orgs (groups), cc98/Reddit (discussions), Discord (chat), Notion (editor).

---

## 2. Stack

**Frontend**

| Layer | Tech | Version |
|-------|------|---------|
| Framework | Next.js App Router | 14.2.x |
| Lang | TypeScript | 5.4.x |
| Style | Tailwind CSS | 3.4.x |
| UI | shadcn/ui + Radix | — |
| Icons | Lucide React | — |
| State | Zustand | 4.5.x |
| Data | TanStack Query | 5.28.x |
| Auth | NextAuth.js | 4.24.x |
| Editor | Tiptap | 2.3.x |
| Validate | Zod | 3.22.x |

**Backend**

| Layer | Tech | Note |
|-------|------|------|
| API | Next.js API Routes | `src/app/api/v1/` |
| Realtime | Node.js + Socket.io v4 | `server/`, port 3001 |
| DB | PostgreSQL 9.2.24 + pgvector | Unix Socket |
| ORM | Prisma | 5.14.x (root) / 5.22.x (server) |
| Cache | Redis | Optional |
| Storage | MinIO | S3-compatible |
| AI | Claude API | `claude-sonnet-4-20250514` |
| Process | PM2 | `ecosystem.config.js` |

---

## 3. Structure

```
src/
  app/
    (auth)/          # Login, register
    (main)/          # Main site
      groups/        # Group center
      disciplines/   # Academic boards
      tea-party/     # Realtime chat
      top-questions/ # Voting
      workshop/      # AI assistant
    api/v1/          # REST API
    admin/           # Admin panel
  components/
    ui/              # shadcn base — NO business logic
    features/        # Business components
    layout/          # Layouts
    providers/       # Global providers
  lib/
    db/prisma.ts     # Prisma singleton — ALL DB ops go here
    auth/            # NextAuth config
    ai/              # Claude API wrapper
    socket/          # Socket.io client
    utils/           # Utilities
  services/          # Client business logic
  types/             # TS definitions
  styles/            # Global CSS

server/
  src/
    index.ts         # Entry, port 3001
    db.ts            # Native pg Pool
    middleware/auth.ts  # Socket JWT
    handlers/        # Event handlers

prisma/
  schema.prisma      # 29 tables, 565 lines
  seed.ts            # Seed data

scripts/             # Ops scripts
  build/ check/ deploy/ start/ sync/
  test/              # Health checks
  *.py               # Patch/data scripts

docs/                # Documentation
  DEPLOYMENT.md
  SERVER_DEPLOYMENT.md
  FEISHU_BOT_ARCHITECTURE.md
  TOKEN_MONITORING.md
  UI_PROGRESS.md

optics_tracker/      # Python paper tracker subproject
hermes/ & hermes-home/  # AI agent configs + cron
.claude/             # IDE config, skills, memory
.entroly/            # [已废弃] 原 context compression engine，已清理停用
```

**Key paths:**
- `src/app/api/v1/` — All REST routes, domain-subdirs
- `src/components/ui/` — shadcn only, no business logic
- `src/lib/db/prisma.ts` — Prisma singleton, required for all DB ops
- `server/src/handlers/` — Socket.io handlers

---

## 4. Commands

**Root (Next.js)**

```bash
npm install
npm run dev          # Port 3000
npm run build        # Production build
npm run start        # Port 3002 (PM2)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run format       # Prettier
```

**DB**

```bash
npx prisma migrate dev      # Dev migration
npx prisma db push          # Quick schema push
npx prisma generate         # Regenerate Client
npx prisma studio           # GUI
npm run db:seed             # Seed (tsx prisma/seed.ts)
```

**Socket Server**

```bash
cd server
npm install
npm run dev     # tsx watch, port 3001
npm run build   # tsc → dist/
npm run start   # node dist/index.js
```

**Production (PM2)**

```bash
pm2 start ecosystem.config.js
pm2 logs scholars-tea
```

---

## 5. Code Style

**Lint**
- ESLint: `.eslintrc.json`, extends `next/core-web-vitals`
- Custom: `no-console: warn`, `react/no-unescaped-entities: off`

**Prettier** (`.prettierrc`)
- `semi: false` — No semicolons
- `singleQuote: true`
- `trailingComma: es5`
- `printWidth: 100`
- `tabWidth: 2`
- Plugin: `prettier-plugin-tailwindcss`

**Naming**

| Type | Case | Example |
|------|------|---------|
| React components | PascalCase | `ResearchGroupCard` |
| Functions/vars | camelCase | `calculateGroupScore` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Types/interfaces | PascalCase | `UserProfile` |
| DB tables/columns | snake_case | `research_group` |

**TypeScript**
- `strict: true`
- Path alias `@/*` → `./src/*`
- `moduleResolution: bundler`

**Color Tokens** (`tailwind.config.ts`)
- `journal-*` — Academic zone (gold accent)
- `tea-*` — Social zone (primary, accent, mint, bg)
- `convo-*` — Dialog system (blue, blush)
- Use semantic tokens. No hardcoded colors.

**Git**
- Branches: `feature/*`, `fix/*`, `refactor/*`, `docs/*`
- Commits: Conventional Commits
  ```
  feat(groups): add scoring
  fix(discussion): sort comments
  refactor(api): auth middleware
  docs(readme): update
  ```

---

## 6. Tests

⚠️ No test framework configured. `tests/` empty.
No Jest/Vitest/Playwright/Cypress installed.
If adding tests: start with Vitest + React Testing Library.

---

## 7. Database

**Connection**
- Next.js: Prisma Client (`src/lib/db/prisma.ts`) — global singleton prevents HMR connection exhaustion
- Socket server: Native `pg` Pool (`server/src/db.ts`) — bypasses Prisma for realtime

**Core Models (29 tables)**
- `User`, `Account`, `Session` — NextAuth
- `Institution`, `College`, `Department` — Org hierarchy
- `ResearchGroup`, `GroupMember`, `ScoreHistory` — Groups
- `Discipline`, `GroupDiscipline` — Academic taxonomy
- `Post`, `Comment`, `Vote`, `TopTenVote` — Content
- `Publication`, `Citation`, `News`, `Patent` — Research output
- `TeaPartyRoom`, `TeaPartyRoomParticipant`, `Message` — Chat
- `KnowledgeDocument`, `ResearchMemory` — RAG vector DB

**Migrations**
```bash
npx prisma migrate dev --name <name>
npx prisma migrate deploy
npx prisma db seed
```

---

## 8. Deploy

Manual deploy + PM2 on CentOS 7 (`10.72.212.33`). No CI/CD, no Docker.

**Steps**
1. Pull latest on server
2. `npm install`
3. `npx prisma generate` (migrate if schema changed)
4. `npm run build`
5. `pm2 restart scholars-tea`
6. If socket changed: `cd server && npm run build && pm2 restart <socket-app>`

**Key files**
- `ecosystem.config.js` — PM2 config (port 3002, mem limit 1G)
- `scripts/start/start-server.sh` — One-liner startup
- `scripts/auto-sync.sh` — Auto commit+push every 30min to `develop`

**Required env** (see `.env.example`)
```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3002"
SOCKET_SERVER_URL="http://localhost:3001"
CLAUDE_API_KEY="sk-..."
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="scholars-tea"
```

---

## 9. Security

**Auth**
- NextAuth.js + JWT
- OAuth: GitHub, Google, 飞书 + email/password
- RBAC: `USER`, `ADMIN`, `GROUP_ADMIN`
- Socket.io JWT via `socket.handshake.auth.token`

**Input & Data**
- All API params validated with **Zod Schema**
- SQL injection: **Prisma ORM only**, no raw SQL拼接
- XSS: React default escaping + CSP
- CSRF: SameSite Cookie + CSRF Token

**Secrets**
- `.env` never committed
- API keys (Claude, S3) via env vars only, no hardcoding
- Verify no secrets before committing config changes

---

## 10. Verification Gates

| Task Type | Gate |
|-----------|------|
| API / Frontend | `npm run lint` + `npm run typecheck` pass; response format matches spec |
| Database | `npx prisma validate` pass; migrations pass `--dry-run` |
| AI / RAG | Output matches spec; no credential leaks; API key via env only |
| Config | No hardcoded secrets; `.local.json` files not in Git |

---

## 11. Token Optimization

> 实践验证：**禁止**引入 MCP 中间件/代理层做消息压缩（如 token-savior、entroly）。此类方案会增加进程间通信层，导致 MCP 堵塞与进程崩溃。以下策略全部基于工具调用行为规范，不引入额外依赖。

**核心原则：源头减量，精准读取，不增代理。**

**硬性规则**

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

**已废弃组件**
- `.entroly/` — 已废弃，目录待清理，不再使用。
- `token-savior` — 已从 `mcp.json` 永久移除。

---

## 12. Limits

- Node.js 20 LTS (production)
- PostgreSQL 9.2.24 (schema notes say 16+ = future goal)
- Socket server: `server/src/modules`, `plugins`, `services` empty — all logic in `handlers/` + `middleware/`
- No tests yet
- No CI/CD — manual scripts + PM2 only

---

> Updated: 2026-05-06
