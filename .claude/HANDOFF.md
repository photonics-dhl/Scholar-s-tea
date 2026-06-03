# Session Handoff — Scholar's Tea

> 跨会话传递关键决策。新会话启动时**首先读取本文件**恢复上下文。

> ⚠️ **当前会话结束前**：必须先更新下方「当前任务状态」表格，再执行 `/clear`。见 `.claude/rules/clear-protocol.md`。

---

## 当前任务状态（由上一会话在 `/clear` 前写入）

| 项 | 内容 |
|----|------|
| **目标** | 项目健康度审计 + 零风险优化 + Hermes 配置关系梳理，为后续功能开发做准备 |
| **已完成** | ✅ 项目全量技术债审计（架构/代码质量/基础设施/CI）<br>✅ .env.example 同步实际代码（移除 7 死变量，补充 12 未记录变量）<br>✅ 删除 server/src 空 directory（modules/plugins/services）<br>✅ CI 添加 npm run build 门禁<br>✅ Hermes 实例关系彻底理清<br>✅ Hermes config fallback 链修正（GLM-5.1 → MiniMax-M2.7 → DeepSeek）<br>✅ smart_model_routing 关闭（Kimi 不可用）<br>✅ 4 个科研技能复制到项目 hermes-home<br>✅ 所有变更已推送到 GitHub develop（2e65c68） |
| **关键决策** | - **Hermes 实例关系**：运行时只有全局 `~/.hermes/` 一个实例，项目 `hermes-home/` 是版本控制的参考副本，不被任何运行时进程读取<br>- **fallback 链**：GLM-5.1 → MiniMax-M2.7 → DeepSeek（用户确认）<br>- **smart_model_routing**：关闭，Kimi moonshot-v1-8k 不可用，GLM-5.1 并发数足够<br>- **技术债优先级**：仅执行零风险项（文档同步/空目录/CI），高风险项（API 样板重构/大文件拆分/as any 修复）暂不执行 |
| **阻塞项** | 无 |
| **相关文件** | `.env.example`, `.github/workflows/ci.yml`, `hermes-home/config.yaml`, `~/.hermes/config.yaml`, `server/src/`（已清理空目录） |
| **已知问题** | - Prisma 缺失索引（Message/Post/Comment/Vote 等高频查询无索引，随数据量增长将变慢）<br>- ~40 处 `as any` 类型断言（auth.ts 模块扩展是根因，修复一处可消除 8+ 处）<br>- API 路由 51 处重复认证样板（已有 `lib/api/response.ts` 但仅 11 文件使用）<br>- 脚本目录 44 个根级文件含大量 one-shot 临时脚本待归档<br>- `API_SERVER_KEY` 在源码中有硬编码 fallback（用户暂不改） |
| **下一动作** | 进入功能开发阶段。等待用户指定具体功能需求。 |

---

## 核心架构认知（永不可忘）

### Hermes 实例关系（2026-06-03 确认）

```
~/.hermes/                          ← 唯一活跃实例
├── config.yaml                     ← Gateway + Next.js 共同读取的配置
├── skills/research/                ← 15 个科研技能（含 scansci-pdf）
├── hermes-agent/                   ← Gateway Python 源码（PYTHONPATH 指向此处）
└── .env                            ← Gateway 环境变量

~/scholars/hermes-home/             ← 项目仓库中的备份/参考副本
├── config.yaml                     ← 与全局保持同步，运行时不读取
└── hermes-agent/                   ← 开发/备份副本
```

- Gateway 启动：`HERMES_HOME=/data/home/zju321/.hermes`（见 `tests/scripts/restart_hermes.sh`）
- Next.js capabilities 路由：`process.env.HERMES_HOME || homedir()/.hermes`（默认指向全局）
- `ecosystem.config.js` 的 `forwardVars` 不含 `HERMES_HOME`（未覆盖）
- **项目 hermes-home/ 中的技能和配置不影响运行中的 Gateway**

### AI 调用链路

```
Workshop / FloatingChat (前端)
    ↓
Next.js API Routes (3002)
    ├── 纯文本 → Hermes Gateway (8642) → GLM-5.1 (ZAI)
    │                                   fallback: MiniMax-M2.7 → DeepSeek
    ├── 图片 → GLM-4.6V → ZCHAT → MiniMax VLM → DeepSeek (四级 fallback)
    └── 论文生成 → Hermes Gateway (含 PAPER_GENERATION_SYSTEM_PROMPT 显式注入)
```

### 环境配置

| 配置 | 值 |
|------|-----|
| **服务器** | `10.72.212.33` via `ssh ZJU-MSE-HPC` |
| **OS** | CentOS 7 (no sudo) |
| **PG 版本** | 16.4（源码编译 @ `~/pgsql16`） |
| **pgvector** | 0.7.4 |
| **Embedding 模型** | BAAI/bge-m3（1024 维）@ `http://127.0.0.1:9997` |
| **RAG 搜索** | pgvector `<=>` cosine distance（threshold 0.5） |
| **Next.js** | Port 3002（PM2: `scholars-tea`）|
| **Socket** | Port 3001（PM2: `scholars-tea-socket`）|
| **FRP 隧道** | Sakura Frp 会员，经 socks5://127.0.0.1:7890 |
| **FRP 域名** | `scholars-tea.428312321.xyz` (3002), `socket.428312321.xyz` (3001) |
| **本地路径** | `z:\321\DHL\Scholar's_Tea` = RaiDrive SFTP mount of `/data/home/zju321/321/DHL/Scholar's_Tea` |

---

## 技术债清单（待后续评估执行）

| 优先级 | 项目 | 工作量 | 风险 |
|--------|------|--------|------|
| 🔴 P0 | Prisma 添加缺失索引 | 2h | 低 |
| 🔴 P1 | API 路由抽象 auth+error 样板 | 4h | 中 |
| 🟡 P2 | 修复 auth.ts 类型 → 消除 ~8 处 as any | 2h | 中 |
| 🟡 P2 | 清理 scripts/ 归档临时文件 | 1h | 低 |
| 🟢 P3 | CI deploy 添加健康检查+回滚 | 2h | 低 |
| 🟢 P3 | 拆分 >700 行大文件 | 8h | 高 |

---

## 历史归档

### 2026-06-03：技术债审计 + Hermes 关系梳理 + 零风险优化
→ 详见本节

### 2026-05-30：网络稳定性排查与修复
→ frpc 心跳优化 + HTTP 缓存头 + PG keepalive

### 2026-05-29：PostgreSQL 16 + pgvector 升级
→ 详见 `.claude/project-memory/SOLUTIONS/postgresql-16-pgvector-upgrade.md`
