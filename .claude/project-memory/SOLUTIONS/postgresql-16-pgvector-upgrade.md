# PostgreSQL 16 + pgvector 升级方案

> 记录从无 sudo 权限环境下，将 PostgreSQL 9.2 升级到 16 并部署 pgvector 的完整过程。
> 日期: 2026-05-29

---

## 环境约束

| 约束 | 详情 |
|------|------|
| **OS** | CentOS 7 (已 EOL) |
| **权限** | 无 sudo，无 root |
| **现有 PG** | 9.2.24，rpm 安装，用户手动运行 |
| **数据量** | 13 MB（scholars_tea 数据库） |
| **网络** | 外网慢（curl 30s 超时） |

## 方案：源码编译用户目录安装

由于无 sudo，无法使用 yum/dnf 安装新版本。PostgreSQL 支持 `--prefix=$HOME/xxx` 用户目录安装。

### 1. 源码下载

```bash
# 本地下载后通过 RaiDrive SFTP 上传到服务器
wget https://ftp.postgresql.org/pub/source/v16.4/postgresql-16.4.tar.bz2
wget https://github.com/pgvector/pgvector/archive/refs/tags/v0.7.4.tar.gz
```

### 2. 编译 PostgreSQL 16

```bash
cd /tmp
tar xjf postgresql-16.4.tar.bz2
cd postgresql-16.4
./configure --prefix=$HOME/pgsql16 --with-openssl --without-icu
make -j$(nproc)
make install
```

**编译时间**: ~15-20 分钟（24 核 Xeon Silver 4310）

### 3. 初始化数据目录

```bash
$HOME/pgsql16/bin/initdb -D $HOME/pgdata16 --encoding=UTF8
```

### 4. 数据迁移

```bash
# 备份旧数据
/usr/bin/pg_dumpall -h 127.0.0.1 -U zju321 > ~/pg_backup_$(date +%Y%m%d).sql

# 停止旧 PG
/usr/bin/pg_ctl -D ~/pgdata stop -m immediate

# 启动新 PG
$HOME/pgsql16/bin/pg_ctl -D $HOME/pgdata16 start

# 创建数据库并导入
$HOME/pgsql16/bin/createdb -U zju321 scholars_tea
$HOME/pgsql16/bin/psql -U zju321 -d scholars_tea -f ~/pg_backup_xxx.sql
```

### 5. 编译安装 pgvector

```bash
cd /tmp
tar xzf pgvector-0.7.4.tar.gz
cd pgvector-0.7.4
make PG_CONFIG=$HOME/pgsql16/bin/pg_config
make install PG_CONFIG=$HOME/pgsql16/bin/pg_config

# 在数据库中启用
psql -d scholars_tea -c 'CREATE EXTENSION vector;'
```

### 6. 向量数据类型迁移

旧数据 embedding 为 JSON 文本：`[0.1, 0.2, ...]`

```sql
-- KnowledgeDocument
ALTER TABLE "KnowledgeDocument" ADD COLUMN embedding_vec vector(1024);
UPDATE "KnowledgeDocument" SET embedding_vec = embedding::vector(1024)
  WHERE embedding IS NOT NULL AND embedding != '[]';
ALTER TABLE "KnowledgeDocument" DROP COLUMN embedding;
ALTER TABLE "KnowledgeDocument" RENAME COLUMN embedding_vec TO embedding;

-- ResearchMemory（同理）
```

## Prisma 集成

### Schema

```prisma
model KnowledgeDocument {
  // ...
  embedding Unsupported("vector")?
}
```

### 搜索（$queryRaw + pgvector <=>）

```typescript
const embeddingStr = '[' + embedding.join(',') + ']';
const distanceThreshold = 1 - threshold;

const results = await prisma.$queryRaw`
  SELECT id, title, content,
         (embedding <=> ${embeddingStr}::vector)::double precision AS distance
  FROM "KnowledgeDocument"
  WHERE embedding IS NOT NULL
    AND embedding <=> ${embeddingStr}::vector <= ${distanceThreshold}
  ORDER BY embedding <=> ${embeddingStr}::vector
  LIMIT ${limit}
`;

// similarity = 1 - distance
const similarity = 1 - Number(doc.distance);
```

**关键注意**：`<=>` 返回的 `real` 类型在 Prisma/Node.js pg 驱动中反序列化为 null，必须显式转换为 `double precision`。

### 插入/更新（$executeRaw）

`Unsupported` 类型不能通过 Prisma ORM `create`/`update` 设置：

```typescript
// 先 create 记录（不设置 embedding）
const doc = await prisma.knowledgeDocument.create({
  data: { title, content, ... }
});

// 再用 raw SQL 更新 embedding
const embStr = '[' + embedding.join(',') + ']';
await prisma.$executeRaw`
  UPDATE "KnowledgeDocument"
  SET embedding = ${embStr}::vector
  WHERE id = ${doc.id}
`;
```

## 自启动配置

```cron
# crontab -e
* * * * * $HOME/pgsql16/bin/pg_ctl -D $HOME/pgdata16 status >/dev/null 2>&1 \
  || $HOME/pgsql16/bin/pg_ctl -D $HOME/pgdata16 start -l $HOME/pgdata16/logfile >/dev/null 2>&1
```

## 回滚方案

1. 旧数据目录 `~/pgdata` 完整保留（65MB）
2. 旧备份 `~/pg_backup_20260529.sql` 保留
3. 如需回滚：停止 PG16 → 启动旧 PG（`pg_ctl -D ~/pgdata start`）→ 恢复 `.env` 配置

## 验证

```bash
$ ~/pgsql16/bin/postgres --version
postgres (PostgreSQL) 16.4

$ psql -d scholars_tea -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
 vector | 0.7.4

$ npx tsx -e "import {searchKnowledgeBase} from '@/lib/ai/rag-service'; \
  const r = await searchKnowledgeBase('optics', {limit: 3}); \
  console.log(r.results.map(x => x.title + ' (' + x.similarity.toFixed(2) + ')'));"
```
