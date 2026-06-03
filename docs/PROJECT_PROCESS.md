# Scholar's Tea 项目开发进程记录

> 创建日期：2026-05-26 | 项目：Scholar's Tea（学者茶话会）
> 用途：记录各阶段开发内容、决策与状态，避免跨会话信息丢失

---

## 阶段一：PKB（私人知识库）注入断裂修复

**时间**：2026-05-21  
**状态**：✅ 已完成并部署

### 问题描述
AI Workshop 的私人知识库（PKB）功能无法正常工作：用户上传文献后，AI 回答中从不引用知识库内容。

### 根因分析（4 个）

| # | 根因 | 修复方案 |
|---|------|----------|
| 1 | `personalKBEnabled` 默认 `false`，页面刷新后丢失 | 持久化到 `localStorage`（key: `scholars-tea-pkb-enabled`） |
| 2 | Embedding API 配置 `_apiConfig` 仅存内存，刷新后丢失 | 页面加载时自动从 IndexedDB 预加载到内存 |
| 3 | `searchPersonalKB` 抛异常被静默 catch，用户完全不知道 | 添加 `pkbStatus` 状态，UI 实时显示搜索成功/失败/结果数 |
| 4 | System Prompt 未告诉 AI "请引用用户消息中的知识库内容" | `basePrompt` 中新增"知识库引用规范" |

### 修改文件
- `src/hooks/useChat.ts` — `personalKBEnabled` 持久化、`pkbStatus` 状态
- `src/components/features/workshop/ChatInput.tsx` — PKB 状态徽章
- `src/lib/ai/agent-modes.ts` — System Prompt 增强
- `src/lib/personal-kb/embedder.ts` — 配置预加载
- `src/lib/personal-kb/search.ts` — 异常不再静默

### 部署验证
- `npm run build` + `npm run build:socket` 成功
- PM2 三个进程全部重启正常

---

## 阶段二：PDF 公式提取质量检测

**时间**：2026-05-21  
**状态**：✅ 已完成并部署

### 问题描述
PDF 中的数学公式提取后出现大量乱码（CMMI/CMSY/STIX 等字体映射失败）。

### 解决方案
不追求完美提取（浏览器端无成熟方案），改为**检测+标记警告**：

| 新增功能 | 说明 |
|----------|------|
| 数学字体检测 | 识别 CMMI/CMSY/CMEX/STIX/LatinModernMath 等字体 |
| 乱码率计算 | 统计 Replacement Character (U+FFFD) 和控件字符比例 |
| 质量评级 | `good` / `fair` / `poor` |
| UI 警告 | 文献详情页显示黄色警告框，提示"自动提取可能不准确" |

### 修改文件
- `src/lib/personal-kb/pdf-extractor.ts` — 质量检测逻辑
- `src/app/(main)/personal-kb/page.tsx` — 质量警告 UI
- `src/lib/personal-kb/types.ts` — `PdfQualityReport` 类型扩展

### 已知限制
- 仅检测+标记，**未实现 LaTeX 还原**
- 完整方案需后端服务（Marker/MinerU）或 Vision API

---

## 阶段三：Marker PDF 后端部署（进行中）

**时间**：2026-05-26  
**状态**：🔄 进行中

### 目标
部署开源工具 **Marker** 作为后端 PDF 增强提取服务，自动在质量评级 `poor`/`fair`+公式警告时调用，将 PDF 转为含 LaTeX 公式的 Markdown。

### 决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 方案 | 后端 Marker CLI（非浏览器 WASM/插件） | WASM 加载慢且效果有限，插件无差异化 |
| 运行环境 | `ai_agent` conda env (Python 3.9.23) | 已有 torch/numpy，避免重复安装 |
| 调用方式 | Next.js API Route → `exec(marker_single)` | 无需常驻进程，按需运行 |
| 模型存储 | HuggingFace cache (`~/.cache/huggingface/hub`) | 自动管理，首次下载后复用 |

### 已解决问题

| # | 问题 | 解决方式 |
|---|------|----------|
| 1 | Python 3.9 不支持 `\|` 类型语法 | Patch surya 5 个文件，替换为 `Union`/`Optional` |
| 2 | transformers 4.57.6 `sdpa` 键缺失 | Patch surya ordering decoder |
| 3 | transformers 4.57.6 `KeyError: 'encoder'` | 降级 transformers 到 4.45.2 |
| 4 | 模型下载超时 | 分批并行下载，清理 incomplete 文件 |
| 5 | surya_order 加载慢 | 已完整下载（525MB） |

### 模型下载状态

| 模型 | 大小 | 状态 |
|------|------|------|
| `vikp/surya_det3` | 147 MB | ✅ |
| `vikp/surya_rec2` | 898 MB | ✅ |
| `vikp/texify` | 600 MB | ✅ |
| `vikp/surya_layout3` | 147 MB | ✅ |
| `vikp/surya_order` | 525 MB | ✅ |
| **总计** | **~2.3 GB** | — |

### 当前阻塞

**阻塞项**：Marker CLI 首次运行验证中。已修复所有兼容性问题，等待首次完整运行测试。

### 修改文件

- `src/app/api/v1/knowledge/extract-pdf/route.ts` — 新增 Marker 代理 API
- `src/hooks/usePersonalKB.ts` — 质量差时自动调用 Marker
- `src/lib/personal-kb/pdf-extractor.ts` — 质量评级逻辑（已有扩展）

### 待完成任务

- [ ] Marker CLI 首次运行验证成功
- [ ] 远程构建 `npm run build`
- [ ] 远程构建 socket server `npm run build:socket`
- [ ] PM2 重启
- [ ] 线上测试 PDF 上传（含公式）

---

---

## 阶段四：文献下载双平台路由修复 + ZIP 修复

**时间**：2026-05-31  
**状态**：✅ 已完成并部署

### 问题描述
1. Web UI 发起的论文下载，AI 会通过 `send_message`/`MEDIA:` 将 PDF 发送到飞书，造成跨平台泄漏
2. ZIP 批量下载报 `Internal Server Error`（`TypeError: c(...) is not a function`）
3. AI 回复中暴露服务器本地路径（如 `/data/home/zju321/...`）
4. ZIP 默认打包全部附件，无法选择

### 修复内容

| # | 问题 | 修复方案 |
|---|------|----------|
| 1 | Web→飞书跨平台泄漏 | `getDownloadTriggerHint()` 增加 `platform: 'web'` 参数，在 system prompt 中强制约束：禁止调用 `send_message`、`execute_code` 运行 `send_pdf_feishu.py`、禁止 `MEDIA:` 指令 |
| 2 | ZIP 下载 500 错误 | `archiver` 从 v8.0.0 降级到 v6.0.2（v8 是纯 ESM 无默认导出，Next.js webpack 打包后 `require` 失败） |
| 3 | 暴露服务器路径 | 修改 prompt："仅在回复末尾添加 `[ATTACHMENT:文件名.pdf]` 标记，严禁写出服务器本地文件路径" |
| 4 | ZIP 全量打包 | `BatchDownloadButton` 改为可展开的选择面板，用户勾选后打包下载 |

### 修改文件
- `src/lib/ai/paper-download-intent.ts` — `platform` 参数 + 平台约束 prompt
- `src/app/api/v1/ai/chat/route.ts` / `src/app/api/v1/hermes/chat/route.ts` — 传递 `platform: 'web'`
- `src/app/api/v1/hermes/download/batch-zip/route.ts` — `archiver` 导入修复
- `src/components/features/hermes/AttachmentActions.tsx` — ZIP 可选打包 UI
- `package.json` — `archiver@6.0.2`

---

## 阶段五：RAG 自检与 BGE-M3 修复

**时间**：2026-05-31  
**状态**：✅ 已完成

### 自检结果

| 组件 | 状态 | 详情 |
|------|------|------|
| BGE-M3 嵌入服务 | ✅ 正常 | PID 17177，dim=1024，HTTP 200 |
| pgvector 扩展 | ✅ 正常 | v0.7.4，`<=>` 算子可用 |
| KnowledgeDocument | ✅ 正常 | 212 条，100% 有 embedding |
| ResearchMemory | ⚠️ 空表 | 0 条记录，仅 ADMIN 可创建 |
| 向量搜索 | ✅ 正常 | similarity 0.56–0.67 |
| Workshop RAG 注入 | ✅ 正常 | `useRag: true`，`getContextForQuery()` 完整链路 |

### 修复内容
- **BGE-M3 500 错误**：`scripts/embedding-server.py` 增加空文本/null 字节过滤 + `try-except` 容错（批量失败时逐个回退，返回零向量而非崩溃）
- **确认模型优先级**：`generateEmbedding()` 已优先使用本地 BGE-M3，仅失败时回退 ZChat

### 架构结论
- 社区知识库 RAG：**服务端 BGE-M3 + pgvector**（符合预期）
- 个人知识库 RAG：**浏览器端 IndexedDB + @xenova/transformers**（符合预期）
- ResearchMemory：**服务端 pgvector，待迁移**（见阶段六）

---

## 阶段六：ResearchMemory 浏览器端迁移

**时间**：2026-05-31  
**状态**：✅ 已完成并部署

### 目标
将 `ResearchMemory`（研究记忆/想法/笔记）从服务端 pgvector 迁移到浏览器端存储，复用 personal-kb 的轻量嵌入基础设施。

### 架构决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 存储 | 浏览器 IndexedDB（复用 `scholars-tea-personal-kb` DB） | 与 personal-kb 共享 DB，减少 IndexedDB 连接数 |
| DB_VERSION | 2（原 1） | 升级时自动创建 `memories` store |
| 嵌入 | 复用 `embedText()`（API 或 @xenova/transformers） | 用户无需额外配置，向量维度自然一致 |
| 搜索 | 浏览器端 cosine similarity | 数据量小（用户笔记），浏览器内计算足够 |
| Workshop 注入 | 前端搜索后注入 `userMessage.content` | 与服务端 RAG 互补，不修改服务端路由 |

### 新增文件
- `src/lib/research-memory/types.ts` — 类型定义
- `src/lib/research-memory/storage.ts` — IndexedDB CRUD
- `src/lib/research-memory/search.ts` — `searchResearchMemories()` + `embedMemory()`
- `src/components/features/workshop/ResearchMemoryPanel.tsx` — Workshop 内嵌管理 UI

### 修改文件
- `src/lib/personal-kb/storage.ts` — DB_VERSION 1→2，新增 `memories` store
- `src/hooks/useChat.ts` — 发送消息前搜索 memories，注入 【用户研究笔记】上下文
- `src/app/(main)/workshop/WorkshopClient.tsx` — 集成 `ResearchMemoryPanel`

### 回滚策略
- 服务端 `ResearchMemory` 表、`rag-service.ts` 函数、admin API **全部保留**
- 新增代码集中在 `src/lib/research-memory/`，易于 revert

---

## 阶段七：登录失败紧急修复（2026-06-01）

**时间**: 2026-06-01  
**状态**: ✅ 已修复并部署

### 故障现象
- 前端网页无法登录，Workshop 页面打不开
- PM2 中 `scholars-tea` 进程 22 分钟内重启 51 次
- 本地 curl `127.0.0.1:3002` 返回 200，但用户请求时进程崩溃

### 根因分析（双重故障叠加）

#### 故障1：BGE-M3 间歇性 fetch 失败 → ZChat 回退 → pgvector 维度不匹配崩溃

| 链路 | 详情 |
|------|------|
| 触发条件 | 用户访问 Workshop，触发 `getContextForQuery()` → `searchKnowledgeBase()` |
| BGE-M3 | `generateEmbeddingViaLocal()` 偶发 `fetch failed`（原因待进一步排查，可能与 undici/代理/高负载有关） |
| 回退 | `generateEmbedding()` 回退到 `generateEmbeddingViaZChat()`，使用 `text-embedding-3-small`（**1536 维**） |
| 崩溃 | `searchKnowledgeBase()` 用 1536 维向量查询 `KnowledgeDocument`（**1024 维**）→ pgvector 报错 `different vector dimensions 1024 and 1536` |
| 后果 | Prisma `$queryRaw` 抛出未捕获异常 → Next.js 进程崩溃 → PM2 自动重启 → 循环崩溃 |

#### 故障2：archiver webpack externalize 不兼容

| 问题 | 详情 |
|------|------|
| 源码 | `import archiver from 'archiver'`（ESM 默认导入） |
| 打包 | webpack externalize 后编译为 `let u=require("archiver");var c=t.n(u);c()("zip",...)` |
| 运行时 | `archiver@6` 是 CommonJS，`t.n(u)` 返回命名空间对象 `{a: getter}`，不是 callable 函数 |
| 后果 | `c()` 调用对象 → `TypeError: c(...) is not a function` → ZIP 下载 500 |

### 修复内容

#### 修复1：embedding 维度防御性校验

`src/lib/ai/rag-service.ts`：
- `searchKnowledgeBase()`：`hasEmbedding` 从 `embedding.length > 0` 改为 `embedding.length === 1024`
- `searchMemories()`：同样增加 `=== 1024` 校验
- 效果：ZChat 回退返回 1536 维时，视为无 embedding，回退到关键词搜索，不再崩溃

#### 修复2：archiver CommonJS 兼容导入

`src/app/api/v1/hermes/download/batch-zip/route.ts`：
- `import archiver from 'archiver'` → `const archiver = require('archiver') as any`
- 效果：webpack externalize 后直接得到 CommonJS 函数，无需 `__webpack_require__.n` 包装

### 验证
- `npm run build` 成功
- PM2 重启后 `unstable restarts: 0`，uptime 持续稳定增长
- ZIP 下载：`HTTP 200`，有效 zip 文件
- 本地 curl：`200 0.020s`

### 遗留问题
- BGE-M3 偶发 `fetch failed` 的根因仍需排查（undici ProxyAgent 是否间接影响 localhost？或高负载导致？）
- 当前维度校验是防御性修复，不影响正常 BGE-M3 路径

---

## 阶段八：待规划

| 功能 | 优先级 | 状态 |
|------|--------|------|
| BGE-M3 偶发 fetch failed 根因排查 | 高 | 已防御性修复，待根治 |
| Marker CLI 首次运行验证 | 高 | 🔄 待测试（模型全部下载完成） |
| Vision API 兜底方案（ZCHAT） | 中 | 未开始，作为 Marker 的 fallback |
| Workshop 聊天直接上传 PDF（非知识库） | 低 | 已有 `/api/v1/ai/extract-pdf`，可扩展 |
| PyMuPDF WASM 浏览器方案 | 低 | 已调研，效果提升有限，暂缓 |
| ResearchMemory 服务端表清理 | 低 | 浏览器端方案已运行稳定后可清理 |

---

## 关键配置速查

### 服务器
- **IP**: `10.72.212.33`
- **SSH**: `ssh ZJU-MSE-HPC`
- **项目路径**: `/data/home/zju321/scholars`
- **用户**: `zju321`

### 进程（PM2）
| 名称 | 端口 | 内存限制 |
|------|------|----------|
| `scholars-tea` | 3002 | 1 GB |
| `scholars-tea-socket` | 3001 | 512 MB |
| `scholars-tea-embedding` | 9997 | 5 GB |

### 数据库
- **类型**: PostgreSQL 9.2.24 + pgvector
- **数据库名**: `scholars_tea`
- **用户**: `zju321`

### 构建命令
```bash
# 根目录
npm run build

# Socket server
cd server && npm run build

# PM2 重启
pm2 restart ecosystem.config.js
```

---

## 相关文档索引

| 文档 | 路径 | 内容 |
|------|------|------|
| 部署评估 | `docs/MARKER_DEPLOYMENT_ASSESSMENT.md` | Marker 资源占用与架构影响评估 |
| 技术方案 | `docs/PDF_FORMULA_EXTRACTION_PLAN.md` | PDF 公式提取三层级方案 |
| 基础设施 | `docs/MARKER_INFRASTRUCTURE.md` | Marker 模型/环境/配置全记录 |
| 项目进程 | `docs/PROJECT_PROCESS.md` | 本文件 |
| 项目记忆 | `.claude/project-memory/` | AI 助手持久化记忆（MEMORY_INDEX.md 为索引） |
| Embedding 500 错误 | `.claude/project-memory/ERRORS/embedding-server-500.md` | BGE-M3 500 错误记录 |
| Archiver ESM 错误 | `.claude/project-memory/ERRORS/archiver-v8-esm-broken.md` | archiver v8 ESM 兼容问题 |
| Embedding 修复方案 | `.claude/project-memory/SOLUTIONS/embedding-server-500-fix.md` | BGE-M3 500 修复 |
| Archiver 降级方案 | `.claude/project-memory/SOLUTIONS/archiver-v8-downgrade.md` | archiver v8→v6 降级 |
| ResearchMemory 迁移 | `.claude/project-memory/SOLUTIONS/research-memory-browser-migration.md` | 浏览器端迁移详细方案 |
