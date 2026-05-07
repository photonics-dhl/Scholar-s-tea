# Scholar's Tea 部署指南

## 概述

Scholar's Tea（学者茶话会）是一个高校学术交流社区平台，支持课题组管理、学科社区、实时茶话会（Tea Party）和 AI 思想工坊。

---

## 软件说明

### 为什么需要这些软件？

| 软件 | 版本 | 为什么需要 |
|------|------|-----------|
| **Next.js** | 14.x | React 框架，提供服务端渲染（SSR）和静态生成（SSG）能力，用于构建 SEO 友好的页面和 API 路由。是整个应用的前端框架和轻量级后端（API Routes）。 |
| **PostgreSQL** | 9.2.24 | 关系型数据库，存储所有业务数据（用户、课题组、论文、帖子等）。支持复杂查询、事务和外键约束，保证数据完整性。pgvector 扩展用于 AI 向量存储。 |
| **Prisma** | 5.22.0 | ORM（对象关系映射）工具，将数据库表映射为 TypeScript 对象，简化数据库操作。支持类型安全的数据访问、自动迁移、 schema 管理。 |
| **PM2** | 6.0.14 | 进程管理器，用于在生产环境运行 Node.js 应用。提供进程守护（崩溃自动重启）、负载均衡、日志管理、性能监控等功能。 |
| **Node.js** | 20.19.6 | JavaScript 运行时环境，Next.js 基于它运行。选择 LTS 版本保证稳定性。 |
| **Git** | - | 版本控制系统，用于代码管理和团队协作。通过 GitHub 托管代码仓库。 |
| **Redis** | - | 内存数据库，用于缓存会话、实时消息队列、WebSocket 状态管理。可选，但推荐使用以提升性能。 |

### 技术栈架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户浏览器                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js (Node.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  App Router  │  │  API Routes │  │   Socket.io      │   │
│  │  (页面渲染)   │  │  (REST API) │  │   (实时通信)     │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │                                    │
          ▼                                    ▼
┌──────────────────┐              ┌──────────────────────────┐
│    PostgreSQL     │              │        Redis             │
│   (主数据库)      │              │     (缓存/会话/队列)      │
│   + pgvector      │              │                          │
└──────────────────┘              └──────────────────────────┘
```

---

## 已部署服务

### 组件状态

| 组件 | 版本 | 状态 |
|------|------|------|
| Next.js | 14.x | ✅ 已部署 |
| PostgreSQL | 9.2.24 | ✅ 运行中 |
| Prisma | 5.22.0 | ✅ 已配置 |
| PM2 | 6.0.14 | ✅ 已安装 |
| Node.js | 20.19.6 | ✅ 可用 |

### 数据库

- **数据库名**: `scholars_tea`
- **用户**: `dbuser` / `dbpass123`
- **Socket**: `/data/home/zju321/pgdata/run`
- **表数量**: 29 张

### 已创建的数据库表

```
Account, Citation, College, Comment, Department, Discipline,
GroupDiscipline, GroupMember, Institution, Message, News, Patent,
Post, PostPublication, PostTag, Publication, QuestionVote,
ResearchGroup, ScoreHistory, Session, Tag, TeaPartyRoom,
TeaPartyRoomParticipant, TopQuestion, User, VerificationToken, Vote
```

---

## 项目结构

```
/data/home/zju321/Scholar-s_Tea/
├── src/                    # Next.js 源码
│   ├── app/               # App Router 页面
│   ├── components/        # React 组件
│   ├── lib/              # 工具库
│   └── styles/           # 全局样式
├── prisma/
│   └── schema.prisma      # 数据库模型
├── scripts/
│   └── start-server.sh    # 启动脚本
│   └── auto-sync.sh       # 自动同步脚本 (可选)
├── ecosystem.config.js    # PM2 配置
├── package.json
├── .env                   # 环境变量（已配置）
└── node_modules/          # 依赖
```

---

## 启动方法

### 方式一：使用启动脚本（推荐）

```bash
cd /data/home/zju321/Scholar-s_Tea
./scripts/start-server.sh
```

### 方式二：手动启动

```bash
# 1. 启动 PostgreSQL
pg_ctl -D /data/home/zju321/pgdata -l /data/home/zju321/pgdata/logfile start

# 2. 进入项目目录
cd /data/home/zju321/Scholar-s_Tea

# 3. 构建（首次或代码更新后）
npm run build

# 4. 启动应用
pm2 start ecosystem.config.js
pm2 save
```

### 方式三：仅启动应用（PostgreSQL 已运行）

```bash
cd /data/home/zju321/Scholar-s_Tea
pm2 restart scholars-tea
```

---

## PM2 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs scholars-tea

# 重启应用
pm2 restart scholars-tea

# 停止应用
pm2 stop scholars-tea

# 监控（实时）
pm2 monit
```

---

## 访问地址

启动后访问：`http://10.72.212.33:3002`

---

## 配置说明

### 环境变量 (.env)

主要配置项：

```env
DATABASE_URL="postgresql://dbuser:dbpass123@localhost:5432/scholars_tea?host=/data/home/zju321/pgdata/run"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3002"
```

### 修改环境变量后

```bash
pm2 delete scholars-tea
pm2 start ecosystem.config.js
pm2 save
```

---

## Git 工作流

### 代码更新部署

```bash
# 1. 在本地完成代码修改
git add .
git commit -m "your changes"
git push server develop

# 2. 在服务器上拉取并重启
ssh -i "C:/Users/Mac/.ssh/id_ed25519_scholars_tea" zju321@10.72.212.33
cd /data/home/zju321/Scholar-s_Tea
git pull
pm2 restart scholars-tea
```

### 分支策略

- `develop` - 开发分支，所有功能开发都合并到这里
- 生产部署时 merge 到 main

### 自动版本同步

项目已配置自动版本管理功能，会定时将更改推送到 GitHub 仓库。

详细说明见下文「版本管理」章节。

---

## 版本管理

### 功能说明

自动版本同步脚本会在后台定时运行，确保服务器上的代码更改不会丢失。

### 工作原理

```
┌─────────────┐    定时任务     ┌─────────────┐    push     ┌─────────────┐
│  文件更改   │ ──────────────▶│  auto-sync  │ ──────────▶│  GitHub    │
│  (服务器)   │   (每30分钟)   │   脚本       │            │  仓库       │
└─────────────┘               └─────────────┘            └─────────────┘
```

### 手动执行同步

```bash
# 进入项目目录
cd /data/home/zju321/Scholar-s_Tea

# 运行同步脚本
./scripts/auto-sync.sh

# 或手动执行 git 命令
git add .
git commit -m "Auto-sync: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin develop
```

### 配置定时任务（可选）

如需修改自动同步间隔，编辑 crontab：

```bash
crontab -e

# 示例：每30分钟执行一次
*/30 * * * * cd /data/home/zju321/Scholar-s_Tea && ./scripts/auto-sync.sh >> logs/sync.log 2>&1

# 示例：每小时执行一次
0 * * * * cd /data/home/zju321/Scholar-s_Tea && ./scripts/auto-sync.sh >> logs/sync.log 2>&1
```

### 查看同步状态

```bash
# 查看最近同步时间
cat logs/sync.log

# 查看 git 状态
cd /data/home/zju321/Scholar-s_Tea && git log --oneline -5
```

### .gitignore 说明

以下文件/目录不会被推送到 GitHub：

| 路径 | 原因 |
|------|------|
| `.env` | 包含敏感信息（API密钥、数据库密码等） |
| `node_modules/` | 依赖目录，体积大且可从 package.json 重建 |
| `.next/` | 构建产物，运行时生成 |
| `prisma/*.db` | 本地 SQLite 数据库文件 |
| `logs/` | 日志文件 |
| `uploads/` | 用户上传的文件 |
| `coverage/` | 测试覆盖率报告 |

---

## 数据库操作

### 进入数据库

```bash
psql -h /data/home/zju321/pgdata/run -U dbuser -d scholars_tea
```

### 查看表

```sql
\dt
```

### 查看表结构

```sql
\d "User"
```

### 重置数据库（开发用）

```bash
# 停止应用
pm2 stop scholars-tea

# 删除并重建数据库
dropdb -h /data/home/zju321/pgdata/run -U dbuser scholars_tea
createdb -h /data/home/zju321/pgdata/run -U dbuser scholars_tea

# 同步 schema
npx prisma db push

# 重启应用
pm2 start ecosystem.config.js
```

---

## 功能模块

### 1. 课题组 (Research Groups)
- 课题组主页展示
- 成员管理
- 论文、新闻、专利发布
- AI 总结功能

### 2. 学科社区 (Disciplines)
- 学科树形结构（学科→二级学科→研究方向）
- 讨论帖子
- 跨学科标签系统

### 3. Top Ten Questions
- 每月热门话题投票
- 优质回答高亮
- 问题状态追踪

### 4. Tea Party（实时聊天）
- 公开/私密房间
- 文字聊天
- 聊天记录

### 5. 思想工坊 (AI Workshop)
- 学术 AI 对话
- 论文辅助
- RAG 知识库

---

## 故障排除

### PostgreSQL 无法启动

```bash
# 检查数据目录权限
ls -la /data/home/zju321/pgdata/

# 手动启动并查看日志
pg_ctl -D /data/home/zju321/pgdata -l /data/home/zju321/pgdata/logfile start
cat /data/home/zju321/pgdata/logfile
```

### PM2 应用无法启动

```bash
# 查看详细错误
pm2 logs scholars-tea --err --lines 50

# 检查环境变量
cd /data/home/zju321/Scholar-s_Tea
cat .env
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
ps aux | grep postgres

# 检查 socket 目录
ls -la /data/home/zju321/pgdata/run/
```

---

## 服务器信息

| 项目 | 值 |
|------|-----|
| 服务器 IP | 10.72.212.33 |
| SSH 用户 | zju321 |
| SSH 密钥 | `C:/Users/Mac/.ssh/id_ed25519_scholars_tea` |
| 项目路径 | `/data/home/zju321/Scholar-s_Tea` |
| PostgreSQL 路径 | `/data/home/zju321/pgdata` |
| GitHub 仓库 | https://github.com/photonics-dhl/Scholar-s-tea |
