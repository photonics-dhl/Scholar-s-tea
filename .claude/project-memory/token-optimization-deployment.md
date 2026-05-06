# Token 优化策略部署记录

> 部署日期: 2026-05-06
> 状态: WASM 引擎已全面替代 Python 引擎

---

## 本次更新（2026-05-06）

### 重大变更：entroly-wasm 替代 entroly Python

**问题根因**：Python engine (`entroly serve`) 只有 dedup + knapsack 选择，**没有 AST 压缩功能**。GitHub 宣传的 90% 节省来自 WASM 版本的 `hierarchical_compress()`。

**解决路径**：
1. Windows 本地编译 `entroly-core` Rust 包 → ❌ 失败（需 MSVC + Windows SDK）
2. WSL2 pip 安装 → ❌ 失败（WSL2 网络故障）
3. `npm install -g entroly-wasm` → ✅ 秒装成功

### MCP Server Wrapper 开发

- **文件**: `mcp-servers/entroly-wasm-server.js`
- **协议**: MCP stdio transport (JSON-RPC 2.0)
- **工具**: 8 个（optimize_context, hierarchical_compress, ingest_fragment, recall_relevant, get_stats, clear_engine, import_state, export_state）

### 全局部署

| 层级 | 路径 | 变更 |
|------|------|------|
| 全局 Server | `~/.kimi/mcp-servers/entroly-wasm-server.js` | 新增 |
| 全局配置 | `~/.kimi/mcp.json` | `entroly` → WASM 引擎 |
| Scholar's Tea | `.mcp.json` | `entroly` → WASM 引擎 |
| Self_Learning | `Self_Learning/.mcp.json` | 新增 WASM 引擎 |
| Dirac | `Dirac/.mcp.json` | 新增 WASM 引擎 |

### 三个项目压缩率实测

| 项目 | Fragments | 原始 Tokens | optimize() | `hierarchical_compress()` |
|------|-----------|-------------|------------|---------------------------|
| **Scholar's Tea** | 185 | 133,768 | 33.0% | **88.7%** |
| **Self_Learning** | 86 | 108,214 | 0%（未超 budget） | **93.7%** |
| **Dirac** | 51 | 58,115 | 0%（未超 budget） | **76.0%** |

**关键发现**：
- `hierarchical_compress()` 执行 **Full → Skeleton → Reference** 三级 AST 压缩，与项目大小无关
- `optimize()` 的 0% 不是 bug：当总 token < budget（128K）时，所有片段都能装下，无需丢弃
- Self_Learning 文档多、重复多 → 压缩率最高（93.7%）
- Dirac DFT/量子化学代码密度高 → 压缩率最低（76.0%）

---

## 历史部署（2026-05-05）

### 初始部署
- token-savior (lean profile)
- entroly Python engine
- MCP 精简（17→12 servers）
- Kimi compact 优化（0.85→0.80, 50000→40000）

### 当时限制
- `entroly-core` Rust 编译失败，使用 Python fallback
- optimize_context 超时（后修复）
- 996 fragments, 2.14M tokens 在 Python engine 中管理

---

## 当前配置速查

### Kimi `~/.kimi/config.toml`
```toml
[loop_control]
compaction_trigger_ratio = 0.80
reserved_context_size = 40000

[mcp.client]
tool_call_timeout_ms = 120000
```

### MCP 配置
- **项目 `.mcp.json`**: 11 servers（含 entroly-wasm）
- **全局 `~/.kimi/mcp.json`**: 12 servers（含 entroly-wasm）

### 已移除的旧工具
- Python `entroly serve` → 已停用
- `context7`, `paper-search`, `mermaid`, `postgres`, `time` → 已从全局移除
