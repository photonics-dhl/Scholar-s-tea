# HANDOFF.md — Scholar's Tea

> 最后更新: 2026-04-23

## 当前状态

- **分支**: `develop`
- **main 分支**: `main`

## 未提交更改

| 文件 | 状态 | 说明 |
|------|------|------|
| `.claude/settings.local.json` | 已修改 | 已移除 MINIMAX_API_KEY、SSH 私钥操作，清理 additionalDirectories |
| `.claude/settings.json` | 已修改 | 添加 SessionStart hook、disabledMcpjsonServers |
| `.claude/hooks/post-write-hook.sh` | 已修改 | 新增凭证扫描 |
| `.gitignore` | 已修改 | 添加 settings.local.json |
| `CLAUDE.md` | 已修改 | 新增 Verification 章节 |
| `.claude/rules/` | 新增 | api.md + testing.md |

## 待提交更改（未跟踪）

| 文件 | 说明 |
|------|------|
| `.claude/rules/` | 新目录（api/testing 规范） |
| `.claude/HANDOFF.md` | 本文件 |
| `package-lock.json` | 依赖更新 |
| `scripts/sync/` | 同步脚本 |
| `optics_tracker/` | 光学追踪模块 |
| `unison_sync_guide.md` | Unison 同步指南 |

## 已完成（本 session）

- Health 检查修复：凭证暴露、SSH 私钥操作移除、allowedTools 精简、hooks 增强、Verification 添加、rules/ 分片

## 已知限制

- **tavily-search**: rate-limited，已通过 `disabledMcpjsonServers` 禁用，恢复后移除
- **tavily-rotate**: 需检查是否正确轮换 key

## 快速启动

```bash
npm install
npm run dev
npm run lint && npm run typecheck  # Verification gate
```
