<!-- AGENTS.md — Scholar's Tea Agent Guide -->

> AI coding assistant guide. Read this before any code change.

---

## 0. First Step — Read the Skill & Restore Context

1. **每次对话和任务开始前必须首先阅读此技能**：`.kimi/skills/superpowers-karpathy/SKILL.md`。融合 superpowers 工作流框架与 Karpathy 编码准则，确保在采取任何行动之前正确调用相关技能并遵循高质量编码原则。
2. **恢复跨会话上下文**：读取 `.claude/HANDOFF.md`，了解当前任务状态（目标、已完成、阻塞项、下一动作）。如 HANDOFF.md 为空，向用户说明并请求确认任务方向。
3. **读取自动化规则**：读取 `.claude/rules/handoff-automation.md`，确认 /clear 时的 handoff 流程。

---

## 1. Project Overview

**Scholar's Tea（学者茶话会）** is a full-stack academic community platform for research groups. It supports group profiles, hierarchical discipline boards, real-time chat, monthly voting, and an AI-powered workshop.

| Module | Route | What |
|--------|-------|------|
| Groups | `/groups` | Research group profiles, members, papers, patents |
| Disciplines | `/disciplines` | Hierarchical: discipline → sub-discipline → research direction |
| Top10 | `/top-questions` | Monthly community votes on hot questions |
| Tea Party | `/tea-party` | Socket.io real-time chat rooms |
| AI Workshop | `/workshop` | ZAI GLM-5.1 academic assistant with RAG knowledge base |
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
| Database | PostgreSQL 9.2.24 + pgvector | Production instance; schema targets PostgreSQL 16+ |
| ORM | Prisma | 5.14.x (root) / 5.22.x (server) |
| Cache | Redis | Optional, used for sessions / queues |
| Storage | MinIO | S3-compatible object storage |
| AI (primary) | ZAI (智谱 AI) | `glm-5.1` via env `ZAI_API_KEY` |
| AI (alt) | MiniMax API | `HERMES_MODEL=MiniMax-M2.7` via `MINIMAX_API_KEY` |
| AI (vision) | ZCHAT API | Multimodal: `gpt-5`, `claude-sonnet-4-5`, etc. via `ZCHAT_API_KEY` |
| AI (legacy) | Claude (Anthropic) | `CLAUDE_API_KEY` reserved; `claude-service.ts` wraps ZAI internally |
| Process Manager | PM2 | `ecosystem.config.js` |

### Design System

- **Fonts**: Crimson Pro (serif headings), Source Serif 4 (body), Inter (UI), JetBrains Mono (code).
- **Dual-track color system** in Tailwind:
  - `journal-*` — Academic zone (teal primary `#1A5F5C`, gold accent `#D4A853`).
  - `tea-*` — Social zone (mint primary `#6AB894`, orange accent `#E8924A`).
  - `convo-*` — Dialog system (blue `#6BA3D6`, blush `#E8A0A0`).
- CSS variables defined in `src/styles/globals.css` with dark-mode overrides.
- Use **semantic tokens only**; no hardcoded hex colors in components.
- Extensive Hermes avatar animations are defined in `tailwind.config.ts` (e.g., `hermes-float`, `hermes-breathe`, `hermes-dance`).

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
│   │   │   ├── ai/          # chat, extract-pdf, generate-image, knowledge, memory
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
│   │   │   ├── public-stats/
│   │   │   ├── tea-party/
│   │   │   ├── top-questions/
│   │   │   ├── upload/
│   │   │   ├── user/
│   │   │   └── workshop/
│   │   ├── layout.tsx       # Root layout (fonts, Live2D script, FloatingChat)
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── ui/              # shadcn base components — NO business logic (~18 components)
│   │   ├── features/        # Business components
│   │   │   ├── editor/
│   │   │   ├── groups/
│   │   │   ├── hermes/
│   │   │   ├── home/
│   │   │   ├── posts/
│   │   │   ├── search/
│   │   │   ├── tea-party/
│   │   │   └── workshop/
│   │   ├── forms/           # Form-specific components
│   │   ├── layout/          # Layout shells
│   │   └── providers/       # Global providers (NextAuth, QueryClient, etc.)
│   ├── lib/
│   │   ├── db/prisma.ts     # Prisma singleton — ALL DB ops go here
│   │   ├── auth/            # NextAuth config, providers, password utils
│   │   ├── ai/              # ZAI wrapper, RAG service, prompts, citation detector
│   │   │   ├── skills/      # AI skill engine (types, engine, index, paper-generation)
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
│   ├── schema.prisma        # 608 lines, ~30 models
│   └── seed.ts
├── scripts/
│   ├── admin/               # make-admin.ts
│   ├── build/               # build-start.sh, clean-rebuild.sh, fix-prisma.sh, simple-start.sh
│   ├── check/               # Health check scripts (app, nextjs, prisma, routes, server)
│   ├── deploy/              # Python/Shell deploy helpers
│   ├── start/               # start-nextjs.sh, full-restart.sh, restart-next.sh
│   ├── sync/                # Claude sync scripts (local/server bidirectional)
│   ├── test/                # Ad-hoc diagnostic scripts (no formal test framework)
│   └── auto-sync.sh         # Auto commit+push every 30 min to `develop`
├── tests/                   # Ad-hoc Playwright/manual test scripts + screenshots
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
├── next.config.js           # reactStrictMode, image remotePatterns, webpack undici external
├── playwright.config.js     # Minimal Playwright config for ad-hoc tests/ scripts
├── postcss.config.js        # tailwindcss + autoprefixer
├── tailwind.config.ts       # Design tokens, animations, fontFamily
├── package.json             # Root Next.js dependencies
└── .env.example             # Required env template (incomplete — see Section 11)
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
npx prisma migrate dev      # Dev migration (interactive)
npx prisma migrate deploy   # Production migration (non-interactive)
npx prisma db push          # Quick schema push (prototype / dev only)
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

### Testing

- **Unit tests**: **Vitest** + **React Testing Library** 已配置（`vitest.config.ts`）。
  - 运行: `npm run test`
  - 现有覆盖: `latex-to-utf8`, `peer-review-prompts`, `grant-application-prompts`
- **Ad-hoc scripts**: `tests/` 和 `scripts/test/` 保留手动诊断脚本（Playwright、API 测试等）。
- **E2E**: 尚未配置正式框架。如需添加，使用 **Playwright**。
- 生产部署不运行测试；CI/CD 尚未建立。

---

## 7. Database

### Connection Patterns

- **Next.js**: Prisma Client via `src/lib/db/prisma.ts` — global singleton prevents HMR connection exhaustion.
- **Socket server**: Native `pg` Pool via `server/src/db.ts` — bypasses Prisma for realtime performance.

### Core Models

The schema (`prisma/schema.prisma`, 608 lines) includes:

- **Auth**: `User`, `Account`, `Session`, `VerificationToken`
- **Org hierarchy**: `Institution`, `College`, `Department`
- **Groups**: `ResearchGroup`, `GroupMember`, `ScoreHistory`
- **Academic taxonomy**: `Discipline`, `GroupDiscipline`
- **Content**: `Post`, `Comment`, `Vote`, `TopTenVote`, `Tag`, `PostTag`
- **Research output**: `Publication`, `Citation`, `News`, `Patent`, `PostPublication`, `CommunityCitation`
- **Chat**: `TeaPartyRoom`, `TeaPartyRoomParticipant`, `Message`
- **RAG**: `KnowledgeDocument`, `ResearchMemory`
- **Admin**: `TopQuestion`, `QuestionVote`
- **Workshop**: `WorkshopSession`, `WorkshopMessage`

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

| Provider | Env Key | Use Case | Default Model |
|----------|---------|----------|---------------|
| **ZAI (智谱 AI)** | `ZAI_API_KEY` | **Primary** — Workshop chat, paper generation FastPath, vision, RAG, image generation | `glm-5.1` (754B MoE, 200K ctx) |
| MiniMax | `MINIMAX_API_KEY` | Hermes Gateway backend only (paper generation via skill routing) | `MiniMax-M2.7` |
| ZCHAT | `ZCHAT_API_KEY` | Fallback multimodal (images + text), vision models | `claude-sonnet-4-5` |
| Claude (Anthropic) | `CLAUDE_API_KEY` | Reserved for future use (not currently wired) | — |

> **Note**: ZAI GLM-5.1 是 2026-05 升级后的主力模型，支持 Thinking Mode、Tool Calling、Structured JSON Output。`claude-service.ts` 文件名是历史遗留，内部已迁移到 ZAI 调用（通过 `chatWithZAI` / `chatWithZAIStream` / `callZAIVision`）。MiniMax 仅作为 Hermes Gateway 的后端 provider。

### Dual-Path Paper Generation（论文生成双路径）

论文生成 (`paper_generation` action) 有两条调用路径，**默认走 Hermes Path**：

| 路径 | 入口 | System Prompt 注入 | 适用场景 |
|------|------|-------------------|----------|
| **Hermes Path** | `generatePaperViaHermes()` | 显式发送 `PAPER_GENERATION_SYSTEM_PROMPT` 作为 `system` message | 正常流程（默认） |
| **FastPath** | `generatePaper()` → `executeSkillStage()` | 通过 `skill.systemPrompt` 注入 | Hermes 超时 fallback |

**⚠️ 关键注意事项**：
- `callHermesGateway` / `callHermesGatewayStream` 的 `buildSystemPrompt()` 仅输出极简指令（`[Skill Mode: X]` + personality tag），**不包含** `PAPER_GENERATION_SYSTEM_PROMPT` 中的原创性铁律、写作风格、引用规范等完整约束。
- 因此 `generatePaperViaHermes` 必须在调用前**显式将 `PAPER_GENERATION_SYSTEM_PROMPT` 放入 messages[0]（system 角色）**，否则 AI 会退化为"整理/排版"模式，导致 verbatim copying。
- `callHermesGateway` 检测到 messages 中已存在 `system` 角色时，**不会**追加 `buildSystemPrompt()` 的输出（避免覆盖）。

### Formatting 阶段的 LaTeX 特例

System Prompt 全局规定"数学公式必须使用 UTF-8 Unicode 符号，禁止 LaTeX"，但 formatting 阶段需要输出 LaTeX/Markdown 格式（含 `$...$` / `$$...$$`）。

解决方案：`generatePaperViaHermes` 在 formatting 阶段的 user message 末尾追加：
```
【格式特例】本阶段允许使用 LaTeX 语法输出数学公式。
```

### Key Files

- `src/lib/ai/zai-service.ts` — **ZAI (GLM-5.1) API wrapper**，OpenAI-compatible protocol，支持 streaming、vision (`GLM-4.6V`)、image generation。
- `src/lib/ai/claude-service.ts` — Legacy filename，实际已迁移到 ZAI 调用。保留 `stripThinkBlocks`、重试逻辑、`ChatMessage` 类型定义。
- `src/lib/ai/hermes-gateway-adapter.ts` — Hermes Gateway 适配器。核心：`generatePaperViaHermes`、`peerReviewViaHermes`、`surveyGenerationViaHermes`。⚠️ **必须显式注入 System Prompt**（见上文 Dual-Path 说明）。
- `src/lib/ai/paper-generation-prompts.ts` — 五阶段 Prompt 模板（proposal/structure/writing/data/formatting），含 `PAPER_GENERATION_SYSTEM_PROMPT`、Few-shot 示例、原创性铁律。
- `src/lib/ai/peer-review-prompts.ts` — 审稿 Prompt 模板（7 维度评分 + 结构化输出）。
- `src/lib/ai/grant-application-prompts.ts` — 基金申请 Prompt 模板。
- `src/lib/ai/paper-enhancement.ts` — RAG 增强 + 引用验证。外部检索优先（Semantic Scholar/arXiv），社区论文库回退。
- `src/lib/ai/rag-service.ts` — 向量相似度搜索（`KnowledgeDocument`、`ResearchMemory`）。
- `src/lib/ai/external-paper-search.ts` — 外部学术数据库检索（Semantic Scholar、arXiv、Tavily）。
- `src/lib/ai/citation-detector.ts` / `citation-verifier.ts` — 引用检测与验证。
- `src/lib/ai/quality-review.ts` — 论文质量评审逻辑。
- `src/lib/ai/latex-to-utf8.ts` — LaTeX 公式转 UTF-8 Unicode 符号工具。
- `src/lib/ai/stream-think-filter.ts` — Streaming 响应中的 think block 过滤。
- `src/lib/ai/skills/engine.ts` — Skill 执行引擎（FastPath）。
- `src/lib/ai/skills/paper-generation.ts` — Skill 注册与参数定义。
- `src/lib/ai/agent-modes.ts` — Workshop 多 Agent 模式定义与行为配置。
- `hermes-home/hermes-agent/skills/research/research-paper-writing/SKILL.md` — Hermes Gateway 侧 skill 定义（107+ skills 之一）。

### RAG Storage

- Embeddings are stored as JSON text in `KnowledgeDocument.embedding` and `ResearchMemory.embedding` (OpenAI `text-embedding-3-small` format).
- pgvector is declared in the schema comment but the current embedding columns are plain `String?` / `String`; search is implemented via vector math in application code or Prisma raw queries.

---

## 10. Realtime (Socket.io)

- **Separate process**: `server/src/index.ts` runs on port `3001`.
- **CORS**: allows `localhost:3000`, `localhost:3002`, `10.72.212.33:3002`, `10.72.212.33:3005`, `scholars-tea.428312321.xyz`, `https://scholars-tea.428312321.xyz`.
- **Handlers**:
  - `room.ts` — room creation, joining, leaving, participant management.
  - `message.ts` — message broadcasting, history, typing indicators.
- **DB access**: uses `server/src/db.ts` (native `pg`) directly, not Prisma, to avoid connection overhead in realtime paths.

---

## 11. Deploy

> ⚠️ **CRITICAL ARCHITECTURE RULE**: The live application and Hermes backend run on a **REMOTE Linux server** (`10.72.212.33`, user `zju321`). Local Windows path `z:\321\DHL\Scholar's_Tea` is a **RaiDrive SFTP mount** pointing to `/data/home/zju321/321/DHL/Scholar's_Tea` on the server. Editing local files edits remote files directly, but **build and restart must happen on the server** (via SSH).

### File System Mapping

| Side | Path | Notes |
|------|------|-------|
| **Local (Windows)** | `z:\321\DHL\Scholar's_Tea` | RaiDrive SFTP mount of remote home dir |
| **Remote (Linux)** | `/data/home/zju321/321/DHL/Scholar's_Tea` | Actual files. Symbolic link `~/scholars` → here |
| **PM2 cwd** | `/data/home/zju321/scholars` | Via symlink |

**Write behavior**: Local edits write through to remote immediately.  
**Read behavior**: RaiDrive caches directory listings; remote-created files may not appear locally for a few minutes.

### SSH Access

```bash
# Use the SSH config alias (key: id_ed25519_dirac)
ssh ZJU-MSE-HPC

# Do NOT rely on bare IP; the alias is required for correct key auth.
```

### Deploy Steps (Code → Running)

Because local edits hit the remote filesystem directly, the deploy flow is:

```bash
# 1. Edit files locally (via z:\ drive) — they are already on the server

# 2. SSH to server and build
ssh ZJU-MSE-HPC
cd ~/scholars

# 3. Install deps if package.json changed
npm install
cd server && npm install && cd ..

# 4. Regenerate Prisma client if schema changed
npx prisma generate

# 5. Build Next.js (production)
npm run build

# 6. Build socket server
cd server && npm run build && cd ..

# 7. Restart PM2 processes
pm2 restart ecosystem.config.js
# or individually:
pm2 restart scholars-tea
pm2 restart scholars-tea-socket
```

### Hermes Gateway Restart

The Hermes Python gateway (`hermes gateway run`) is **not** managed by PM2. Restart manually if config changed:

```bash
ssh ZJU-MSE-HPC
# Find PID
ps aux | grep 'hermes gateway run'
# Kill and restart
kill <PID>
hermes gateway run > ~/hermes-home/logs/gateway.log 2>&1 &
```

### PM2 Config (`ecosystem.config.js`)

| App | Script | Port | Memory Limit |
|-----|--------|------|--------------|
| `scholars-tea` | `next start -p 3002` | 3002 | 1 GB |
| `scholars-tea-socket` | `server/dist/index.js` | 3001 | 512 MB |

### Required Environment Variables

> ⚠️ `.env.example` is **incomplete** — it does not list `ZAI_API_KEY`, but the application requires it at runtime (see `src/lib/ai/zai-service.ts`). Always verify `ecosystem.config.js` `forwardVars` array against actual code usage.

```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3002"
SOCKET_SERVER_URL="http://localhost:3001"

# Primary AI (ZAI / 智谱 AI)
ZAI_API_KEY="..."

# Legacy / reserved
CLAUDE_API_KEY="sk-..."

# Hermes Gateway backend
MINIMAX_API_KEY="..."
MINIMAX_BASE_URL="https://api.minimaxi.com/anthropic"

# Multimodal fallback
ZCHAT_API_KEY="..."
ZCHAT_BASE_URL="https://api.zchat.tech/v1"

# Object storage
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="scholars-tea"
S3_PUBLIC_URL="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

### Auto-sync (Server → GitHub)

- `scripts/auto-sync.sh` runs every 30 minutes via cron to commit and push **server-side** changes to the `develop` branch.
- This is a **backup mechanism**, not the primary deploy flow. Do not rely on it for code delivery.

### Two Gateway Processes (Do Not Confuse)

```
PID 30537  hermes gateway run          ← Scholar's Tea Hermes (MiniMax)
           Config: ~/scholars/hermes-home/config.yaml

PID 10274  openclaw-gateway            ← Separate project (OpenClaw)
           Config: ~/.openclaw/openclaw.json
```

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
- API keys (ZAI, MiniMax, ZCHAT, S3) are **env-only**; no hardcoding allowed.
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
- **PostgreSQL**: 9.2.24 (schema comments mention 16+ as a future goal).
- **Socket server**: `server/src/modules`, `plugins`, `services` are currently empty — all logic lives in `handlers/` + `middleware/`.
- **Tests**: Vitest + React Testing Library configured. 30 tests passing. Playwright config exists for ad-hoc manual scripts. No CI suite yet.
- **CI/CD**: None. Rely on `scripts/auto-sync.sh` + manual PM2 restart.
- **Hermes agent**: Not part of the Next.js build; it runs as a standalone Python/Node process using the config in `hermes-home/config.yaml`.
- **ZAI_API_KEY**: Required at runtime but missing from `.env.example`; always check `ecosystem.config.js` `forwardVars` and actual code usage when adding new environment variables.

---

> Updated: 2026-05-21
