---
name: academic-revision-coach
description: "审稿意见结构化解析与修订路线图生成。输入任意格式的审稿意见，输出逐条分类、优先级排序、章节映射的修订路线图。支持多审稿人合并处理、承诺追踪、Response Letter 模板生成。TRIGGER: 收到审稿意见、parse reviews、revision roadmap、help me with my revision、回复审稿人、如何修改论文。"
metadata:
  version: "1.0.0"
  last_updated: "2026-06-02"
  status: active
  source: "Adapted from ARS revision_coach_agent v1.10.0 (Imbad0202/academic-research-skills)"
  task_type: open-ended
  related_skills:
    - academic-paper-review
    - academic-paper-generation
---

# Academic Revision Coach — 审稿意见解析与修订路线图

将无结构的审稿意见（邮件、PDF粘贴、编号列表、自由段落）解析为结构化修订路线图。分类、映射、排序每一条意见，让作者清晰知道该修什么、在哪修、怎么修。

## 触发条件

**中文**: 审稿意见、修改论文、回复审稿人、revision roadmap、如何回复审稿、parse reviews
**English**: reviewer comments, revision plan, response to reviewers, parse reviews, revision roadmap, help me revise

**非触发**:
- 需要评审论文（非已有审稿意见）→ `academic-paper-review`
- 需要写论文 → `academic-paper-generation`

---

## 工作流程

### 模式选择

| 模式 | 输入 | 输出 | 适用场景 |
|------|------|------|---------|
| `parse` | 审稿意见全文 | 分类+优先级+路线图 | 第一次拿到审稿意见 |
| `response` | 审稿意见 + 修订路线图 | Response Letter 模板 | 准备回复信 |
| `track` | 审稿意见 + 修改后论文 | 逐条承诺-履行检查 | 修改完成后自查 |

### Step 1: 输入收集

**必需**:
- 审稿意见全文（任何格式：邮件粘贴、PDF内容、编号列表、自由段落、多审稿人混合）

**可选但推荐**:
- 论文草稿（用于章节映射）
- 编辑决定信（用于理解整体修改要求）

**输入验证**:
- 审稿意见为空 → 提示用户提供
- 审稿意见极短（<50词）→ 确认是否完整
- 内容看起来是论文本身（非审稿意见）→ 提醒用户确认

### Step 2: 意见解析

**按优先级识别分隔符**:
1. 明确审稿人标签: "Reviewer 1:", "R1:", "审稿人1:"
2. 编号列表: "1.", "2.", "(1)", "(2)"
3. 项目符号: "-", "*", "•"
4. 段落分隔: 双换行分隔不同主题
5. 主题转换: 同段落内主题变化

**对每条意见提取**:
- **审稿人ID**: R1/R2/R3/Editor/Unknown
- **原文**: 逐字保留
- **摘要**: 一句话概括审稿人要求
- **语气**: 正面/建设性/批评/不明

**歧义处理**:
- 一条意见含多个独立要点 → 拆分为独立条目
- 审稿人身份不明 → 标记为"Unknown"，提示用户确认
- 意见模糊（如"需要改进"）→ 标记"NEEDS_CLARIFICATION"

### Step 3: 四维分类

| 类型 | 定义 | 处理要求 |
|------|------|---------|
| **Major** | 影响核心论点/方法/结论；不修改可能导致拒稿 | 必须修改 |
| **Minor** | 影响质量或完整性但不影响核心有效性 | 应该修改 |
| **Editorial** | 语法、措辞、格式、错字、风格 | 快速修改 |
| **Positive** | 赞扬、认可优点 | 在回复信中致谢 |

**分类信号**:
- "强烈建议..." / "这是根本性缺陷..." / "不修改无法接受..." → Major
- "建议添加..." / "可以考虑..." / "小问题..." → Minor
- "第X页有错字..." / "格式请检查..." → Editorial
- "作者做得很好..." / "这个方法很有趣..." → Positive

### Step 4: 章节映射

将每条意见映射到论文结构:
- Title / Abstract / Introduction / Literature Review / Methodology / Results / Discussion / Conclusion / References / Figures & Tables / Supplementary

**⚠️ Discussion 映射灵活性**：
- 独立 Discussion 章节 → 直接映射到 Discussion
- 融入式 Discussion（Results 各小节含讨论段落）→ 映射到对应的 Results 子章节，标注「含讨论内容」
- 与 Conclusion 合并 → 映射到 Discussion/Conclusion，标注合并
- 审稿意见提到「Discussion 需要改进」但论文无独立 Discussion → 将修改映射到各对应 Results 子章节末尾

### Step 5: 优先级排序

**排序规则**（从高到低）:
1. Major 类型优先于 Minor
2. 影响核心论点的优先于边缘问题
3. 多个审稿人共同提到的问题优先于单一审稿人
4. 前置依赖项优先（如方法论问题优先于依赖该方法的结果解读）

### Step 6: 承诺提取

对每条意见提取具体承诺:
- 找出祈使或隐含祈使短语（"请添加"、"扩展"、"澄清"、"建议"、"考虑"）
- 每个短语生成一个承诺项:
  - `commitment_text`: 原始或最小归一化的承诺描述
  - `section`: 涉及的论文章节
  - `evidence_required`: 完成该承诺需要在论文中展示什么

### Step 7: 修订路线图输出

```markdown
# 修订路线图

## 概览
- 总意见数: X
- Major: X | Minor: X | Editorial: X | Positive: X
- 建议修改周期: X 天
- 整体评估: [可直接接受的Minor / 需认真修改的Major / 建议大改]

## 审稿人共识分析
### 所有审稿人一致提到的问题
1. [问题描述] — 涉及章节: [Section]
2. [...]

### 审稿人分歧
- R1认为[观点A]，R2认为[观点B] — 建议处理方式: [方案]

## 优先修改清单

### P0 — 必须修改（Major）
| # | 意见 | 审稿人 | 章节 | 修改方案 | 预估工时 |
|---|------|--------|------|---------|---------|
| M1 | [具体描述] | R1 | Methodology | [建议方案] | X小时 |
| M2 | [具体描述] | R2 | Discussion | [建议方案] | X小时 |

### P1 — 建议修改（Minor）
[同上格式]

### P2 — 快速修改（Editorial）
[同上格式]

## 修改依赖图
M1(方法论修正) → M3(结果更新) → M4(讨论重写)
M2(文献补充) → P1(引用格式统一)

## 逐条详情

### M1: [意见标题]
- **原文**: [审稿人原始意见逐字]
- **摘要**: [一句话概括]
- **审稿人**: R1
- **类型**: Major
- **涉及章节**: Methodology, Results
- **修改方案**: [具体可执行的修改建议]
- **验收标准**: [如何确认该问题已解决]
- **相关承诺**: [commitment_text]
```

### Response Letter 模式

在 `response` 模式下，额外输出:

```markdown
# Response to Reviewers

## Dear Editor and Reviewers,

We thank you for the thoughtful and constructive comments...
[根据整体修改程度定制开头语气]

---

## Response to Reviewer 1

**[Overall assessment paraphrase — show you understood]**

### Comment 1.1: [Original comment excerpt]
**Response**: [Point-by-point response]
**Changes made**: [Specific changes, citing line numbers/pages]
[如果部分不同意] **Partial disagreement note**: [Respectful explanation]

### Comment 1.2: [Original comment excerpt]
[Same format]

---

## Response to Reviewer 2
[Same format]

---

## Summary of Major Changes
1. [Change] — Addressing R1 Comment X.X (Page Y, Line Z)
2. [Change] — Addressing R2 Comment X.X (Page Y, Line Z)
```

### Track 模式（承诺履行检查）

在 `track` 模式下:
1. 加载修订路线图中的所有承诺
2. 逐条比对修改后论文
3. 输出每条承诺的状态:
   - ✅ Fulfilled — 明确在论文中找到对应修改
   - ⚠️ Partially — 部分落实，指出缺失
   - ❌ Missing — 未找到对应修改
   - 🔄 Redirected — 以其他方式解决（需解释）

---

## 适配说明

本 skill 基于 ARS (academic-research-skills) 的 `revision_coach_agent` 适配:
- **移除**: Sprint Contract Protocol（Hermes 无需跨 agent 协议）、Phase Boundary 声明
- **保留**: 核心解析管线（分类→映射→排序→承诺提取）、输出模板
- **新增**: Track 模式（承诺履行自查）、中文触发词、与 `academic-paper-review` 联动
- **简化**: 单次调用完成，无需多 agent 编排

## 与其他 Skill 的配合

- **审稿前**: 用 `academic-paper-review` 做模拟评审 → 发现问题提前修改
- **收到审稿后**: 用本 skill 解析意见 → 生成路线图 → 按 `academic-paper-generation` 修改
- **修改完成**: 用本 skill track 模式自查 → 确认所有承诺已落实
