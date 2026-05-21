# Session Handoff — Scholar's Tea

> 跨会话传递关键决策。新会话启动时**首先读取本文件**恢复上下文。

> ⚠️ **当前会话结束前**：必须先更新下方「当前任务状态」表格，再执行 `/clear`。见 `.claude/rules/clear-protocol.md`。

---

## 当前任务状态（由上一会话在 `/clear` 前写入）

| 项 | 内容 |
|----|------|
| **目标** | P0 工程基线治理 + P1 自动化测试 + P2 Prisma Migration + 补文档 |
| **已完成** | ✅ P0 全部完成（Socket 泄漏修复、next.config.js 安全加固、日志分级、dirty files 清理）<br>✅ P1 全部完成（Vitest + React Testing Library 引入，30 个测试通过）<br>✅ P2 全部完成（Prisma baseline migration 建立、deploy 脚本更新、API/Socket 文档补充）<br>✅ AGENTS.md 更新（测试状态、Prisma 命令） |
| **关键决策** | - Socket disconnect 用 `joinedRooms` Set 追踪并自动清理参与者<br>- next.config.js `images.remotePatterns` 从 `**` 收紧为具体域名白名单<br>- Socket server 日志受 `LOG_LEVEL=debug` 控制，生产环境默认静默<br>- Prisma 迁移基线 `init_baseline` 已建立，后续 schema 变更使用 `migrate dev`/`migrate deploy`<br>- 部署脚本 `deploy-all.sh` 从 `db push --accept-data-loss` 改为 `migrate deploy` |
| **阻塞项** | 无 |
| **相关文件** | `server/src/handlers/room.ts`, `server/src/db.ts`, `next.config.js`, `package.json`, `vitest.config.ts`, `prisma/migrations/`, `docs/API.md`, `docs/SOCKET_PROTOCOL.md`, `AGENTS.md` |
| **已知问题** | - 162 个 dirty files 中仍有大量未提交的代码改动（正常开发累积），需用户择机分类提交<br>- `npm audit` 报告 10 个漏洞（3 low, 3 moderate, 4 high），建议运行 `npm audit fix`<br>- Sakura Frp 网络间歇性断开（日志大量 EOF）<br>- GLM-5.1 会忽略 prompt 中的字数限制（LLM 普遍问题） |
| **下一动作** | 等待用户确认治理效果；建议下一轮：1）整理提交 dirty files 2）修复 npm audit 漏洞 3）Knowledge 管理端开发 |

---

## 历史归档

### 2026-05-21：三阶段工程治理（P0/P1/P2）

<details>
<summary>展开查看详情</summary>

**P0 — 工程基线治理**：
- 修复 Socket server `disconnect` 不清理 `TeaPartyRoomParticipant` 的泄漏 bug
- 收紧 `next.config.js` 图片白名单（删除 `hostname: '**'` 通配符）
- Socket server 日志分级（`LOG_LEVEL=debug`）
- 清理 dirty files：删除 `index.ts.orig`、截图文件、PDF；更新 `.gitignore`（`*.orig`, `__pycache__/`）

**P1 — 自动化测试**：
- 安装 Vitest + React Testing Library + jsdom
- 30 个测试全部通过：
  - `latex-to-utf8.test.ts`（13 tests）— 希腊字母、数学符号、分数、上下标、矩阵
  - `peer-review-prompts.test.ts`（9 tests）— JSON 解析、分数规范化、verdict 规范化
  - `grant-application-prompts.test.ts`（8 tests）— 结构化解析、snake_case fallback

**P2 — Prisma Migration + 文档**：
- 建立 baseline migration：`prisma/migrations/init_baseline/`
- 标记为已应用：`prisma migrate resolve --applied init_baseline`
- 更新 `scripts/deploy/deploy-all.sh`：`db push --accept-data-loss` → `migrate deploy`
- 更新 `docs/DEPLOYMENT.md`
- 新建 `docs/API.md`（REST API 路由概览）
- 新建 `docs/SOCKET_PROTOCOL.md`（Socket.io 事件协议完整文档）
- 更新 `AGENTS.md` 测试和 Prisma 章节
</details>

### 2026-05-19：四阶段学术 AI 质量提升计划 & 文本选择修复

<details>
<summary>展开查看详情</summary>

**目标**：四阶段学术 AI 质量提升计划已部署完成；更新操作指南；修复文本选择问题

**已完成**：
- ✅ **文档合并**：删除冗余 `AI_ACADEMIC_QUALITY_ROADMAP_2026.md`，四阶段完整详情合并为 `WORKSHOP_TEST_REPORT.md` 第五轮测试记录
- ✅ **操作指南更新**：`WORKSHOP_TEST_REPORT.md` 新增第五轮（5.1-5.5 BugFix→Param→Struct→UI）+ 附录更新
- ✅ **文本选择修复**：Workshop `ChatMessage.tsx` + `WorkshopClient.tsx` 补 `select-text`，根因是 `inline-block` 消息气泡的浏览器 hit-testing 行为
- ✅ **四阶段回顾**：BugFix（Prompt 修复）→ Param（Thinking/Temperature/自检）→ Struct（JSON 结构化）→ UI（评分表/基金向导）全部部署上线

**关键决策**：
- 文档去重：只有一个主文档 `WORKSHOP_TEST_REPORT.md`
- `inline-block` 消息气泡需显式加 `select-text`
- DSPy 明确不引入
</details>

---

## 经验记录

### 1. 文档管理：不要重复

`AI_ACADEMIC_QUALITY_ROADMAP_2026.md` 和 `WORKSHOP_TEST_REPORT.md` 内容大面积重叠。正确做法：先问用户"是否需要两份独立文档"。

### 2. `inline-block` 消息气泡的文本选择陷阱

消息气泡用 `inline-block` 会导致浏览器 hit-testing 异常。修复：加 `select-text`。

### 3. Prisma Migrate Baseline 流程

对于已用 `db push` 运行的生产数据库：
1. `prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma` 确认无差异
2. 手动创建 `prisma/migrations/init_baseline/migration.sql`（空迁移）
3. `prisma migrate resolve --applied init_baseline` 标记为已应用
4. 后续变更使用 `migrate dev`（开发）和 `migrate deploy`（生产）

### 4. Vitest 在已有项目中的集成

- 安装：`vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`
- 配置 `vitest.config.ts` 时注意 `resolve.alias` 映射 `@`
- 优先测试纯函数（解析器、转换器），避免测试依赖外部 API 的流式逻辑
- 测试写完后先本地/远程运行，根据实际输出修正期望值（LLM 相关的解析函数常有 subtle 的 fallback 行为）

---

## Document & Clear 模式

### 写入（`/clear` 前必做）

1. 更新上方「当前任务状态」表格
2. 如产生阶段性成果（ADR、设计稿、调研结论），写入 `.claude/sessions/YYYY-MM-DD_主题.md`
3. 执行 `/clear`

### 恢复（新会话启动）

1. **读取本文件** → 了解当前任务
2. 读取 `AGENTS.md` → 项目全貌
3. 按需读取 `.claude/rules/` 中的细则
4. 按需读取 `.claude/agents/` 的 Agent 定义

---

## Agent 间 Handoff（快速参考）

- **必须传递**：目标（1 句话）、已完成（3–5 点）、关键决策、阻塞项、相关文件路径
- **禁止传递**：完整代码块（用路径代替）、已解决的中间讨论、无关背景

---

*Last updated: 2026-05-21*
