# Project Memory Index

> 本项目记忆索引，记录 Scholar's Tea 项目的错误、解决方案与部署配置。
> 最后更新: 2026-05-29
> Marker PDF 部署记录: 2026-05-21

---

## 目录结构

```
.claude/project-memory/
├── ERRORS/
│   ├── lark-sdk-ws-start.md      # 飞书 SDK WebSocket 启动失败
│   └── ssh-user-mismatch.md      # SSH 连接用户不匹配
├── SOLUTIONS/
│   ├── server-node-env.md              # 服务器 Node.js 环境配置
│   ├── bge-m3-embedding-server.md      # BGE-M3 本地 Embedding 服务部署
│   └── postgresql-16-pgvector-upgrade.md  # PostgreSQL 16 + pgvector 无 sudo 升级 (2026-05-29)
├── token-optimization-deployment.md    # Token 优化策略部署记录 (2026-05-06)
├── marker-pdf-deployment.md            # Marker PDF 后端服务部署 (2026-05-21)
└── MEMORY_INDEX.md                     # 本索引文件
```

---

## 核心环境规则（永不可忘）

| 规则 | 说明 |
|------|------|
| **服务器连接** | **必须**使用 `ssh ZJU-MSE-HPC`（Host 别名，配置在 `~/.ssh/config`），密钥 `id_ed25519_dirac`，禁止手动指定用户/密钥或密码登录 |
| **开发与运行环境** | 所有服务开发和运行都在 **10.72.212.33 (CentOS 7)** 服务器上 |
| **本地边界** | Windows 本地只是代码副本，不是运行环境；禁止在本地判断服务器路径/状态 |

---

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

### Marker PDF 后端服务（2026-05-21）

- **服务**: `marker_server`（开源 PDF-to-Markdown converter）
- **端口**: `localhost:3003`
- **环境**: `marker` conda @ `/data/home/zju321/miniconda3/envs/marker/` (Python 3.11)
- **服务器**: Intel Xeon Silver 4310 / 24 cores / 251GB RAM / 无 GPU / `/data` 227TB
- **HF 镜像**: `HF_ENDPOINT=https://hf-mirror.com`（中国大陆模型下载）
- **调用链**: 前端 pdf-extractor 评级 C/D/F → Next.js `/api/v1/knowledge/extract-pdf` → proxy 到 `localhost:3003`
- **Fallback**: Marker 失败时自动回退到 pdf.js 初提取结果
- **详细文档**: `SOLUTIONS/marker-pdf-deployment.md`

### BGE-M3 本地 Embedding 服务（2026-05-26）
- **服务**: `scripts/embedding-server.py`（FastAPI, port 9997）
- **模型**: BAAI/bge-m3, 1024 维，normalized output
- **环境**: `ai_agent` conda @ `/data/home/zju321/miniconda3/envs/ai_agent/`
- **PM2**: `scholars-tea-embedding`, max_memory_restart 5G
- **关键路径**:
  - 模型: `/data/home/zju321/321/DHL/Self_Learning/academic_rag/models/models--BAAI--bge-m3/snapshots/5617a9f61b028005a4858fdac845db406aefb181`
  - 服务代码: `scripts/embedding-server.py`
  - RAG 调用: `src/lib/ai/rag-service.ts` → `generateEmbedding()`
  - 全量重索引: `npx tsx scripts/admin/reindex-knowledge.ts --all`
- **PM2 包路径陷阱**: conda 包 vs `~/.local` 冲突 → 显式 `PATH`/`PYTHONPATH` + `sys.path.insert(0, ...)`
- **Fallback**: 本地服务离线时自动回退 ZCHAT API

### 错误记录
| 文件 | 问题类型 | 状态 |
|------|---------|------|
| `ERRORS/lark-sdk-ws-start.md` | 飞书 SDK WebSocket | 已记录 |
| `ERRORS/ssh-user-mismatch.md` | SSH 用户配置 | 已记录 |

### 解决方案
| 文件 | 主题 | 状态 |
|------|------|------|
| `SOLUTIONS/server-node-env.md` | Node.js 环境 | 已记录 |
| `SOLUTIONS/marker-pdf-deployment.md` | Marker PDF 后端服务 | 已记录 |
| `SOLUTIONS/bge-m3-embedding-server.md` | BGE-M3 Embedding 服务 | 已记录 |

---

## 待办

- [x] MCP 精简: 已从 17 个降至 12 个（移除 context7, paper-search, mermaid, postgres, time）
- [x] entroly Python engine → WASM engine 替代
- [x] BGE-M3 本地 Embedding 迁移完成（2026-05-26）
- [ ] 建立 token 消耗新基线 (monitor.ps1)
