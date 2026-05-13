# Project Memory Index

> 本项目记忆索引，记录 Scholar's Tea 项目的错误、解决方案与部署配置。
> 最后更新: 2026-05-13

---

## 目录结构

```
.claude/project-memory/
├── ERRORS/
│   ├── lark-sdk-ws-start.md      # 飞书 SDK WebSocket 启动失败
│   └── ssh-user-mismatch.md      # SSH 连接用户不匹配
├── SOLUTIONS/
│   └── server-node-env.md        # 服务器 Node.js 环境配置
├── token-optimization-deployment.md  # Token 优化策略部署记录 (2026-05-06)
└── MEMORY_INDEX.md               # 本索引文件
```

---

## 核心环境规则（永不可忘）

| 规则 | 说明 |
|------|------|
| **服务器连接** | **必须**使用 `ssh ZJU-MSE-HPC`（Host 别名，配置在 `~/.ssh/config`），密钥 `id_ed25519_dirac`，禁止手动指定用户/密钥或密码登录 |
| **开发与运行环境** | 所有服务开发和运行都在 **10.72.212.33 (CentOS 7)** 服务器上 |
| **本地边界** | Windows 本地只是代码副本，不是运行环境；禁止在本地判断服务器路径/状态 |

## 快速参考

### Token 优化策略（纯行为化，2026-05-06 修订）
- **规范**: `.kimi/rules/token-optimization.md`
- **核心原则**: 源头减量，精准读取，不增代理
- **已废弃**: ~~token-savior~~, ~~entroly-wasm~~, ~~mcp-compressor~~ — 增加 IPC 层导致 MCP 堵塞与进程崩溃
- **当前策略**:
  - Grep 优先，ReadFile 带 `line_offset`/`n_lines`
  - 强制并行工具调用
  - 子代理隔离冗长输出
  - Kimi 自动压缩: `compaction_trigger_ratio=0.80`, `reserved_context_size=40000` ✅
- **已接入项目**: Scholar's Tea, Self_Learning, Dirac
- **已知限制**: 无中间件依赖，纯工具调用行为规范

### 错误记录
| 文件 | 问题类型 | 状态 |
|------|---------|------|
| `ERRORS/lark-sdk-ws-start.md` | 飞书 SDK WebSocket | 已记录 |
| `ERRORS/ssh-user-mismatch.md` | SSH 用户配置 | 已记录 |

### 解决方案
| 文件 | 主题 | 状态 |
|------|------|------|
| `SOLUTIONS/server-node-env.md` | Node.js 环境 | 已记录 |

---

## 待办

- [x] MCP 精简: 已从 17 个降至 12 个（移除 context7, paper-search, mermaid, postgres, time）
- [x] entroly Python engine → WASM engine 替代
- [ ] 建立 token 消耗新基线 (monitor.ps1)
