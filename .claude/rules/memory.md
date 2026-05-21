# 记忆管理

## 写入规则

| 类型 | 写入位置 | 示例 |
|------|----------|------|
| 工具 Bug / workaround | `memory` 工具 | CLI 崩溃、MCP 故障 |
| 环境路径 / 凭证 | `memory` 工具 | SSH 别名、密钥路径 |
| 跨项目 SOP | `.claude/skills/` | 部署流程、调试方法 |
| 项目特定事实 / 踩坑 | `.claude/rules/` 或 `CLAUDE.md` | 项目架构约束 |

## 禁止重复

skills / CLAUDE.md 已有的内容，不再写入 memory。

## Document & Clear 模式

阶段性成果 → 写入文件 → `/clear` → 新会话读回

- **任务状态**：`.claude/HANDOFF.md`
- **历史归档**：`.claude/sessions/`
- **规范细则**：`.claude/rules/`

> `/clear` 只清除当前会话上下文（对话历史、文件缓存），**不会**删除文件系统中的 CLAUDE.md、rules、skills、handoffs 或 sessions。

## 跨会话记忆启动协议

每次新会话启动时，**在回复用户第一条消息前**：
1. 读取 `.claude/HANDOFF.md` 恢复任务状态
2. 读取 `.claude/rules/handoff-automation.md` 确认自动化规则
3. 向用户汇报：当前目标、已完成项、阻塞项、下一动作
4. 如 HANDOFF.md 为空，主动说明并请求确认任务方向
