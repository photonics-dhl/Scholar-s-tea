# Next.js 进程循环崩溃：pgvector 向量维度不匹配

**时间**: 2026-06-01  
**影响**: 前端无法登录，Workshop 页面打不开  
**状态**: ✅ 已修复

## 故障现象

- PM2 `scholars-tea` 22 分钟内重启 51 次
- 用户访问 Workshop 时页面 500/无法加载
- 本地 curl `127.0.0.1:3002` 返回 200（进程间歇性存活）

## 根因链

```
用户访问 Workshop
  → getContextForQuery() → Promise.all([searchKnowledgeBase, searchCommunityContent, searchMemories])
  → generateEmbedding(query)
    → generateEmbeddingViaLocal() → fetch failed (BGE-M3 偶发失败)
    → 回退 generateEmbeddingViaZChat()
      → 调用 ZChat API，模型 text-embedding-3-small
      → 返回 1536 维向量
  → searchKnowledgeBase() 用 1536 维向量查询 KnowledgeDocument
    → pgvector 报错: different vector dimensions 1024 and 1536
    → Prisma $queryRaw 抛出未捕获异常
    → Next.js 进程崩溃
    → PM2 自动重启
    → 循环重复
```

## 关键日志

```
[Embedding] Local generation error: fetch failed
[Embedding] Local BGE-M3 failed, falling back to ZChat API: fetch failed
prisma:error 
Invalid `prisma.$queryRaw()` invocation:
Raw query failed. Code: `22000`. Message: `ERROR: different vector dimensions 1024 and 1536`
```

## 数据状态

| 表 | 记录数 | embedding 维度 | 说明 |
|----|--------|---------------|------|
| KnowledgeDocument | 212 | 1024 (BGE-M3) | 全部一致 |
| ResearchMemory | 0 | — | 空表 |

## 修复

防御性维度校验：`searchKnowledgeBase` 和 `searchMemories` 中 `hasEmbedding` 从 `embedding.length > 0` 改为 `embedding.length === 1024`。

不匹配时回退到关键词搜索，避免 pgvector 崩溃。

**文件**: `src/lib/ai/rag-service.ts`

## 教训

- Embedding fallback 机制必须考虑维度一致性
- 本地服务（BGE-M3）与远程 fallback（ZChat/OpenAI）的向量维度可能不同
- pgvector 的维度不匹配会抛出未捕获异常，导致整个 Node.js 进程崩溃
- 应始终对 fallback 路径做防御性校验
