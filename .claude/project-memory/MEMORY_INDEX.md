# Project Memory Index

> 本项目记忆索引，记录 Scholar's Tea 项目的错误、解决方案与部署配置。
> 最后更新: 2026-05-06

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
| **服务器连接** | 必须使用私钥 `C:/Users/Mac/.ssh/id_ed25519_scholars_tea`，禁止密码登录 |
| **开发与运行环境** | 所有服务开发和运行都在 **10.72.212.33 (CentOS 7)** 服务器上 |
| **本地边界** | Windows 本地只是代码副本，不是运行环境；禁止在本地判断服务器路径/状态 |

## 快速参考

### Token 优化策略（WASM 引擎已全面替代，2026-05-06）
- **规范**: `.claude/rules/token-optimization.md`
- **部署记录**: `.claude/project-memory/token-optimization-deployment.md`（含完整验证与修复记录）
- **核心目标**: Cache Hit ≥ 92%, Burn Rate <$8/hr
- **已部署工具**: token-savior (lean), entroly-wasm (Rust/WASM), monitor.ps1
- **MCP 配置**:
  - 项目 `.mcp.json`: 11 servers（含 token-savior + entroly-wasm）✅
  - Kimi 全局 `~/.kimi/mcp.json`: 12 servers（含 token-savior + entroly-wasm）✅
- **Kimi 压缩配置**: `compaction_trigger_ratio=0.80`, `reserved_context_size=40000` ✅
- **entroly-wasm 三个项目接入**: Scholar's Tea, Self_Learning, Dirac ✅
- **压缩率实测**: Scholar's Tea 88.7%, Self_Learning 93.7%, Dirac 76.0%
- **已知限制**: 无。Rust engine 通过 WASM 包成功运行。

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
