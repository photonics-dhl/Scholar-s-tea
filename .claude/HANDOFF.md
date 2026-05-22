# Session Handoff — Scholar's Tea

> 跨会话传递关键决策。新会话启动时**首先读取本文件**恢复上下文。

> ⚠️ **当前会话结束前**：必须先更新下方「当前任务状态」表格，再执行 `/clear`。见 `.claude/rules/clear-protocol.md`。

---

## 当前任务状态（由上一会话在 `/clear` 前写入）

| 项 | 内容 |
|----|------|
| **目标** | P3-P7 五阶段性能与质量优化 |
| **已完成** | ✅ P3 前端性能（Image 组件 + dynamic 懒加载，Workshop -25%）<br>✅ P4 API 性能（unstable_cache + 并行查询 + 消息限制）<br>✅ P5 错误处理标准化（api/response.ts helper）<br>✅ P6 代码质量（ESLint no-console 规则调整 + 清理 30+ 处 console.log）<br>✅ P7 安全评估（9 个漏洞需 --force，维持不修复决策）<br>✅ 远程 build + PM2 restart 成功 |
| **关键决策** | - `no-console` 规则允许 `error`/`warn`，仅禁止 `console.log`<br>- 9 个 npm audit 漏洞需 Next.js 14→16 升级，决定延后处理<br>- `unstable_cache` 用于 disciplines/institutions(1h)/public-stats(5min)<br>- Workshop 消息限制 `take: 100` 防止长会话内存爆炸 |
| **阻塞项** | 无 |
| **相关文件** | `next.config.js`, `src/lib/api/response.ts`, `src/services/groups/index.ts`, `src/services/tea-party/index.ts`, `.eslintrc.json`, `src/app/api/v1/disciplines/route.ts`, `src/app/api/v1/institutions/route.ts`, `src/app/api/v1/public-stats/route.ts` |
| **已知问题** | - 9 个 npm audit 漏洞（2 low, 3 moderate, 4 high），需 Next.js 16 升级修复<br>- Sakura Frp 网络间歇性断开（SSH 偶发超时） |
| **下一动作** | 用户确认本轮优化效果；建议下一轮方向：1）Next.js 15/16 升级评估 2）Knowledge 管理端开发 3）服务端监控告警 |

---

## 历史归档

### 2026-05-22：五阶段性能与质量优化（P3-P7）

<details>
<summary>展开查看详情</summary>

**P3 — 前端性能优化**：
- `next.config.js` 扩展图片域名白名单（AWS S3、GitHub、Google、ByteDance）
- `GroupCard`/`GroupHeader`/`NewsList` raw `<img>` → Next.js `<Image>` 组件
- `WorkshopClient` 中 `PeerReviewPanel`/`PaperGenerationPanel` 改为 `next/dynamic` 懒加载
- `ChatMessage` 中 `PeerReviewScoreCard`/`GrantApplicationWizard` 改为 `next/dynamic` 懒加载
- 效果：`/workshop` bundle 31.2kB → 23.4kB (-25%)

**P4 — API 性能优化**：
- `/disciplines` `/institutions` `/public-stats` 添加 `unstable_cache`
- `getGroups`/`getTeaPartyRooms` 中 `count` + `findMany` 改为 `Promise.all`
- Workshop session GET 添加 `take: 100` 限制消息数量

**P5 — 错误处理标准化**：
- 新建 `src/lib/api/response.ts`：`successResponse` / `errorResponse` / `apiErrors`
- disciplines/institutions/public-stats 路由迁移为新 helper

**P6 — 代码质量**：
- `.eslintrc.json`: `no-console` 规则允许 `error`/`warn`
- 清理 30+ 处 `console.log` 调试日志
- CI lint warning 归零

**P7 — 安全评估**：
- `npm audit` 显示 9 个漏洞，全部需 `--force` 修复（Next.js 14→16 breaking change）
- 决定维持不修复，记录待后续升级处理

**部署**：远程 build 成功，PM2 restart 成功，两个进程 online
</details>

### 2026-05-21：三阶段工程治理 + CI/CD 搭建

<details>
<summary>展开查看详情</summary>

**P0-P2 工程基线治理**：Socket 泄漏修复、next.config.js 安全加固、日志分级、Vitest 框架（30 tests）、Prisma baseline migration、文档更新

**CI/CD 搭建**：
- `ci.yml`: PR/push 时自动运行 lint + typecheck + test + prisma validate ✅
- `deploy.yml`: `workflow_dispatch` 手动触发（内网服务器不可达）
- GitHub Secrets 已配置

</details>

---

## 经验记录

### 1. `sed` 删除多行 `console.log` 的风险

`sed -i '/console\.log/d'` 对多行 `console.log(...)` 调用会只删除包含 `console.log` 的行，留下后续参数行导致 Parsing Error。修复：手动检查并删除残留参数。

### 2. `unstable_cache` 的使用

Next.js App Router API 路由中可以使用 `unstable_cache` 缓存数据获取函数。需要指定 `tags` 以便后续通过 `revalidateTag` 手动失效。

### 3. `next/dynamic` 对条件渲染组件的收益

`PeerReviewPanel`/`PaperGenerationPanel` 只在特定 mode 下渲染，但静态导入会始终打包。改为 `next/dynamic` 后 Workshop 页面减少 7.8kB (25%)。

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

*Last updated: 2026-05-22*
