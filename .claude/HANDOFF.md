# Session Handoff — Scholar's Tea

> 跨会话传递关键决策。新会话启动时**首先读取本文件**恢复上下文。

> ⚠️ **当前会话结束前**：必须先更新下方「当前任务状态」表格，再执行 `/clear`。见 `.claude/rules/clear-protocol.md`。

---

## 当前任务状态（由上一会话在 `/clear` 前写入）

| 项 | 内容 |
|----|------|
| **目标** | 排查并修复网络连接不稳定问题（需多次刷新才能加载主页） |
| **已完成** | ✅ frpc 配置优化（`heartbeat_interval=15`, `heartbeat_timeout=45`, `pool_count=3`, `tcp_mux=true`）<br>✅ Next.js HTTP 缓存头（首页 60s SWR，静态资源 immutable）<br>✅ PostgreSQL TCP keepalive 参数（`keepalives_idle=60&keepalives_interval=10`）<br>✅ 定位根本原因：socks5 代理（127.0.0.1:7890）间歇性清理长连接 + 原 frpc 无心跳参数<br>✅ 响应时间从 2.6s → 0.55-0.82s，10 连击全部 200 成功<br>✅ 部署验证通过 |
| **关键决策** | - frpc 心跳 15s/超时 45s 是平衡网络负载和稳定性的折中<br>- `pool_count=3` 预建连接减少冷启动延迟<br>- 系统 Nginx（ParaCloud，443 端口）不可修改，放弃 nginx 反向代理方案<br>- socks5 代理由系统维护，不在用户控制范围内 |
| **阻塞项** | 无 |
| **相关文件** | `next.config.js`, `.env`, `/data/home/zju321/sakura-frp/frpc.ini` |
| **已知问题** | - 数据连接仍有间歇性 EOF 断线（底层 socks5 代理/网络链路固有问题，频率已大幅降低）<br>- 断线呈批量爆发模式（tcp_mux 复用连接的连锁反应）<br>- 个人知识库（Personal KB）的 PDF 公式提取仍依赖 pdf.js + LLM，未接入 MathPix |
| **下一动作** | 1）用户持续观察网络稳定性，如仍有问题可添加 frpc 监控脚本 + 前端重试逻辑<br>2）评估是否需要接入 MathPix API 改善 PDF 公式提取 |

---

## 本次变更详情（2026-05-30 — 网络稳定性排查与修复）

### 背景

- **症状**：访问 `scholars-tea.428312321.xyz` 需要多次刷新才能加载，频繁遇到 503/超时
- **原响应时间**：外部 2.6s，本地 0.019s（130 倍差距）
- **frpc 日志**：大量"网络波动导致数据连接断开, 正在重试: EOF"（33 次/天）

### 排查过程

1. **服务器资源检查** — CPU/内存/磁盘均正常，PM2 进程健康（重启均为部署 SIGINT，非崩溃）
2. **FRP 隧道诊断** — Sakura Frp 会员套餐，但必须经系统级 socks5 代理（127.0.0.1:7890）访问外网
3. **网络链路测试** — 直接 TCP 到 frp-fit.com:8088 失败，ping 100% 丢包，traceroute 第 5 跳后消失
4. **frpc 配置审计** — 原配置无心跳参数，tcp_mux 未显式开启
5. **数据库连接层** — PostgreSQL keepalive 全为 0，Prisma 连接字符串无保活参数

### 修复措施

| 层级 | 修复 | 文件 |
|------|------|------|
| FRP 隧道 | `heartbeat_interval=15`, `heartbeat_timeout=45`, `pool_count=3`, `tcp_mux=true` | `~/sakura-frp/frpc.ini` |
| HTTP 缓存 | 首页 `max-age=60,s-w-r=300`；静态资源 `immutable`；API `no-store` | `next.config.js` |
| DB 连接 | `keepalives=1&keepalives_idle=60&keepalives_interval=10&keepalives_count=6` | `.env` `DATABASE_URL` |

### 验证结果

```
# 10 次连续外部请求
req1: 200 0.591s
req2: 200 0.587s
req3: 200 0.612s
req4: 200 0.585s
req5: 200 0.549s
req6: 200 0.570s
req7: 200 0.545s
req8: 200 0.565s
req9: 200 0.548s
req10: 200 0.539s
```

---

## 核心环境（永不可忘）

| 配置 | 值 |
|------|-----|
| **服务器** | `10.72.212.33` via `ssh ZJU-MSE-HPC` |
| **OS** | CentOS 7 (no sudo) |
| **PG 版本** | 16.4（源码编译 @ `~/pgsql16`） |
| **PG 数据** | `~/pgdata16` |
| **pgvector** | 0.7.4 |
| **Embedding 模型** | BAAI/bge-m3（1024 维）@ `http://127.0.0.1:9997` |
| **RAG 搜索** | pgvector `<=>` 原生 cosine distance（threshold 0.5 = distance ≤ 0.5） |
| **Next.js** | Port 3002（PM2: `scholars-tea`）|
| **Socket** | Port 3001（PM2: `scholars-tea-socket`）|
| **FRP 隧道** | Sakura Frp 会员，`frpc.ini` @ `~/sakura-frp/frpc.ini` |
| **FRP 代理** | 强制经 socks5://127.0.0.1:7890（系统级代理，不可控） |
| **FRP 域名** | `scholars-tea.428312321.xyz` (3002), `socket.428312321.xyz` (3001) |

---

## 历史归档

### 2026-05-30：网络稳定性排查与修复
→ 详见本节「本次变更详情」

### 2026-05-29：PostgreSQL 16 + pgvector 升级
→ 详见 `.claude/project-memory/SOLUTIONS/postgresql-16-pgvector-upgrade.md`

### 2026-05-27：Marker PDF 逐页选择性 force_ocr
→ 已废弃路径。Marker 最终移除，改用纯 LLM 修复。

### 2026-05-26：BGE-M3 本地 Embedding 迁移
→ 详见 `.claude/project-memory/SOLUTIONS/bge-m3-embedding-server.md`
