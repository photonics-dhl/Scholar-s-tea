# 思想工坊（Workshop）模块功能测试报告

**测试时间**: 2026-05-16
**测试工具**: Playwright (Chromium)
**测试环境**: http://10.72.212.33:3002/workshop
**视口**: 桌面端 1280×900 + 移动端 514×900

---

## 一、测试概述

本次测试覆盖思想工坊模块的核心功能，包括模式切换、聊天对话、流式输出、Markdown 渲染、特殊模式面板、响应式布局等。测试过程中发现并修复了一个 **P0 级阻塞性 bug**。

---

## 二、测试项目与结果

### 2.1 模式切换功能 ✅ PASS

通过 URL 参数 `?mode=` 测试了全部 7 种模式：

| 模式 | URL 参数 | 页面标题 | WelcomeScreen | 状态 |
|------|----------|----------|---------------|------|
| 通用助手 | `general` | 通用学术助手 | 研究方向/概念解释/论文结构 | ✅ |
| 论文辅助 | `paper` | 论文辅助专家 | 文献分析/写作润色/投稿建议 | ✅ |
| 基金申请 | `grant` | 基金申请助手 | — | ✅ |
| 文献综述 | `survey` | 文献综述助手 | — | ✅ |
| 研究方向 | `research` | 研究方向探索 | — | ✅ |
| AI 审稿 | `peer_review` | AI 同行评审 | PeerReviewPanel（审稿范围/方法论等） | ✅ |
| 论文生成 | `paper_generation` | AI 论文生成助手 | PaperGenerationPanel（5 阶段导航） | ✅ |

**截图文件**:
- `workshop_test_01_general_mode.png`
- `workshop_test_02_paper_mode.png`
- `workshop_test_03_peer_review.png`
- `workshop_test_04_paper_generation.png`

---

### 2.2 聊天流式输出与 Markdown 渲染 ✅ PASS（修复后）

#### 修复前：❌ BLOCKER
- API 请求成功（200 OK），SSE 数据流正常传输
- 但页面上 **AI 响应完全空白**，只显示用户消息
- 历史会话中的 assistant 消息 `contentLength: 0`

#### 根因分析
`src/hooks/useChat.ts` 第 423 行的 SSE 解析逻辑错误：
```typescript
// 错误：检查 parsed.content
if (parsed.content) {
  fullContent += parsed.content
}
```

但实际 MiniMax/ZCHAT API 返回的 SSE 数据格式为：
```json
{"choices":[{"index":0,"delta":{"content":"...","role":"assistant"}}]}
```

`content` 位于 `parsed.choices[0].delta.content`，而非 `parsed.content`，导致 `fullContent` 始终为空。

#### 修复
```typescript
const content =
  parsed.content ||
  parsed.choices?.[0]?.delta?.content ||
  parsed.choices?.[0]?.text ||
  ''
if (content) {
  fullContent += content
  setStreamingContent(fullContent)
}
```

#### 修复后验证
- **通用模式**: 发送消息后，AI 响应正常显示，textLength > 500 ✅
- **论文辅助模式**: `mode: "paper"`, `action: "analyze"` 正确传递，AI 响应完整 ✅
- **Markdown 渲染**: 粗体(`<strong>`)、列表(`<ul>`)、代码块(`<pre><code>`) 均正确解析 ✅

**截图文件**:
- `workshop_test_05_chat_streaming_3s.png`
- `workshop_test_06_chat_complete.png`
- `workshop_test_07_chat_after_18s.png`
- `workshop_test_08_chat_fixed.png`（修复后）
- `workshop_test_09_paper_chat.png`

---

### 2.3 文件/图片上传功能 ⚠️ PARTIAL

- **UI 元素**: 上传图片按钮 (`accept: image/jpeg,image/png,image/gif,image/webp`) 和上传文件按钮存在且可点击 ✅
- **文件输入**: `input[type="file"]` 存在，`display: none`，由按钮触发 ✅
- **实际上传**: 未进行实际上传测试（需要真实文件）

---

### 2.4 特殊模式面板 ✅ PASS

#### PeerReviewPanel（AI 审稿模式）
- 标题：AI 同行评审 ✅
- 审稿范围选择：完整审稿 / 方法论评估 / 写作质量 / 修改建议 ✅
- 论文内容输入 textarea ✅
- 字符计数器 ✅

#### PaperGenerationPanel（论文生成模式）
- 标题：AI 论文生成助手 ✅
- 5 阶段导航：选题 → 结构 → 写作 → 数据 → 格式 ✅
- 各阶段表单字段正常显示 ✅

**截图文件**:
- `workshop_test_10_peer_review_panel.png`
- `workshop_test_11_paper_generation_panel.png`

---

### 2.5 响应式布局 ✅ PASS

#### 桌面端（1280px）
- Sidebar 展开（288px），显示对话历史 ✅
- 主聊天区域 986px 宽度 ✅
- 模式选择器、输入框、发送按钮布局正常 ✅

#### 移动端（514px）
- Sidebar 自动折叠，仅显示展开按钮 ✅
- 主区域全宽显示 ✅
- 输入框和发送按钮可用 ✅
- AI 响应正常渲染 ✅

**截图文件**:
- `workshop_test_12_mobile_layout.png`
- `workshop_test_13_mobile_chat.png`

---

### 2.6 历史会话管理 ⚠️ PARTIAL

- **Sidebar 显示**: 历史会话列表正确显示，包含标题、时间、模式标签 ✅
- **点击切换**: 可点击切换会话 ✅
- **内容加载**: 加载的会话内容可能与点击的不一致（需进一步验证）
- **AI 消息恢复**: 由于之前的 SSE 解析 bug，历史会话中的 assistant 消息 content 为空，修复后新消息正常

---

## 三、发现的问题汇总

| 优先级 | 问题 | 状态 | 说明 |
|--------|------|------|------|
| **P0** | AI 响应空白（SSE 解析错误） | ✅ 已修复 | `parsed.content` → `parsed.choices[0].delta.content` |
| **P1** | AI 响应包含 `<think>` 思考过程 | 🔧 待优化 | MiniMax 的 reasoning content 混入输出 |
| **P2** | 历史会话切换可能不准确 | 🔍 待确认 | 点击后加载的会话与预期不一致 |
| **P2** | 文件上传未实际上传验证 | 🔍 待测试 | UI 存在，需验证端到端上传流程 |

---

## 四、已部署的修复

```bash
# 修复文件
src/hooks/useChat.ts  (第 421-433 行)

# 部署命令
npm run build          ✅ 通过
pm2 restart scholars-tea  ✅ 已重启
```

---

## 五、建议后续优化

1. **过滤 `<think>` 标签**: MiniMax 模型的 reasoning content 应以折叠面板形式展示，而非直接混入正文
2. **历史会话数据修复**: 对于已有空 content 的 assistant 消息，考虑添加占位提示或允许重新生成
3. **文件上传 E2E 测试**: 实际上传图片/文件，验证预览、发送、AI 分析完整流程
4. **模式选择器下拉菜单**: Playwright 点击困难，需确认 z-index 和事件委托

---

## 六、结论

| 功能模块 | 状态 |
|----------|------|
| 模式切换（7 种） | ✅ 正常 |
| 聊天流式输出 | ✅ 正常（修复后） |
| Markdown 渲染 | ✅ 正常 |
| 特殊模式面板 | ✅ 正常 |
| 响应式布局 | ✅ 正常 |
| 文件上传 UI | ⚠️ 需进一步测试 |
| 历史会话 | ⚠️ 需进一步验证 |

**核心聊天功能现已完全可用。**
