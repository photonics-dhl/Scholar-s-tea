# Scholar's Tea — Session Boot

> 完整规范 → `AGENTS.md` | 当前任务 → `.claude/HANDOFF.md` | 细则 → `.claude/rules/`

---

## 🔴 会话启动协议（新会话必读 — 必须执行）

**本文件是项目入口指令。每次新会话启动时，必须先完成以下步骤，再执行用户请求：**

1. **读取 `.claude/HANDOFF.md`** → 恢复当前任务状态（目标、已完成、阻塞项、下一动作）
2. **读取 `AGENTS.md`** → 获取项目全貌（技术栈、结构、规范）
3. **读取 `.claude/rules/clear-protocol.md`** → 了解 /clear 前 checklist
4. 按需读取 `.claude/rules/` 中的细则（commands.md、routes.md、api.md 等）

**禁止跳过以上步骤直接响应用户。** 如果你已经读取了这些文件，在回复中简要说明当前任务状态即可。

---

## 🔴 /clear 前强制协议（SessionEnd — 必须执行）

**禁止直接 `/clear` 或退出会话。** 必须先完成以下检查清单：

1. **更新 `.claude/HANDOFF.md`** → 填写「当前任务状态」表格（目标、已完成、关键决策、阻塞项、相关文件、下一动作）
2. **归档阶段性成果** → 如有 ADR、设计结论、调研结果，写入 `.claude/sessions/YYYY-MM-DD_主题.md`
3. **更新项目知识** → 如有新踩坑/约束，追加到 `.claude/rules/` 或本文件
4. **确认完成** → 明确告知用户已更新 HANDOFF.md，获得用户许可后才能执行 `/clear`

完整 checklist → `.claude/rules/clear-protocol.md`

---

## Boot Checklist

1. 轮数>20 / 时长>30min / Input>5M → 先执行上方 `/clear 协议`，再 `/compact` 或 `/clear`
2. 禁止 `Read` >200 行；先 `Grep` 或 `Agent`
3. 禁止修改 `CLAUDE.md`、`.claudeignore`、`settings.json`
4. MCP 精简：当前 9 个，禁止新增不替换
5. API key 仅通过 env 获取

## 恢复上下文

| 需要 | 读取 |
|------|------|
| 当前任务状态 | `.claude/HANDOFF.md` |
| 命令速查 | `.claude/rules/commands.md` |
| 路由/API 速查 | `.claude/rules/routes.md` |
| API 设计规范 | `.claude/rules/api.md` |
| 测试规范 | `.claude/rules/testing.md` |
| 记忆规则 | `.claude/rules/memory.md` |
| /clear 协议 | `.claude/rules/clear-protocol.md` |
| 历史会话 | `.claude/sessions/` |
| Agent 定义 | `.claude/agents/` |

## 验证 Gates

| 类型 | 命令 |
|------|------|
| API / 前端 | `npm run lint && npm run typecheck` |
| DB | `npx prisma validate` |

## 记忆写入

| 类型 | 位置 |
|------|------|
| 工具 Bug / workaround | `memory` 工具 |
| 跨项目 SOP | `.claude/skills/` |
| 项目事实 / 踩坑 | `.claude/rules/` 或本文件 |

---

*Last updated: 2026-05-14*
