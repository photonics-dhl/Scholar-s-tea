# /clear 前强制协议

> **未完成本 Checklist = 禁止执行 `/clear`**

---

## 触发条件

满足任一即需执行本协议：
- 轮数 > 20 / 时长 > 30min / Input > 5M
- 用户显式说 `/clear`、`clear`、`重启`、`新会话`、`reset context`、`重新开始`
- 任务阶段性完成或切换
- **关键**：即使未满足上述条件，只要用户表达 /clear 意图，**必须**先执行本协议

---

## Checklist（/clear 前必做）

- [ ] **更新 `HANDOFF.md`**：填写「当前任务状态」表格（目标、已完成、关键决策、阻塞项、相关文件、下一动作）
- [ ] **归档阶段性成果**：如有 ADR、设计结论、调研结果 → 写入 `.claude/sessions/YYYY-MM-DD_主题.md`
- [ ] **更新项目知识**：如有新踩坑/约束 → 追加到 `.claude/rules/` 或 `CLAUDE.md`
- [ ] **更新技能**：如有跨项目 SOP → 写入 `.claude/skills/`

---

## 快速写入模板

复制以下内容到 `.claude/sessions/YYYY-MM-DD_主题.md`：

```markdown
# Handoff — YYYY-MM-DD

## 目标
（一句话）

## 已完成
- [x] …

## 关键决策
- **决策**：…（理由：…）

## 阻塞项
- [ ] …

## 相关文件
| 文件 | 说明 |
|------|------|
| `path/to/file` | … |

## 下一动作
（建议下一个会话首先做什么）
```

---

## 记忆写入速查

| 信息类型 | 写入位置 |
|----------|----------|
| 当前任务状态 | `.claude/HANDOFF.md` |
| 阶段性成果归档 | `.claude/sessions/YYYY-MM-DD_主题.md` |
| 项目特定踩坑/约束 | `.claude/rules/` 或 `CLAUDE.md` |
| 跨项目 SOP | `.claude/skills/` |
| 工具 Bug / 凭证路径 | `memory` 工具 |
