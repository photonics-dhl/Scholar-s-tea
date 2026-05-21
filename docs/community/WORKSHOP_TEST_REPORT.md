# AI Workshop 操作指南与测试报告

> **定位**：面向普通用户的快速上手指册 + 面向开发者的测试记录与修复历史
>
> **当前模型**：GLM-5.1（ZAI Coding Plan）为主模型，MiniMax-M2.7 为备选，ZCHAT/DeepSeek 为回退
>
> **文档更新日期**：2026-05-19（新增：四阶段学术 AI 质量提升计划 — 结构化输出 + 可视化评分表/基金向导）

---

## 第一部分：用户快速上手指南

### 一、如何打开 Workshop

**入口**：访问站点 → 顶部导航「AI Workshop」→ 进入对话界面

**直接 URL 访问**（按模式）：

| 模式 | URL | 用途 |
|------|-----|------|
| 通用助手 | `/workshop?mode=general` | 日常学术问答、概念解释 |
| 论文辅助 | `/workshop?mode=paper` | 论文分析、摘要生成、表达改进 |
| 基金申请 | `/workshop?mode=grant` | 基金本子撰写辅助 |
| 文献综述 | `/workshop?mode=survey` | 综述结构设计、方法比较 |
| 研究方向 | `/workshop?mode=research` | 前沿趋势、可行性评估 |
| 社群管家 | `/workshop?mode=community_manager` | 社区运营分析与策划 |
| AI 审稿 | `/workshop?mode=peer_review` | 论文同行评审 |
| AI 论文生成 | `/workshop?mode=paper_generation` | 按阶段生成完整论文 |

**模式切换**：点击顶部模式选择器（如「通用助手 ▼」）即可在 8 个模式间切换，切换时自动创建新对话。

---

### 二、8 个模式详解

#### 1. 通用助手（general）

**一句话用途**：日常学术问答，就像一位随时在线的研究助理。

**适合问什么**：
- 概念解释：「什么是可重构超表面？」
- 方法论：「简述 Transformer 架构在物理建模中的应用」
- 文献推荐：「推荐几篇关于拓扑绝缘体表面的综述」
- 英文润色：「帮我润色这段摘要...」

**怎么用**：
1. 打开通用助手模式
2. 在输入框中输入问题
3. 按 **Enter** 发送，**Shift+Enter** 换行
4. AI 流式输出回答

---

#### 2. 论文辅助（paper）

**一句话用途**：分析论文核心贡献、生成摘要、改进学术表达。

**适合问什么**：
- 「分析这篇论文的创新点和局限性」
- 「帮我生成一段 200 字的中文摘要」
- 「这段英文表达不够学术，帮我改写」

**怎么用**：
1. 打开论文辅助模式
2. 可直接粘贴论文内容，或上传 PDF（见「通用功能 → PDF 上传」）
3. 描述你的需求，AI 给出针对性回答

---

#### 3. 基金申请（grant）

**一句话用途**：辅助撰写国家自然科学基金、省市基金等申请书。

**适合问什么**：
- 「帮我写一段立项依据，主题是超表面偏振调控」
- 「提炼这段研究内容的技术路线」
- 「这段创新点表述不够有力，帮我优化」

---

#### 4. 文献综述（survey）

**一句话用途**：设计文献综述结构，比较不同方法，识别研究空白。

**适合问什么**：
- 「帮我设计一个关于深度学习图像分割的综述大纲」
- 「对比 Transformer 和 CNN 在医学影像中的表现」
- 「这个领域还有哪些研究空白值得探索？」

---

#### 5. 研究方向（research）

**一句话用途**：评估研究想法可行性，发现跨学科创新机会。

**适合问什么**：
- 「将超表面与量子计算结合，这个方向有前景吗？」
- 「我目前的课题 A 和课题 B 如何找到交叉点？」
- 「帮我分析这个研究问题的可行性」

---

#### 6. 社群管家（community_manager）

**一句话用途**：分析「学者茶话会」社区运营状况，提供活动策划建议。

**适合问什么**：
- 「最近社区的热门话题是什么？」
- 「帮我策划一次关于超表面的线上茶话会」
- 「分析我们社区的活跃度和改进建议」

---

#### 7. AI 审稿（peer_review）—— 最复杂模式，重点掌握

**一句话用途**：对论文进行多维度同行评审，输出结构化评审报告。

**评审侧重点**（切换按钮）：

| 侧重 | 评审内容 |
|------|---------|
| **全面评审** | 领域判定 + 评分 + 优点 + 问题 + 建议（最常用） |
| **方法评审** | 重点关注方法论、实验设计、数据可靠性 |
| **写作评审** | 重点关注逻辑结构、语言表达、图表质量 |
| **改进建议** | 只输出修改建议，按 P0/P1/P2 优先级排序 |

**操作方式**：

**方式一：上传 PDF（推荐）**
1. 切换到「AI 审稿」模式
2. 选择评审侧重点（默认「全面评审」）
3. 点击「上传 PDF」，选择论文 PDF（最大 10MB）
4. 等待提取完成，右侧显示 PDF 信息卡片（页数、字符数、是否截断）
5. （可选）在文本框中输入补充说明，例如「重点关注方法创新性」
6. 点击「开始评审」
7. AI 约 **60-120 秒**后返回完整评审报告

**方式二：粘贴论文内容**
1. 切换到「AI 审稿」模式
2. 在文本框中粘贴论文内容（支持多次粘贴，AI 会综合处理）
3. 选择评审侧重点 → 点击「开始评审」

**方式三：混合使用**
- 先上传 PDF 提取内容，再在文本框中添加补充说明
- 两者会一起提交给 AI

**评审报告结构**：
- 论文领域判定
- 总体评分（含各维度打分）
- 论文优点
- 主要问题（按优先级排序）
- 修改建议（P0 必须改 / P1 建议改 / P2 可选改）
- 最终建议（接受/小修/大修/拒稿）

> ⚠️ **注意**：PDF 上传后不可重试。如需重试，请重新上传 PDF。

**PDF 内容处理说明**：
- **审稿模式**：PDF 全文通过后台提交给 AI，**对话框只显示摘要卡片**，不显示全文，避免刷屏
- **其他模式**：PDF 内容直接注入到最后一条用户消息中

---

#### 8. AI 论文生成（paper_generation）—— 分阶段生成

**一句话用途**：按 5 阶段流程，从零开始生成一篇完整学术论文。

**5 个阶段**：

| 阶段 | 名称 | 输出 |
|------|------|------|
| 1 | 选题立项 | 研究问题、创新点、技术路线大纲 |
| 2 | 架构规划 | 论文结构、章节安排、逻辑框架 |
| 3 | 正文写作 | 各章节正文内容 |
| 4 | 数据/图表 | 数据描述、图表建议、**支持上传数据图片进行视觉分析** |
| 5 | 排版交付 | 最终格式化输出，可导出 Markdown / LaTeX / 纯文本 |

**操作步骤**：
1. 输入论文主题和研究背景（越详细越好）
2. 点击「开始生成」→ 进入第 1 阶段（选题立项）
3. 审阅 AI 输出，确认或修改后进入下一阶段
4. 依次完成 5 个阶段
5. 最终导出格式

> ⏱️ **耗时提示**：第 1 阶段约 90-100 秒（含 Tavily 文献检索），后续阶段约 10-30 秒。

**第 4 阶段（数据/图表）支持上传数据图片**：
- 在第 4 阶段，你可以上传自己的数据图表（柱状图、折线图、散点图、热力图等）
- AI 将结合图片进行视觉分析，给出更精准的统计方法建议和图表改进意见
- 支持上传多张图片，AI 会逐一分析每张图表的内容和特征
- 即使没有文字描述，仅上传图片也能触发分析

---

### 三、通用功能说明

#### 3.1 消息输入

- **Enter**：发送消息
- **Shift+Enter**：在消息中换行（多行输入）
- 支持粘贴文本、图片

#### 3.2 PDF 上传（所有模式通用）

支持**拖拽上传**或**点击上传**，最大 10MB。

**不同模式下的行为差异**：

| 模式 | PDF 内容处理方式 |
|------|-----------------|
| AI 审稿 | 后台提交给 AI，对话框只显示摘要卡片 |
| 其他 7 个模式 | PDF 内容直接附加到最后一条用户消息中 |

**PDF 内容上限**：约 **30000 字符**（超过部分会被智能截断，优先保留正文章节）

**上传失败怎么办**：
- 错误消息会显示在对话框中，点击「重试」按钮可重试
- 503 错误通常是网络波动，稍后重试即可
- 如持续失败，尝试缩小 PDF 文件大小，或改为分段粘贴内容

#### 3.3 新建对话

- 点击左侧「新建对话」按钮
- 切换模式时自动创建新对话
- 登录用户的对话历史会同步到数据库
- **未登录用户**：对话保存在浏览器本地，清除浏览器数据会丢失

#### 3.4 代码块复制

AI 输出的代码块右上角有「复制」按钮：
- 鼠标悬停代码块 → 右上角显示「复制」按钮
- 点击 → 代码复制到剪贴板 → 按钮变为「已复制」（绿色，2 秒后恢复）

#### 3.5 错误处理

如果 AI 响应失败：
- 错误消息会显示在对话框中，带「重试」按钮
- 点击「重试」会重新发送上一条消息
- 503/502/504 错误会自动重试 1 次（延迟 2 秒）
- 如持续失败，检查网络或联系管理员

#### 3.6 Hermes 助手（右下角浮窗）

- 点击右下角浮动 Hermes 头像 → 打开常驻 AI 助手聊天窗口
- 支持日常问答和社区管理咨询
- 独立于 Workshop 的对话流

---

### 四、Markdown 格式速查

Workshop 使用自定义 Markdown 渲染器，AI 输出的以下格式均可正确显示：

#### 4.1 基础格式

| 语法 | 效果 | 示例 |
|------|------|------|
| `# 标题` | 一级大标题 | 论文标题 |
| `## 标题` | 二级标题 | 章节标题 |
| `### 标题` | 三级标题 | 小节标题 |
| `**粗体**` | **粗体文字** | 重点强调 |
| `*斜体*` | *斜体文字* | 术语 |
| `` `代码` `` | `行内代码` | 变量名 |

#### 4.2 代码块（带复制按钮）

输入：
```markdown
```python
def hello():
    print("Hello Workshop")
```
```

效果：深色背景代码块，右上角显示「复制」按钮，悬停可见。

#### 4.3 列表

**无序列表**：
```markdown
- 第一项
- 第二项
  - 子项（暂不支持嵌套）
```

**有序列表**：
```markdown
1. 第一步
2. 第二步
```

**任务列表**：
```markdown
- [x] 已完成任务
- [ ] 未完成任务
```

效果：显示为不可编辑的复选框，已勾选项带删除线效果。

#### 4.4 表格

```markdown
| 项目 | 评分 | 说明 |
|------|------|------|
| 创新性 | 8/10 | 方法新颖 |
| 实验 | 7/10 | 数据充分 |
```

效果：美观的学术风格表格，表头深绿色背景 + 白色文字，斑马纹行，圆角边框。

#### 4.5 Alert 提示框

**GFM 标准语法**（推荐）：
```markdown
> [!NOTE]
> 这是一个提示信息

> [!WARNING]
> 这是一个警告

> [!IMPORTANT]
> 这是重要信息

> [!TIP]
> 这是一个技巧

> [!CAUTION]
> 需要谨慎注意
```

**传统标记语法**（兼容）：
```markdown
> [关键] 这是关键信息
> [注意] 这是注意事项
> [建议] 这是建议
> [完成] 这是已完成事项
```

效果：彩色边框 + emoji 图标 + 类型标签，清晰醒目。

#### 4.6 折叠区块

```markdown
<details>
<summary>点击展开详细内容</summary>
这里是展开后的内容...
</details>
```

效果：可点击展开/折叠的长内容区块。

#### 4.7 自动链接

裸 URL 自动转换为可点击链接：
```markdown
https://arxiv.org/abs/1706.03762
```

效果：显示为绿色可点击链接，无需手动加 `[文字](url)` 语法。

#### 4.8 引用块

```markdown
> 这是一段引用文字
> 可以有多行
```

效果：左侧带竖线的引用样式。

---

### 五、常见问题（FAQ）

**Q1：AI 回答到一半突然停了，显示「AI 服务暂时不可用」？**
> 这是 Sakura Frp 网络波动导致的 503 错误，非代码问题。点击「重试」按钮即可。如果频繁出现，可稍后再试。

**Q2：PDF 上传后 AI 没有读取到内容？**
> 请确认 PDF 是文字型 PDF（可复制文字），而非扫描型图片 PDF。扫描型 PDF 无法提取文字。

**Q3：AI 回答的字数超过了我的限制？**
> LLM 对字数限制的遵循度有限，这是普遍问题。如需精确字数，可在 prompt 中多次强调，或要求 AI 先输出大纲再逐段展开。

**Q4：对话历史不见了？**
> 未登录用户：对话保存在浏览器本地，清除缓存/换浏览器会丢失。
> 已登录用户：对话自动同步到服务器，登录后可在历史列表中找回。

**Q5：代码块没有语法高亮？**
> 当前代码块为纯文本显示（保持零依赖），语言标签会显示在代码块左上角作为标识。如需高亮，可复制到 VS Code 等编辑器中查看。

**Q6：AI 输出中出现奇怪的 HTML 标签？**
> 已修复。早期版本的错误消息可能包含未清理的 HTML，当前版本已自动清理。

---

## 第二部分：测试记录与修复历史

### 测试轮次概览

| 轮次 | 日期 | 主题 |
|------|------|------|
| 第一轮 | 2026-05-10 | Workshop 2.0 基础功能测试 |
| 第二轮 | 2026-05-12 | 模型路由重构、MiniMax 双 system 修复、Tavily 多 Key |
| 第三轮 | 2026-05-17 | AI 审稿 PDF 全文输出修复、503 错误缓解 |
| 第四轮 | 2026-05-18 | ZAI Coding Plan 接入、GLM-5.1 适配、富文本图表美化、格式增强 |
| **第五轮** | **2026-05-19** | **四阶段学术 AI 质量提升计划（BugFix → Param → Struct → UI）** |

---

### 第五轮：四阶段学术 AI 质量提升计划（2026-05-19）

> 目标：系统性提升 AI Workshop 三大核心功能（论文生成 / AI 审稿 / 基金辅助撰写）的输出质量。
>
> 约束：不影响正常服务，排除 DSPy 等重量级方案，不引入额外依赖。

#### 5.1 第一阶段：BugFix 包（Prompt 修复）

**问题**：Hermes 路径的 `peerReviewViaHermes` 和 `grantApplicationViaHermes` 只传 user message，**完全缺失 System Prompt** 中的评审/基金约束体系，导致输出质量远低于 FastPath。

**修复**：

| 文件 | 改动 |
|------|------|
| `src/lib/ai/hermes-gateway-adapter.ts` | `peerReviewViaHermes` 注入 `PEER_REVIEW_SYSTEM_PROMPT`（7 维度评审框架） |
| `src/lib/ai/hermes-gateway-adapter.ts` | `grantApplicationViaHermes` 注入 `GRANT_APPLICATION_SYSTEM_PROMPT`（~3000 字完整约束） |
| `src/lib/ai/claude-service.ts` | FastPath `GRANT_SYSTEM_PROMPT` 从一句话扩展为完整版本 |
| `src/lib/ai/grant-application-prompts.ts` | 新建：基金 System Prompt（立项依据逻辑/创新点三要素/可行性论证/原创性铁律） |

**Prompt 约束体系**：
- 基金申请：立项依据 → 研究内容 → 创新点 → 预期成果，创新点需包含**类型标签 + 实验支撑 + 效果验证**
- 审稿：7 维度评分（原创性/方法论/可靠性/写作/引用/可复现/影响力）+ P0/P1/P2 优先级建议

#### 5.2 第二阶段：Param 包（参数/流程优化）

**P1a：GLM-5.1 Thinking Mode**

- **文件**：`src/lib/ai/zai-service.ts`
- **改动**：`callZAI` 新增 `thinking?: boolean` 参数，上层可按需启用
- **效果**：论文生成和审稿启用 thinking 后，逻辑推理链更严谨

**P1b：分阶段 Temperature 策略**

| 任务 | Temperature | 理由 |
|------|-------------|------|
| 论文 proposal/structure | **0.7** | 创意阶段需要多样性 |
| 论文 writing | **0.6** | 平衡创造力和一致性 |
| 论文 data/formatting | **0.3** | 格式/数据任务需要确定性 |
| AI 审稿 | **0.4** | 需要客观、可复现的评价 |
| 基金申请 | **0.5** | 说服性写作需创造性，但不能天马行空 |

- **文件**：`src/lib/ai/hermes-gateway-adapter.ts`，按 stage/task 动态设置

**P1c：论文生成多轮自检（Post-hoc Quality Review）**

- **文件**：新建 `src/lib/ai/quality-review.ts`
- **功能**：`reviewPaperQuality(content, type)` 生成结构化质量报告
- **审查维度**：逻辑一致性 / 引用完整性 / 原创性风险 / 格式规范 / 语言表达
- **输出**：`overallScore` (1-10) + `verdict` + `issues[]`（severity/category/location/description/suggestion）
- **调用方式**：前端可选"一键质量检查"按钮异步触发

#### 5.3 第三阶段：Struct 包（结构化 JSON 输出）

**P2a：审稿结构化 JSON 输出**

- **文件**：`src/lib/ai/peer-review-prompts.ts`
- **新增**：
  - `PEER_REVIEW_JSON_SYSTEM_PROMPT`：在标准 Prompt 上叠加 JSON Schema 约束
  - `buildPeerReviewJsonPrompt()` / `parsePeerReviewJson()`：构建 + 安全解析
  - 类型定义：`PeerReviewResult` / `PeerReviewSuggestion` / `PeerReviewDimension`

**输出 Schema**：
```typescript
{
  summary: string           // 论文概要（100字以内）
  scores: {
    novelty: { score: 1-10, comment: string }
    methodology: { score: 1-10, comment: string }
    soundness: { score: 1-10, comment: string }
    writing: { score: 1-10, comment: string }
    references: { score: 1-10, comment: string }
    reproducibility: { score: 1-10, comment: string }
    impact: { score: 1-10, comment: string }
  }
  overallComment: string
  verdict: 'accept' | 'minor_revision' | 'major_revision' | 'reject'
  suggestions: [{ priority: 'P0'|'P1'|'P2', description: string, location?: string }]
}
```

**P2b：基金申请书结构化 JSON 输出**

- **文件**：`src/lib/ai/grant-application-prompts.ts`
- **新增**：
  - `GRANT_APPLICATION_JSON_SYSTEM_PROMPT`：完整基金 Schema
  - `buildGrantApplicationJsonPrompt()` / `parseGrantApplicationJson()`
  - 类型定义：`GrantApplicationResult` / `GrantInnovationPoint` / `GrantBudgetItem` / `GrantTimelinePhase`

**输出 Schema**：
```typescript
{
  title: string
  sections: {
    background: { content: string, keyPoints: string[] }
    researchContent: { content: string, objectives: string[] }
    innovation: { content: string, points: [{ type, content, support, effect }] }
    feasibility: { content: string, analysis: string }
    expectedOutcomes: { content: string, metrics: [{ type, description, quantity? }] }
  }
  budget: { total: string, breakdown: [{ category, amount, justification }] }
  timeline: { phases: [{ phase, tasks, milestones }] }
  references: string[]
}
```

**后端集成**：

| 路径 | 改动 |
|------|------|
| `hermes-gateway-adapter.ts` | `peerReviewViaHermes` / `grantApplicationViaHermes` 新增 `structured?: boolean`，返回 `{ content, structured }` |
| `claude-service.ts` | FastPath `peerReview` / `grantApplication` 新增 `structured` 参数 |
| `src/app/api/v1/ai/chat/route.ts` | `action=peer_review` / `grant` 支持 `body.structured` 透传，响应含 `data.structured` |

**容错设计**：
- `parsePeerReviewJson` / `parseGrantApplicationJson` 失败时返回 `null`，前端仅显示原始 Markdown 文本，不崩溃
- 支持 ` ```json ` 代码块包裹提取
- 流式模式下自动禁用结构化输出（JSON 需完整输出才能解析）

#### 5.4 第四阶段：UI 包（前端可视化）

**P3a：审稿评分表可视化**

- **文件**：新建 `src/components/features/workshop/PeerReviewScoreCard.tsx`
- **功能**：
  - 综合评分 + Verdict 卡片（Accept 绿 / Minor 蓝 / Major 橙 / Reject 红）
  - 7 维度评分条：彩色进度条 + 分数 + 评语展开/收起
  - 修改建议列表：P0（红）/ P1（黄）/ P2（灰）优先级 Badge + 位置标注
  - 超过 5 条建议时支持"查看全部"展开

**P3b：基金申请书分步向导**

- **文件**：新建 `src/components/features/workshop/GrantApplicationWizard.tsx`
- **功能**：
  - 8 步向导：立项依据 → 研究内容 → 创新点 → 可行性 → 预期成果 → 预算 → 时间线 → 参考文献
  - 顶部进度条 + 步骤 Tabs（可点击跳转）+ 上一步/下一步按钮
  - 内容渲染：创新点含类型标签+支撑/效果、预算含明细表格、时间线含里程碑

**P3c：论文生成 5 阶段进度条**

- **文件**：`src/components/features/workshop/PaperGenerationPanel.tsx`（已有）
- 顶部显示阶段进度（proposal → structure → writing → data → formatting，已完成打勾，当前高亮）

**消息系统集成**：

| 文件 | 改动 |
|------|------|
| `src/hooks/useChat.ts` | `ChatMessage` 新增 `structured?: unknown`，非流式响应自动提取 `data.structured` |
| `src/components/features/workshop/ChatMessage.tsx` | 新增 `StructuredDataView`：自动路由到 `PeerReviewScoreCard` 或 `GrantApplicationWizard` |
| `PeerReviewPanel.tsx` | 默认自动为审稿请求附加 `structured: true` |
| `WorkshopClient.tsx` | 自动为 `peer_review` / `grant` action 启用 `structured: true` |

#### 5.5 第五轮验证结果

| 验证项 | 结果 |
|--------|------|
| `npm run typecheck` | ✅ 通过 |
| `npm run build` | ✅ 成功（workshop 页面 31.2 kB） |
| `pm2 restart scholars-tea` | ✅ PID 5895，online，83.1MB |
| `/workshop` HTTP 200 | ✅ |
| `/api/v1/ai/chat` 路由正常 | ✅（缺 auth 返回 400 → 路由正常） |
| 审稿 JSON 解析测试 | ✅ 7 项字段全部通过，支持代码块容错 + 非法输入 fallback |
| 基金 JSON 解析测试 | ✅ 13 项字段全部通过 |

---

### 第四轮修复详情（2026-05-18）

#### 4.1 ZAI Coding Plan 端点修复

**问题**：ZAI API 返回 429 "余额不足"，但账号实际有 Coding Plan 余额。

**根因**：通用端点 `https://api.z.ai/api/paas/v4` 与 Coding Plan 专用端点 `https://api.z.ai/api/coding/paas/v4` 是**独立计费体系**。

**修复**：

| 文件 | 改动 |
|------|------|
| `.env` | `ZAI_BASE_URL` 指向 Coding Plan 端点 |
| `src/lib/ai/zai-service.ts` | 默认 URL + 注释同步更新 |
| `hermes/config.yaml` | `base_url` 指向 Coding Plan 端点 |
| `hermes-home/config.yaml` | `base_url` 指向 Coding Plan 端点 |

---

#### 4.2 GLM-5.1 主模型适配

**发现 1：reasoning_content 字段**

GLM-5.1 默认启用 reasoning 模式，在 SSE 流中返回独立的 `delta.reasoning_content` 字段（非 `<think>` 标签包裹）。

**修复**：`src/lib/ai/stream-think-filter.ts` 新增过滤处理：

```typescript
if (
  c.delta &&
  typeof c.delta === 'object' &&
  typeof (c.delta as Record<string, unknown>).reasoning_content === 'string'
) {
  // 不设置 inThinkBlock，避免污染后续 content chunk 的过滤状态
  return {
    ...c,
    delta: { ...(c.delta as object), reasoning_content: '' },
  }
}
```

**发现 2：max_tokens 预算**

GLM-5.1 的 reasoning 过程消耗大量 token。若 `max_tokens` 过小（如 256），`content` 会返回空字符串。

**对策**：全局默认 `max_tokens` 保持 **4096**。

**发现 3：格式遵循度**

| 格式 | GLM-5.1 遵循度 |
|------|---------------|
| GFM Alert (`> [!NOTE]`) | ⭐⭐⭐⭐⭐ 极高 |
| 传统标记 (`> [关键]`) | ⭐⭐⭐⭐⭐ 极高 |
| Markdown 表格 | ⭐⭐⭐⭐⭐ 规范 |
| `<details>` 折叠 | ✅ 支持 |
| h1-h6 标题 | ✅ 支持 |

---

#### 4.3 GLM-5.1 "没有任何回答" 修复

**问题**：切换至 GLM-5.1 后，Workshop 前端显示"思考中..."但**最终输出为空**。

**根因分析**：

GLM-5.1 的 SSE 流式响应中，所有 chunk 的 `delta.content` 均为空字符串，reasoning 过程放在独立的 `delta.reasoning_content` 字段中。

```typescript
// ❌ 错误：设置 inThinkBlock = true 后，后续所有 delta.content 被当作 <think> 块内文本过滤掉
if (c.delta && typeof (c.delta).reasoning_content === 'string') {
  inThinkBlock = true  // ← 污染了状态机
  return { ...c, delta: { ...c.delta, reasoning_content: '' } }
}
```

**两个叠加 bug**：

| Bug | 文件 | 影响 |
|-----|------|------|
| 流式：`reasoning_content` 设置 `inThinkBlock = true` | `stream-think-filter.ts` | 后续所有 `delta.content` chunk 被 `filterThinkText` 误判为 think 块内容，全部过滤 |
| 非流式：只读取 `message.content` | `zai-service.ts` | GLM-5.1 非流式也常返回 `content: ""` + `reasoning_content`，前端显示空白 |

**修复**：

| 文件 | 改动 |
|------|------|
| `src/lib/ai/stream-think-filter.ts` | `reasoning_content` 分支不再设置 `inThinkBlock = true`，仅清空字段 |
| `src/lib/ai/zai-service.ts` | 优先取 `message.content`，为空时降级取 `message.reasoning_content` |

**验证**：Playwright 端到端测试通过，API 返回 200，浏览器端正确显示回复内容。

---

#### 4.4 SimpleMarkdown v2 — 基础渲染增强

**文件**：`src/components/ui/SimpleMarkdown.tsx`

| 新增功能 | 说明 |
|---------|------|
| h5/h6 标题 | `#####` → `<h5>`，`######` → `<h6>` |
| GFM Alert | `> [!NOTE]` / `[!WARNING]` / `[!IMPORTANT]` / `[!TIP]` / `[!CAUTION]` |
| 传统 Alert | `[关键]` / `[注意]` / `[建议]` / `[完成]` |

Alert 检测优先级：GFM 标准语法优先，传统标记兼容保留。

---

#### 4.5 SimpleMarkdown v3 — 格式增强

**文件**：`src/components/ui/SimpleMarkdown.tsx`、`src/styles/globals.css`

| 新增功能 | 说明 |
|---------|------|
| **代码块复制按钮** | 悬停代码块右上角显示「复制」按钮，点击一键复制代码内容 |
| **任务列表** | `- [ ]` / `- [x]` 渲染为不可编辑的复选框 |
| **自动 URL 链接** | 裸 URL（`https://...`）自动转换为可点击链接 |

**复制交互细节**：
- 鼠标悬停代码块 → 右上角显示「复制」按钮
- 点击 → 复制代码内容到剪贴板 → 按钮变为「已复制」（绿色，2 秒后恢复）
- 兼容 `navigator.clipboard` 和旧版 `execCommand` fallback

---

#### 4.6 富文本图表样式美化

**文件**：`src/styles/globals.css`

**表格样式**：

| 优化项 | 效果 |
|--------|------|
| 表头背景 | 学术主题色 `#1A5F5C` + 白色文字 |
| 斑马纹 | `tbody tr:nth-child(even)` 浅灰背景 |
| 圆角边框 | `border-radius: 0.5rem` + 溢出隐藏 |
| 阴影 | `box-shadow: 0 1px 3px rgba(0,0,0,0.06)` |
| hover | 主题色 6% 透明度悬停效果 |

**Alert 提示框样式**：

| 类型 | 边框色 | 图标 | 标签 |
|------|--------|------|------|
| warning | `#eab308` | ⚠️ | WARNING |
| info | `#3b82f6` | ℹ️ | NOTE |
| success | `#22c55e` | ✅ | IMPORTANT |
| danger | `#ef4444` | ⛔ | CAUTION |

---

#### 4.7 Prompt 规范化

**文件**：`src/lib/ai/agent-modes.ts`、`peer-review-prompts.ts`、`paper-generation-prompts.ts`

所有 prompt 统一要求：
- 优先使用 GFM Alert 标准语法（`> [!NOTE]`）
- `>` 与 `[!` 之间**必须有空格**
- Markdown 表格呈现对比数据
- `<details>` 折叠区块展示长篇辅助内容
- UTF-8 Unicode 数学符号，禁止 LaTeX

---

#### 4.8 Hermes skill/personality 注入修复

**文件**：`src/lib/ai/hermes-gateway-adapter.ts`

**问题**：`buildSystemPrompt()` 函数始终返回空字符串 `''`，导致 skill 和 personality 配置无效。

**修复**：重写函数，根据传入的 `skill` 和 `personality` 参数拼接系统提示词。

---

#### 4.9 全局重 brand

「思想工坊」→「AI Workshop」跨 13 个文件（src + docs），统一英文品牌名。

#### 4.10 论文生成数据阶段 — 数据图表图片上传与视觉分析

**需求**：在论文生成的第 4 阶段（数据/图表），支持用户上传自己的数据图表图片，AI 对图片进行视觉分析并据此给出统计方法建议和图表改进意见。

**实现架构**：

| 层级 | 文件 | 改动 |
|------|------|------|
| 前端 UI | `PaperGenerationPanel.tsx` | data 阶段新增图片上传区域（点击/拖拽，多图支持，缩略图预览，删除） |
| 前端类型 | `PaperGenerationPanel.tsx` | `onSend` options 扩展 `attachments?: ChatAttachment[]` |
| API 路由 | `ai/chat/route.ts` | `paper_generation` action 提取图片附件，通过 `getImageBase64` 转为 base64 data URI |
| AI 服务 | `claude-service.ts` | `generatePaper` 新增 `images?: string[]` 参数 |
| Skill 引擎 | `skills/engine.ts` | `executeStage` 支持通过 `params._images` 构建 vision content 消息（text + image_url） |
| Skill 定义 | `skills/paper-generation.ts` | `dataStage` promptBuilder 读取 `_images` 并传给 `buildDataAnalysisPrompt` |
| Prompt | `paper-generation-prompts.ts` | `buildDataAnalysisPrompt` 新增 `images` 参数，prompt 中增加图表视觉分析指令 |

**技术要点**：
- 图片通过 `/api/v1/upload` 上传后得到 URL，API 层将 URL 转为 base64 data URI
- 多模态自动路由：skill engine 检测到 `_images` 后，自动将 user message 构建为 OpenAI vision 格式 `[text, image_url, image_url, ...]`
- 含图片时自动路由到 ZCHAT Claude Sonnet 4.5 多模态模型（而非纯文本的 GLM-5.1）
- 支持多张图片同时分析
- 仅上传图片（无文字描述）也可提交分析

**Prompt 增强**（当上传图片时）：
- 增加「图表视觉分析」指令：描述每张图表的类型、坐标轴、数据趋势、异常点
- 增加「基于现有图表的改进建议」：指出当前图表在学术规范、可读性上的可改进之处
- 增加「图表解读模板」：给出规范的 "如图X所示，..." 结果描述示例

---

### 第一至三轮修复概要

#### 第一轮：Workshop 2.0 基础功能（2026-05-10）

- PDF 字符上限 12000 → 50000
- Tavily 多 Key 轮换
- 模型路由重构（MiniMax 主 + ZCHAT/DeepSeek 回退）
- MiniMax 400 错误（双 system message）修复
- useChat.ts JSON 解析错误修复

#### 第二轮：模型路由与搜索（2026-05-12）

- Tavily KEY 额度耗尽自动跳过
- 模型回退链稳定运行
- 论文生成 5 阶段流程验证

#### 第三轮：AI 审稿 PDF 修复 + 503 缓解（2026-05-17）

**AI 审稿 PDF 全文输出到对话框**

| 文件 | 改动 |
|------|------|
| `PeerReviewPanel.tsx` | PDF 内容保存在 `pdfContentRef`，对话框只显示摘要消息 |
| `PdfUploadButton.tsx` | 扩展 `onExtract` 回调，增加 `totalLength` 和 `wasTruncated` |

**Sakura Frp 503 错误缓解**

| 文件 | 改动 |
|------|------|
| `PdfUploadButton.tsx` | 503/502 返回友好提示；`maxLength` 50000 → **30000** |
| `useChat.ts` | 503/502/504 自动重试 1 次（延迟 2 秒） |
| `PeerReviewPanel.tsx` | 新增网络不稳定提示 |
| `extract-pdf/route.ts` | `maxLength` 50000 → **30000** |
| `pdf-parser.ts` | `maxLength` 50000 → **30000** |
| `peer-review-prompts.ts` | `slice(0, 50000)` → **30000** |
| `hermes-gateway-adapter.ts` | `slice(0, 50000)` → **30000** |

**错误消息 HTML 清理**

| 文件 | 改动 |
|------|------|
| `useChat.ts` | 新增 `sanitizeErrorMessage()`：提取 HTML title、移除标签、按状态码返回友好提示 |

**UI 布局优化**

| 文件 | 改动 |
|------|------|
| `WorkshopClient.tsx` | 错误消息增加「重试」按钮；消息区域 padding 优化 |
| `ChatMessage.tsx` | 气泡最大宽度优化；用户消息增加 `max-w-prose`；hover shadow |
| `PeerReviewPanel.tsx` | 评审侧重按钮 transition；PDF 信息卡片展示；双列网格布局 |

---

## 第三部分：附录

### 附录 A：8 个模式功能测试结果

| 模式 | 页面加载 | Console 错误 | 核心功能 | 状态 |
|------|---------|-------------|---------|------|
| 通用助手 | ✅ 正常 | 0 errors | 对话、上传 | ✅ 正常 |
| 论文辅助 | ✅ 正常 | 0 errors | 对话、上传 | ✅ 正常 |
| 基金申请 | ✅ 正常 | 0 errors | 对话、上传 | ✅ 正常 |
| 文献综述 | ✅ 正常 | 0 errors | 对话、上传 | ✅ 正常 |
| 研究方向 | ✅ 正常 | 0 errors | 对话、上传 | ✅ 正常 |
| 社群管家 | ✅ 正常 | 0 errors | 对话、上传 | ✅ 正常 |
| AI 审稿 | ✅ 正常 | 0 errors | PDF 上传、评审报告 | ✅ 正常 |
| AI 论文生成 | ✅ 正常 | 0 errors | 5 阶段流程、Tavily 检索 | ✅ 正常 |

**AI 审稿专项测试**：

| 项目 | 结果 |
|------|------|
| 评审侧重点切换 | ✅ 正常 |
| PDF 上传提取 | ✅ 正常，上限 30000 字符 |
| PDF 不输出全文到对话框 | ✅ 已修复，只显示摘要卡片 |
| 字符截断提示 | ✅ 已更新为 30000 |
| AI 评审响应 | ✅ 返回完整评审报告 |
| **结构化 JSON 输出** | ✅ 默认启用，7 维度评分 + P0/P1/P2 建议 + Verdict |
| **审稿评分表可视化** | ✅ `PeerReviewScoreCard` 组件渲染正常 |
| 503 错误 | ✅ 已缓解（内容缩短 + 自动重试 + 错误提示优化） |
| 错误消息美化 | ✅ HTML 已清理，带重试按钮 |

**基金申请专项测试**：

| 项目 | 结果 |
|------|------|
| 基础对话 | ✅ 正常 |
| **结构化 JSON 输出** | ✅ 默认启用，8 步向导 + 预算明细 + 时间线 |
| **基金分步向导** | ✅ `GrantApplicationWizard` 组件渲染正常 |
| 503 错误 | ✅ 已缓解 |

**AI 论文生成专项测试**：

| 项目 | 结果 |
|------|------|
| 5 阶段流程 | ✅ 选题立项 → 架构规划 → 正文写作 → 数据/图表 → 排版交付 |
| **分阶段 Temperature** | ✅ proposal 0.7 / writing 0.6 / formatting 0.3 |
| **Thinking Mode** | ✅ 底层支持就绪，可按需启用 |
| 模型路由 | ✅ MiniMax-M2.7 / GLM-5.1 为主，自动回退 ZCHAT/DeepSeek |
| Tavily 文献检索 | ✅ 多 Key 轮换，自动跳过额度耗尽 Key |
| 响应速度 | proposal ~90s，writing ~13s |
| 富文本输出 | ✅ 表格、Alert、折叠区块、标题层级均正确渲染 |
| 数据阶段图片上传 | ✅ 支持多图上传，ZCHAT Claude 多模态分析 |

---

### 附录 B：已知限制

| 限制 | 说明 |
|------|------|
| Sakura Frp 网络不稳定 | 间歇性 503，非代码问题；已通过缩短内容+重试+提示缓解 |
| GLM-5.1 字数限制忽略 | LLM 普遍问题，prompt 中限制常被超越 |
| MiniMax proposal 阶段延迟 | 约 90-100 秒（含 Tavily 文献检索） |
| Semantic Scholar / arXiv 限流 | 返回 429，Tavily 自动补位 |
| Tavily KEY 额度耗尽 | 轮换机制自动跳过，其他 KEY 正常 |
| 对话保存在本地浏览器 | 未登录用户清除浏览器数据会丢失对话历史；登录用户同步到数据库 |
| PDF 上传后不可重试 | 当前重试逻辑只发送摘要消息，PDF 内容需重新上传（设计如此） |
| 代码块无语法高亮 | 当前为纯文本代码块，暂无 highlight.js 集成计划（保持零依赖） |
| 嵌套列表 | 当前列表解析器不支持嵌套列表（待优化） |
| 图片分析仅支持数据阶段 | 论文生成的图片上传仅在第 4 阶段（数据/图表）可用，其他阶段暂不支持 |
| 图片分析走 ZCHAT 模型 | 含图片时自动切换至 ZCHAT Claude 多模态模型，需确保 ZCHAT_API_KEY 可用 |
| 结构化输出仅限非流式 | 流式模式下自动禁用结构化 JSON（JSON 需完整输出才能解析） |
| 结构化解析容错 | JSON 解析失败时 fallback 为纯文本 Markdown，不会崩溃 |

---

### 附录 C：测试结论

| 维度 | 结果 |
|------|------|
| 页面渲染 | 全部 8 个模式正常 |
| Console 错误 | 0 errors across all modes |
| ZAI Coding Plan | 端点修复成功，GLM-5.1 主模型可用 |
| GLM-5.1 格式输出 | GFM Alert、表格、折叠区块、h5/h6 全部正确渲染 |
| 富文本图表 | 表格样式美观标准，Alert 带图标分类清晰 |
| 审稿模式修复 | PDF 不再输出全文到对话框；503 已缓解 |
| 论文生成 | 5 阶段流程正常，模型路由正常，富文本输出规范，数据阶段支持图片上传与视觉分析 |
| API 响应 | 各模式 API 调用正常，审稿返回完整评审报告 |
| UI 体验 | 布局优化，消息间距合理，错误展示带重试按钮，代码块可复制 |
| 部署状态 | 构建成功，PM2 双服务 online |

**整体状态**：AI Workshop 全部 8 个模块功能正常。GLM-5.1 主模型已接入，流式输出修复完成，代码块复制、任务列表等格式增强已上线，富文本图表渲染美观标准。

**第五轮新增**：
- 审稿/基金模式默认输出**结构化 JSON**，前端自动渲染**评分表**和**分步向导**
- 论文生成支持**分阶段 Temperature** 和 **Thinking Mode**
- 基金申请 Prompt 从一句话扩展为**完整约束体系**
- 所有 Hermes 路径均**显式注入 System Prompt**，消除质量差异
