---
name: scholars-tea-db-query
description: 直接查询 Scholar's Tea PostgreSQL 数据库（绕过浏览器/API 故障），用于获取用户、帖子、课题组等社区数据。
version: 1.0.0
triggers:
  - 查询 Scholar's Tea 用户/帖子/课题组数据
  - 浏览器工具故障时需要查看社区数据
  - 用户问"最近注册的用户""社区数据""用户列表"等
---

# Scholar's Tea 数据库直查

## 适用场景
- 浏览器工具不可用（npm install 失败等）
- 社区 API 端点未知或不可用
- 需要快速获取用户、帖子、评论等结构化数据

## 数据库连接信息
- **类型**: PostgreSQL
- **连接串**: `postgresql://zju321@127.0.0.1:5432/scholars_tea`
- **来源**: `/data/home/zju321/321/DHL/Scholar's_Tea/.env` 中的 `DATABASE_URL`

## 项目技术栈
- Next.js + Prisma ORM + PostgreSQL
- Prisma schema: `/data/home/zju321/321/DHL/Scholar's_Tea/prisma/schema.prisma`

## 查询方法

### 关键注意事项
1. **Prisma 用双引号包裹表名和列名**（如 `"User"`, `"createdAt"`），psql 查询时必须加双引号
2. 用 shell 单引号包裹整个 SQL，内部用双引号：

```bash
psql "postgresql://zju321@127.0.0.1:5432/scholars_tea" -c 'SELECT "name", "email", "role", "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 10;'
```

### 常用查询

```bash
# 最近注册用户
psql "postgresql://zju321@127.0.0.1:5432/scholars_tea" -c 'SELECT "name", "email", "role", "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 10;'

# 用户总数
psql "postgresql://zju321@127.0.0.1:5432/scholars_tea" -c 'SELECT COUNT(*) FROM "User";'

# 最近帖子
psql "postgresql://zju321@127.0.0.1:5432/scholars_tea" -c 'SELECT "title", "createdAt" FROM "Post" ORDER BY "createdAt" DESC LIMIT 10;'

# 课题组列表
psql "postgresql://zju321@127.0.0.1:5432/scholars_tea" -c 'SELECT "name", "verificationStatus", "createdAt" FROM "ResearchGroup" ORDER BY "createdAt" DESC;'
```

## 主要表结构（从 Prisma schema 提取）

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| User | 用户 | name, email, role(USER/GROUP_ADMIN/ADMIN), createdAt |
| Post | 帖子 | title, content, authorId, disciplineId, groupId, createdAt |
| Comment | 评论 | content, authorId, postId, parentId, createdAt |
| ResearchGroup | 课题组 | name, slug, institutionId, verificationStatus, createdAt |
| GroupMember | 课题组成员 | userId, groupId, role(LEADER/ADVISOR/MEMBER) |
| Vote | 投票 | userId, postId/commentId, value |
| Publication | 论文 | title, authors[], year, doi, groupId |
| Account | OAuth 账号 | userId, provider, providerAccountId |

## 已知问题

1. **ngrok tunnel 端口映射**：ngrok 可能映射到 port 5000（card_server.py）而非 port 3000（主服务），导致外部访问失败
2. **浏览器工具不稳定**：`agent-browser` npm 包安装可能失败，不要依赖浏览器查数据
3. **测试账号多**：15 个用户中约 6 个是测试账号（含 test/playwright/SocketTest），分析时注意过滤
4. **重复注册**：存在同一用户因邮箱拼写错误注册两次的情况（如 FLYAJ/FlyAJ, gmail.com/gmai.com）

## 诊断路径

当需要查询社区数据时：
1. ❌ 先试浏览器 → 可能失败
2. ❌ 试 API 端点 → 大部分 404（Next.js API routes 可能未暴露）
3. ✅ **直接 psql 查询** → 最可靠
   - 路径：Prisma schema → 确认表结构 → .env 获取连接串 → psql 查询
