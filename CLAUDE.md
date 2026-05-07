# Scholar's Tea - Claude Code 项目配置

## Compact Instructions

> 每次 Session 启动时优先执行以下指令：

1. **Session 长度控制**：轮数 > 20 / 时间 > 30min / Input > 5M → 立即 `/compact`
2. **大文件处理**：禁止直接 `Read` >200 行文件；优先用 `Agent` 探索或 `Grep` 提取
3. **缓存保护**：Session 中禁止修改 `CLAUDE.md`、`.claudeignore`、`settings.json`
4. **MCP 精简**：当前 9 个服务器，禁止添加新服务器除非移除旧的
5. **环境变量保护**：禁止修改 `.env` 文件；API key 仅通过 env 获取
6. **验证 gates**：API 任务 → `npm run lint && npm run typecheck`；DB 任务 → `npx prisma validate`
7. **记忆写入**：工具 Bug → memory | SOP → skills | 项目事实 → CLAUDE.md

---

## 项目概览

- **名称**: Scholar's Tea (学者茶话会)
- **类型**: 全栈 Web 应用 (Next.js + Fastify)
- **技术栈**:
  - 前端: Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui
  - 后端: Node.js/Bun, Fastify, PostgreSQL + pgvector
  - AI: Claude API, LangChain.js, RAG
  - 实时: Socket.io
  - 存储: MinIO (S3兼容)
- **团队规模**: 4-6 人
- **代码仓库**: 本地 Git 仓库

---

## 项目结构

```
Scholar's_Tea/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 认证页面
│   │   ├── (main)/            # 主站页面
│   │   │   ├── groups/        # 课题组
│   │   │   ├── disciplines/   # 学科社区
│   │   │   ├── top-questions/ # TOP10
│   │   │   ├── tea-party/     # 茶话会
│   │   │   └── workshop/      # 思想工坊
│   │   ├── api/               # API 路由 (也可用 BFF 架构)
│   │   └── admin/             # 管理后台
│   ├── components/
│   │   ├── ui/                # shadcn/ui 组件
│   │   ├── forms/             # 表单组件
│   │   ├── layout/            # 布局组件
│   │   └── features/          # 业务组件
│   ├── lib/
│   │   ├── db/                # 数据库客户端
│   │   ├── ai/                # AI 服务封装
│   │   ├── auth/              # 认证逻辑
│   │   ├── socket/            # WebSocket 服务
│   │   └── utils/             # 工具函数
│   ├── services/              # 业务逻辑层
│   ├── types/                 # TypeScript 类型
│   └── styles/                # 全局样式
├── packages/
│   └── shared/                # 共享类型和工具
├── server/                    # 独立后端服务 (可选 BFF)
│   ├── src/
│   │   ├── modules/           # Fastify 模块
│   │   ├── plugins/           # 插件
│   │   └── services/          # 服务层
│   └── prisma/               # 数据库 schema
├── scripts/                   # 脚本
├── tests/                     # 测试
├── docs/                      # 文档
└── .claude/                   # Claude Code 配置
```

---

## 开发规范

### 服务器文件架构（强制）

**安装/下载必须分类存放，禁止在 `$HOME` 根目录散落文件**：
- 第三方软件 → `~/softwares/<category>/`
- 文档资料 → `~/docs/<category>/`
- 下载后立即删除 `.tar.gz`、`.zip` 等安装包

### Git 工作流

- **分支命名**:
  - `feature/<功能名>`
  - `fix/<问题描述>`
  - `refactor/<模块名>`
  - `docs/<文档类型>`

- **Commit 格式** (Conventional Commits):
  ```
  feat(groups): 添加课题组评分功能
  fix(discussion): 修复评论排序问题
  refactor(api): 重构用户认证中间件
  docs(readme): 更新项目说明
  ```

- **PR 要求**:
  - 至少 1 人 review
  - CI/CD 检查通过
  - 无 merge conflicts

### 代码风格

- **TypeScript**: 严格模式 (`strict: true`)
- **ESLint**: 基于 `eslint-config-next` + `eslint-config-prettier`
- **Prettier**: 单引号、尾逗号、分号
- **命名规范**:
  - 组件: PascalCase (e.g., `ResearchGroupCard`)
  - 工具函数: camelCase (e.g., `calculateGroupScore`)
  - 常量: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
  - 类型/接口: PascalCase (e.g., `UserProfile`)

### API 设计

- RESTful 风格
- 统一响应格式:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "meta": { "page": 1, "total": 100 }
  }
  ```
- 错误码: `4xx` (客户端错误), `5xx` (服务端错误)
- 版本化: `/api/v1/`, `/api/v2/`

### 数据库

- **ORM**: Prisma
- **迁移**: `prisma migrate dev`
- **种子数据**: `prisma/seed.ts`
- **命名**: snake_case (表名、列名)

### 测试要求

| 层级 | 工具 | 覆盖率目标 |
|------|------|------------|
| 单元测试 | Vitest / Jest | ≥ 70% |
| 集成测试 | Vitest + Testcontainers | 核心流程 |
| E2E 测试 | Playwright | 用户关键路径 |

---

## 环境设置

### 必需的环境变量

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/scholars_tea"

# Redis
REDIS_URL="redis://localhost:6379"

# MinIO / S3
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="scholars-tea"

# AI
CLAUDE_API_KEY="sk-..."
AI_MODEL="claude-sonnet-4-20250514"

# Auth
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Socket.io
SOCKET_SERVER_URL="http://localhost:3001"
```

### 启动命令

```bash
# 安装依赖
npm install

# 数据库迁移
npm run db:migrate

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 代码检查
npm run lint
npm run typecheck
```

---

## 常用命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 检查 |
| `npm test` | 运行测试 |
| `npm run test:e2e` | E2E 测试 |
| `npm run db:migrate` | 数据库迁移 |
| `npm run db:push` | 推送 schema (开发用) |
| `npm run db:seed` | 种子数据 |
| `npm run db:studio` | Prisma Studio |
| `npm run format` | 代码格式化 |

---

## 关键功能模块

### 1. 课题组系统 (groups)

**核心页面**:
- `/groups` - 课题组列表
- `/groups/[id]` - 课题组主页
- `/groups/[id]/publications` - 论文列表
- `/groups/[id]/settings` - 设置 (仅管理员)

**核心 API**:
- `GET /api/v1/groups` - 列表
- `GET /api/v1/groups/:id` - 详情
- `POST /api/v1/groups` - 创建
- `PATCH /api/v1/groups/:id` - 更新
- `DELETE /api/v1/groups/:id` - 删除

### 2. 学科社区 (disciplines)

**层级**: 学科 → 二级学科 → 研究方向 → 讨论板块

**核心页面**:
- `/disciplines` - 学科树
- `/disciplines/[id]` - 学科详情 + Top10 课题组
- `/disciplines/[id]/posts` - 讨论帖

### 3. TOP10 问题

**核心页面**: `/top-questions`
**核心功能**: 月度投票、优质回答高亮

### 4. Tea Party (实时聊天)

**技术**: Socket.io + 房间隔离
**核心页面**: `/tea-party`, `/tea-party/[id]`

### 5. 思想工坊 (AI)

**技术**: Claude API + RAG
**核心页面**: `/workshop`

---

## AI 服务集成

### Claude API 使用规范

```typescript
// 使用封装层
import { claudeService } from '@/lib/ai/claude';

const summary = await claudeService.summarize({
  content: paperContent,
  maxTokens: 1000,
});

const analysis = await claudeService.analyzeIdea({
  description: userIdea,
  context: relevantPapers,
});
```

### RAG 知识库

- 使用 pgvector 存储 embeddings
- 支持按学科领域分离知识库
- 定期更新 + 增量索引

---

## WebSocket 事件 (Tea Party)

```typescript
// 事件类型
type TeaPartyEvent =
  | 'room:join'
  | 'room:leave'
  | 'message:send'
  | 'message:receive'
  | 'screen:share:start'
  | 'screen:share:stop'
  | 'user:typing';
```

---

## 性能目标

| 指标 | 目标 |
|------|------|
| Lighthouse Score | ≥ 90 |
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| API Response (p95) | < 200ms |
| WebSocket Latency | < 100ms |

---

## 安全规范

- **认证**: NextAuth.js + JWT
- **授权**: RBAC (user, admin, group_admin)
- **输入验证**: Zod schema
- **SQL 注入**: Prisma ORM (参数化查询)
- **XSS**: React 默认转义 + CSP
- **CSRF**: SameSite Cookie + CSRF Token
- **敏感数据**: 加密存储 (AES-256)

---

## 监控与日志

| 层级 | 工具 |
|------|------|
| 前端监控 | Sentry |
| 后端日志 | Winston / Pino |
| 指标 | Prometheus + Grafana |
| 错误追踪 | Sentry |
| 健康检查 | `/health` 端点 |

---

## 团队联系人

| 角色 | 职责 |
|------|------|
| 技术负责人 | [待定] |
| 产品经理 | [待定] |
| AI/ML | [待定] |

---

## 已知问题

- [ ] 数据冷启动策略待确定
- [ ] AI 成本控制方案待评估
- [ ] 第三方 OAuth 集成 (高校账号)

---

## 记忆管理体系（2026-04-20）

本项目采用 **Claude Code 层级记忆法**，三层分离，各司其职：

### 三层记忆架构

| 层级 | 存储位置 | 内容类型 | 示例 |
|------|---------|---------|------|
| **Skills** | `~/.hermes/skills/` | 已知好的 SOP / 工具流程 | 发卡流程、Tavily MCP 配置 |
| **Project Memory** | `CLAUDE.md`（本文件） | 项目特定事实 / 坑记录 | 关键词陷阱、子卡片结构 |
| **Global Memory** | `memory` 工具 | 环境路径 / 凭证 / Bug | Cloudflare 凭证、代理端口 |

### 写入规则

```
新学到的知识 → 立即判断类型并写入正确层级：
  · 工具 Bug / workaround       → memory
  · 环境路径 / 凭证 / 端口      → memory
  · 工作流程 SOP（跨项目）      → skills
  · 项目特定事实 / 踩坑记录     → 本文件（CLAUDE.md）
  · 已完成任务 / 临时状态       → 不存储
```

### 禁止事项

- **不重复**：skills / CLAUDE.md 里已有的内容，不要再写入 memory
- **不堆积**：memory 超过 2,200 字符 → 立即整理（条目迁移到 skills 或 CLAUDE.md）
- **不遗忘**：新学到的关键事实 → 当次 session 内写入，不要等 compaction

### 参考资源

- **plan.md**: 完整功能规划文档
- **设计参考**: GitHub (组织页面), cc98 (论坛), Discord (实时)
- **架构参考**: Onyx (AI+RAG), Hermes Agent (自学习)

---

## Verification（任务完成标准）

每个任务完成后必须通过以下检查：

| 任务类型 | 验收条件 |
|---------|---------|
| **API 任务** | `npm run lint` + `npm run typecheck` 通过，响应格式符合统一规范 |
| **前端任务** | `npm run lint` + `npm run typecheck` 通过，无 console.error |
| **数据库任务** | `npx prisma validate` + `npx prisma migrate --dry-run` 通过 |
| **AI/RAG 任务** | 输出符合预期，无 credential 暴露，API key 仅通过 env 获取 |
| **配置变更** | 无硬编码凭证，settings.local.json 不在 git 历史中 |
