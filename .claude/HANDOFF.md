# Session Handoff — Scholar's Tea

> 跨会话传递关键决策。新会话启动时**首先读取本文件**恢复上下文。

> ⚠️ **当前会话结束前**：必须先更新下方「当前任务状态」表格，再执行 `/clear`。见 `.claude/rules/clear-protocol.md`。

---

## 当前任务状态（由上一会话在 `/clear` 前写入）

| 项 | 内容 |
|----|------|
| **目标** | PostgreSQL 9.2 → 16.4 + pgvector 原生向量索引升级 |
| **已完成** | ✅ 源码编译 PG 16.4 到 `~/pgsql16`（无 sudo）<br>✅ 编译安装 pgvector 0.7.4<br>✅ 备份旧数据、停止旧 PG、迁移数据到新 PG16<br>✅ 将 JSON text embedding 转换为 `vector(1024)` 类型（212 条零丢失）<br>✅ Prisma schema 更新：`Unsupported("vector")`<br>✅ rag-service.ts 改用 pgvector `<=>` 原生查询<br>✅ 修复所有 embedding 引用文件（admin API / reindex 脚本）<br>✅ `::double precision` 反序列化修复（Prisma/Node.js 驱动 bug）<br>✅ TypeScript 通过 + Build 成功 + PM2 重启<br>✅ Git push 到 develop 分支<br>✅ 添加 PG16 自启动 cron 任务 |
| **关键决策** | - 无 sudo → 源码编译 `--prefix=$HOME/pgsql16`<br>- `vector` 类型通过 `$queryRaw`/`$executeRaw` 操作，Prisma ORM 不直接支持 `Unsupported`<br>- 距离计算用 `(embedding <=> vec)::double precision`（`real` 类型在 Node.js 驱动中反序列化为 null） |
| **阻塞项** | 无 |
| **相关文件** | `prisma/schema.prisma`, `src/lib/ai/rag-service.ts`, `scripts/admin/reindex-knowledge.ts`, `src/app/api/v1/admin/knowledge/*`, `src/app/api/v1/admin/research-memory/*`, `src/app/api/v1/knowledge/[id]/route.ts` |
| **已知问题** | - `Unsupported("vector")` 不在 Prisma Client 类型中，所有 embedding 操作必须用 raw SQL<br>- 个人知识库（Personal KB）的 PDF 公式提取仍依赖 pdf.js + LLM，未接入 MathPix |
| **下一动作** | 1）用户测试 RAG 搜索功能<br>2）评估是否需要接入 MathPix API 改善 PDF 公式提取 |

---

## 本次变更详情（2026-05-29 — PostgreSQL 16 + pgvector 升级）

### 背景

- **旧环境**：PostgreSQL 9.2.24，embedding 以 JSON 文本存储，搜索时用 JavaScript `cosineSimilarity()` 全内存计算
- **瓶颈**：无原生向量索引，数据量大时全表扫描性能差
- **约束**：无 sudo，CentOS 7 已 EOL

### 升级步骤

1. **源码编译 PG 16.4** → `~/pgsql16`（`--prefix=$HOME/pgsql16`）
2. **编译 pgvector 0.7.4** → 安装到 `~/pgsql16/lib`
3. **数据迁移**：`pg_dumpall` 备份 → 停止旧 PG → `initdb` 新目录 → 导入数据
4. **类型转换**：`ALTER TABLE ... ADD COLUMN embedding_vec vector(1024)` → 迁移 JSON → 删除旧列
5. **代码适配**：Prisma `Unsupported("vector")` + `$queryRaw`/`$executeRaw` 操作
6. **反序列化修复**：`(embedding <=> vec)::double precision`（`real` 在 Node.js 驱动中为 null）
7. **自启动**：crontab 每分钟检查并自动启动 PG16

### 验证结果

```
Query: "optics metamaterial"
[1] Metamaterials for Electromagnetic Wave Control (sim: 0.6292)
[2] Three-Dimensional Optical Metamaterial with a Negative Refractive Index (sim: 0.6265)
[3] Metasurface Flat Optics: From Metalenses to Polarization Control (sim: 0.5455)
```

---

## 核心环境（永不可忘）

| 配置 | 值 |
|------|-----|
| **服务器** | `10.72.212.33` via `ssh ZJU-MSE-HPC` |
| **PG 版本** | 16.4（源码编译 @ `~/pgsql16`） |
| **PG 数据** | `~/pgdata16` |
| **PG 旧备份** | `~/pgdata`（保留），`~/pg_backup_20260529.sql` |
| **pgvector** | 0.7.4 |
| **Embedding 模型** | BAAI/bge-m3（1024 维）@ `http://127.0.0.1:9997` |
| **RAG 搜索** | pgvector `<=>` 原生 cosine distance（threshold 0.5 = distance ≤ 0.5） |
| **BGE-M3 进程** | PID 11306, `scholars-tea-embedding`（PM2 管理）|
| **Next.js** | Port 3002（PM2: `scholars-tea`）|
| **Socket** | Port 3001（PM2: `scholars-tea-socket`）|

---

## 历史归档

### 2026-05-29：PostgreSQL 16 + pgvector 升级
→ 详见 `.claude/project-memory/SOLUTIONS/postgresql-16-pgvector-upgrade.md`

### 2026-05-27：Marker PDF 逐页选择性 force_ocr
→ 已废弃路径。Marker 最终移除，改用纯 LLM 修复。

### 2026-05-26：BGE-M3 本地 Embedding 迁移
→ 详见 `.claude/project-memory/SOLUTIONS/bge-m3-embedding-server.md`
