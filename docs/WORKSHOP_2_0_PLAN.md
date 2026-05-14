# Workshop 2.0 + Hermes Skills 整合规划

> 目标：将思想工坊打造为高用户粘性的技术护城河
> 日期：2026-05-13

---

## 一、当前现状诊断

### 1.1 Workshop（思想工坊）现状

| 维度 | 现状 | 问题 |
|------|------|------|
| **架构** | 直接调用 MiniMax API，无中间层 | 无工具能力，无真实数据接入 |
| **模式** | 8 种学术模式（general/paper/grant/survey/research/peer_review/paper_generation/community_manager） | 每种模式都是"一次性问答"，无多轮工作流 |
| **论文生成** | 本地 5 阶段 skill（proposal→structure→writing→data→formatting） | 仅注册 1 个 skill，引用靠 AI 自评，无真实数据库验证 |
| **会话持久化** | localStorage（浏览器本地） | 换设备丢失，无法积累用户学术画像 |
| **RAG** | 接入社区 KnowledgeDocument + ResearchMemory | 质量中等，无外部学术数据库 |

### 1.2 Hermes FloatingChat 现状

| 维度 | 现状 | 优势 |
|------|------|------|
| **架构** | 通过 Hermes Gateway（端口 8642）调用 | 拥有 107+ skills（搜索/arXiv/代码执行/浏览器等） |
| **工具调用** | ✅ 支持 skills_list / browser / execute_code / todo / memory | 可执行真实操作，不只是对话 |
| **记忆** | Gateway 维护跨会话持久记忆 | 能记住用户偏好和历史 |
| **技能** | research-paper-writing / arxiv / jupyter-live-kernel / github 等 | 可直接用于学术场景 |

### 1.3 核心矛盾

```
Workshop：功能强但"静态" —— 有论文生成模板，但无法搜论文、无法跑代码、无法验证引用
Hermes：能力强但"分散" —— 有全套研究技能，但入口是浮动聊天，无学术工作流引导
```

**结论**：两者是"左右手互搏"，没有形成合力。

---

## 二、整合架构设计

### 2.1 目标架构：Workshop 2.0

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Workshop 2.0 前端                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ 论文写作    │  │ 论文审阅    │  │ 基金申请    │  │ 通用学术助手    │ │
│  │ (Writing)   │  │ (Review)    │  │ (Grant)     │  │ (General)       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                │                   │          │
│         └────────────────┴────────────────┴───────────────────┘          │
│                                    │                                     │
│                         ┌──────────▼──────────┐                         │
│                         │   模式路由器         │                         │
│                         │  (Mode Router)      │                         │
│                         └──────────┬──────────┘                         │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ↓                ↓                ↓
           ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
           │ 本地 FastPath│  │ Hermes      │  │ 社区 RAG    │
           │ (直接 MiniMax)│  │ Gateway     │  │ 服务        │
           │              │  │ (工具增强)   │  │             │
           └─────────────┘  └──────┬──────┘  └─────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ↓              ↓              ↓
              ┌─────────┐  ┌──────────┐  ┌──────────────┐
              │ arxiv   │  │ jupyter  │  │ research-    │
              │ skill   │  │ kernel   │  │ paper-writing│
              └─────────┘  └──────────┘  └──────────────┘
```

### 2.2 三种调用路径

| 路径 | 场景 | 技术实现 |
|------|------|---------|
| **FastPath** | 通用问答、简单对话 | 保持现有 `claude-service.ts` 直接调用 MiniMax，低延迟 |
| **Hermes Gateway** | 需要工具能力的复杂任务（搜论文、跑代码、验证引用） | Workshop API 转发到 `hermes/chat/route.ts`，由 Gateway 调度 skills |
| **社区 RAG** | 需要引用平台内帖子/论文/讨论 | 复用现有 `rag-service.ts`，增强为实时检索 |

### 2.3 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| Workshop 是否完全迁移到 Gateway？| **否，混合架构** | FastPath 保持低延迟；Gateway 用于需要工具的场景 |
| 用户画像存在哪里？| **数据库（Prisma User 表扩展）** | 跨设备同步，可分析用户行为 |
| 会话历史存在哪里？| **数据库（新增 ChatSession 表）** | 换设备不丢失，支撑画像构建 |
| 引用验证怎么做？| **Semantic Scholar API + arXiv API** | 真实数据库校验，非 AI 自评 |

---

## 三、核心功能规划（技术护城河）

### 3.1 🏆 护城河 1：用户学术画像驱动的个性化

**核心逻辑**：AI 助手不是"通用"的，而是"懂你的"。

**画像数据源**：

| 数据来源 | 采集方式 | 画像维度 |
|---------|---------|---------|
| 用户注册信息 | 手动填写 | 姓名、机构、研究方向、职称 |
| 发帖/评论历史 | 自动采集 | 关注领域、表达能力、学术兴趣 |
| 收藏的论文/帖子 | 自动采集 | 知识偏好、研究深度 |
| Workshop 使用记录 | 自动采集 | 写作习惯、常见需求、薄弱环节 |
| 所属课题组 | 自动采集 | 合作网络、学科背景 |

**画像注入提示词示例**：

```
用户画像：
- 身份：浙江大学博士生，研究方向为计算机视觉
- 近期关注：多模态学习、Transformer 架构改进
- 写作特点：方法论描述较详细，但 Related Work 部分薄弱
- 历史需求：3 次请求论文生成，2 次请求基金申请帮助
- 所属课题组：人工智能实验室（导师：张教授）

请基于以上画像，为用户提供个性化的论文写作建议。
```

**技术实现**：
- 扩展 `User` 表，增加 `academic_profile` JSON 字段
- 后台定时任务分析用户行为，更新画像标签
- Workshop 每个请求自动携带画像摘要注入 system prompt

---

### 3.2 🏆 护城河 2：真实引用验证（非 AI 幻觉）

**当前问题**：论文生成中的 `[REF-N]` 引用靠 AI 自评，~40% 错误率。

**解决方案**：

```
用户请求：写一篇关于 GRPO 强化学习的综述

Step 1: AI 生成初稿（含 [REF-1], [REF-2]... 占位符）
Step 2: 提取所有占位符 → 调用 arXiv skill 搜索真实论文
Step 3: 调用 Semantic Scholar API 验证：
  - 论文是否存在？
  - 引用数多少？
  - 是否 open access？
Step 4: 替换占位符为真实引用，标记"AI 建议引用"
Step 5: 生成 BibTeX（通过 DOI content negotiation）
```

**引用验证状态标记**：

| 标记 | 含义 | 颜色 |
|------|------|------|
| ✅ 已验证 | 通过 arXiv/Semantic Scholar 确认存在 | 绿色 |
| ⚠️ 待核实 | AI 生成但无数据库匹配，需用户确认 | 橙色 |
| ❌ 未找到 | 数据库中不存在，可能为幻觉 | 红色 |

---

### 3.3 🏆 护城河 3：社区数据专属 RAG

**核心逻辑**：Scholar's Tea 平台上的帖子、论文、讨论 → 专属知识库 → 竞品无法复制。

**应用场景**：

```
用户问："我想申请国家自然科学基金青年项目，有什么建议？"

传统 AI：通用建议（网上都能搜到）
社区 RAG："根据平台上 3 位成功申请者的经验帖（链接），以及导师张教授组内的历年申请书模板..."
```

**数据范围**：
- 用户所在课题组的论文和专利
- 平台上的热门讨论帖（Top10）
- 学科板块的精华帖子
- 用户关注学者的研究成果

---

### 3.4 🏆 护城河 4：分阶段工作流（非一次性问答）

**当前问题**：用户问一次，AI 答一次，没有持续协作。

**解决方案**：Project 模式 —— 像 Git 分支一样管理学术项目。

```
Project: "我的第一篇 CVPR 论文"
├── Phase 1: 选题立项 [完成]
│   └── 输出：开题报告.md
├── Phase 2: 文献综述 [进行中]
│   └── 输出：related_work.md（20 篇已验证引用）
├── Phase 3: 实验设计 [待开始]
├── Phase 4: 论文撰写 [待开始]
└── Phase 5: 投稿准备 [待开始]
```

**每个 Phase 的特性**：
- 可暂停、可回退、可分支（"试试另一个选题方向"）
- 输出物保存到数据库（可导出 .md / .tex / .docx）
- AI 记住项目上下文，下次继续

---

## 四、具体功能模块设计

### 4.1 论文写作助手（Paper Writing）

**当前状态**：本地 5 阶段 skill，无真实数据接入

**2.0 升级**：

| 阶段 | 1.0 能力 | 2.0 升级 |
|------|---------|---------|
| **选题立项** | AI 生成选题建议 | + arXiv 实时检索最新论文 + Semantic Scholar 分析热点趋势 + 用户画像匹配 |
| **文献综述** | AI 生成综述框架 | + 自动检索 20-50 篇真实论文 + 引用验证 + BibTeX 生成 + 社区 RAG 补充 |
| **正文写作** | 分章节生成 | + LaTeX 模板实时预览 + 图表生成建议 + 写作风格匹配用户历史 |
| **数据分析** | 统计方法建议 | + Jupyter 内核执行真实代码 + 生成可复现的图表 + 自动统计检验 |
| **排版交付** | LaTeX/Markdown 转换 | + Overleaf 一键导出 + 期刊模板匹配 + 格式自检 |

**UI 升级**：
- 左侧：项目文件树（类似 VS Code）
- 右侧：聊天 + 实时预览（LaTeX/图表）
- 顶部：阶段进度条 + 引用验证状态

---

### 4.2 论文审阅助手（Peer Review）

**当前状态**：7 维度评审框架，无真实对比数据

**2.0 升级**：

| 维度 | 1.0 能力 | 2.0 升级 |
|------|---------|---------|
| **原创性评估** | AI 判断 | + arXiv 检索对比相似论文 + Semantic Scholar 查重建议 |
| **方法论审查** | AI 评估方法合理性 | + 代码执行验证实验可复现性 + 统计检验复核 |
| **引用审查** | 检查引用格式 | + 真实数据库验证每篇引用 + 标记缺失的关键文献 |
| **写作质量** | 语言润色建议 | + 对标顶刊写作风格 + 具体修改建议（行内标注） |

**输出格式**：
- 结构化评审报告（可导出 PDF）
- 行内批注（类似 Google Docs 的评论）
- 修改优先级（P0/P1/P2）

---

### 4.3 基金申请助手（Grant Application）

**当前状态**：基础立项依据和技术路线建议

**2.0 升级**：

| 功能 | 1.0 能力 | 2.0 升级 |
|------|---------|---------|
| **立项依据** | AI 生成背景 | + 实时检索最新进展（arXiv + 基金委官网）+ 用户画像匹配研究基础 |
| **研究内容** | 大纲建议 | + 图表自动生成（技术路线图）+ 创新点对比矩阵 |
| **研究基础** | 通用建议 | + 自动提取用户历史论文/专利 + 生成工作基础列表 |
| **预算编制** | 通用模板 | + 根据研究内容自动估算 + 符合基金委规范 |
| **格式审查** | 无 | + 基金委申请书格式自检 + 字数统计 + 必填项检查 |

---

### 4.4 新增：数据/图表助手（Data & Figures）

**利用 jupyter-live-kernel skill**：

```
用户上传 CSV/Excel → AI 分析数据 → 生成图表 → 导出论文可用格式

支持：
- 统计检验（t-test, ANOVA, 卡方检验）
- 图表生成（Matplotlib/Seaborn → PDF/PNG）
- 数据清洗建议
- 结果解释（p-value 含义、效应量）
```

---

## 五、技术实现路径

### 5.1 Phase 1：接入 Hermes Gateway（2-3 周）

**目标**：让 Workshop 的复杂模式能调用 Hermes 的 skills

**改动点**：

```
src/app/api/v1/ai/chat/route.ts
  └── 新增 hermesGateway 调用分支
      └── 当 mode ∈ {paper_generation, peer_review, grant} 且需要工具时
          └── 转发到 Hermes Gateway（复用 hermes/chat/route.ts 逻辑）

src/lib/ai/skills/
  └── 新增 workshop-skills/
      ├── arxiv-search.ts        # 封装 arXiv API + Semantic Scholar
      ├── citation-verifier.ts   # 引用验证流水线
      └── jupyter-bridge.ts      # Jupyter 内核调用封装
```

**关键代码**：

```typescript
// Workshop API 中的路由判断
if (mode === 'paper_generation' && needsToolCapability(message)) {
  // 走 Hermes Gateway 路径
  const response = await callHermesGateway({
    messages,
    mode: 'research-paper-writing',
    sessionId: userId,
    personality: 'professor',
  })
} else {
  // 走 FastPath
  const response = await chatWithAIStream({ messages, mode })
}
```

### 5.2 Phase 2：用户学术画像（2-3 周）

**数据库变更**：

```prisma
model UserAcademicProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  
  // 基础信息
  institution String?
  department  String?
  title       String?  // 教授/副教授/博士/硕士
  researchFields String[] // 研究方向标签
  
  // 行为画像（自动采集）
  interests   Json?    // {topics: [], keywords: []}
  writingStyle Json?   // {strengths: [], weaknesses: []}
  skillGaps   Json?    // {areas: [], frequency: []}
  
  // 使用统计
  totalSessions Int    @default(0)
  totalPapers   Int    @default(0)
  totalGrants   Int    @default(0)
  
  updatedAt   DateTime @updatedAt
}
```

**画像更新机制**：
- 每次 Workshop 会话结束后，异步分析用户输入，提取关键词和主题
- 每周定时任务：汇总行为数据，更新画像标签

### 5.3 Phase 3：社区 RAG 增强（2 周）

**增强现有 RAG**：

```
当前 RAG：KnowledgeDocument + ResearchMemory（通用知识）
增强后：+ Post（帖子）+ Publication（论文）+ Comment（评论）+ Group（课题组动态）

检索优先级：
1. 用户所在课题组的数据
2. 用户关注学科的热门内容
3. 平台全局热门内容
```

### 5.4 Phase 4：Project 工作流（3-4 周）

**新增数据模型**：

```prisma
model WorkshopProject {
  id          String   @id @default(cuid())
  userId      String
  name        String
  type        String   // paper / grant / survey
  status      String   // active / completed / archived
  
  phases      WorkshopPhase[]
  outputs     WorkshopOutput[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WorkshopPhase {
  id          String   @id @default(cuid())
  projectId   String
  name        String   // proposal / structure / writing / data / formatting
  status      String   // pending / active / completed / skipped
  order       Int
  
  messages    Json[]   // 该阶段的对话历史
  output      String?  // 阶段输出物
  
  createdAt   DateTime @default(now())
  completedAt DateTime?
}
```

---

## 六、与 FloatingChat 的关系

### 6.1 定位区分

| 维度 | Workshop 2.0 | FloatingChat |
|------|-------------|--------------|
| **定位** | 深度学术工作流 | 轻量日常问答 |
| **场景** | 写论文、申基金、做实验 | 查资料、问问题、闲聊 |
| **入口** | 独立页面 `/workshop` | 全局浮动按钮 |
| **工具** | 全量 skills + 用户画像 + 社区 RAG | 基础 skills |
| **会话** | Project 级持久化（数据库）| Session 级持久化（Gateway）|

### 6.2 共享基础设施

```
共享层：
├── Hermes Gateway（skills 调度）
├── arXiv / Semantic Scholar API（引用验证）
├── Jupyter Kernel（代码执行）
└── 用户学术画像（数据库）

差异层：
├── Workshop：Project 工作流 + 社区 RAG + LaTeX 预览
└── FloatingChat：快速问答 + 人格切换 + 全局可见
```

---

## 七、实施优先级

| 优先级 | 功能 | 工作量 | 用户价值 | 护城河强度 |
|--------|------|--------|---------|-----------|
| **P0** | 接入 Hermes Gateway（论文生成走 Gateway） | 2 周 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **P0** | 引用验证（arXiv + Semantic Scholar） | 1 周 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **P1** | 用户学术画像系统 | 2 周 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **P1** | Workshop 会话持久化（数据库） | 1 周 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **P2** | 社区 RAG 增强 | 2 周 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **P2** | Project 工作流模式 | 3 周 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **P3** | Jupyter 内核集成（数据分析） | 2 周 | ⭐⭐⭐ | ⭐⭐⭐ |
| **P3** | LaTeX 实时预览 + Overleaf 导出 | 2 周 | ⭐⭐⭐⭐ | ⭐⭐ |

---

## 八、风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| Hermes Gateway 不稳定 | Workshop 复杂模式不可用 | 保持 FastPath 兜底，Gateway 失败时自动降级 |
| arXiv API 限流 | 引用验证慢 | 本地缓存 + 异步验证 + 队列处理 |
| 用户画像隐私顾虑 | 用户反感 | 明确告知采集范围 + 提供"隐身模式" + 数据本地化处理 |
| 社区 RAG 质量差 | 回答不相关 | 语义检索 + 人工标注反馈 + 持续优化 embedding |
| 工作流过于复杂 | 用户流失 | 提供"快速模式"（跳过阶段）+ 智能推荐下一步 |

---

## 九、成功指标

| 指标 | 当前基线 | 3 个月目标 | 6 个月目标 |
|------|---------|-----------|-----------|
| Workshop 日均活跃会话 | ? | +50% | +100% |
| 平均会话时长 | ? | +30% | +60% |
| 用户留存（7 日） | ? | +20% | +40% |
| 论文生成完成率 | ? | 30% | 50% |
| 引用验证准确率 | ~60%（AI 自评） | 90% | 95% |
| 用户画像覆盖率 | 0% | 50% | 80% |

---

> 下一步：如需实施，可从 P0 的「接入 Hermes Gateway + 引用验证」开始，预计 3 周内交付可用版本。
