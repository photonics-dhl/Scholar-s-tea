# AI 学术功能后续计划（选项 C — 存储）

> 制定日期：2026-05-18
> 来源：AI 学术质量提升路线图 grill-me 共识
> 状态：待排期，不在当前实施范围内

---

## 功能列表

| 优先级 | 功能 | 描述 | 复杂度 | 依赖 |
|--------|------|------|--------|------|
| P1 | **Budget Calculator** | 基金预算自动计算（根据设备/人员/材料费率，按国自然标准模板） | 中 | 基金 Struct 包完成 |
| P1 | **Timeline Generator** | 甘特图式时间节点生成（基于研究内容自动估算各阶段时长） | 中 | 基金 Struct 包完成 |
| P2 | **Model Router** | 智能路由：简单问答→轻量模型(GLM-4.5)，复杂任务→GLM-5.1 | 低 | 无 |
| P2 | **Context Caching** | 多阶段论文生成复用 System Prompt 和背景材料缓存，减少 token 消耗和延迟 | 低 | ZAI 支持 caching API |
| P3 | **Team Capability Assessment** | 基于团队成员论文/项目历史自动生成"研究基础"段落 | 高 | 需接入学者画像数据 |
| P3 | **Citation Auto-Fill** | 从 [REF-N] 占位符自动查询真实文献并填充（解决 Semantic Scholar 429 问题后） | 高 | 需稳定的引用查询服务 |
| P3 | **Multi-Agent Pipeline** | Writer → Critic → Editor 的流水线式论文生成 | 高 | 架构改造 |
| P3 | **Agentic RAG** | 让模型根据中间输出动态决定是否需要补充检索 | 高 | RAG 架构改造 |

## 轻量级 DSPy 替代方案（未来评估）

若后续希望系统性优化 prompt 质量，可考虑轻量级方案：
- **Metaprompting**：用 GLM-5.1 自动生成/优化 System Prompt（AIGenerated Prompt）
- **Few-shot 自动筛选**：基于历史优质输出，自动构建 few-shot 示例库
- **A/B Test 框架**：对同一任务同时调用两种 prompt 变体，用户选择更好的

以上均不需要引入 DSPy 依赖，利用现有基础设施即可实现。
