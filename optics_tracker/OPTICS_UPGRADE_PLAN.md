# Optics Tracker 全面升级计划

## 目标
为光学领域研究人员推送**高质量、一手**的学术资讯

## 当前问题
1. 子卡片显示摘要而非6维度AI分析
2. MiniMax分析超时（每篇论文20-30秒）
3. 数据源单一，只有ArXiv
4. 无期刊官网、PubMed补充、无Tavily背景搜索

---

## 升级任务

### Task 1: 修复子卡片显示 - 确保6维度分析内容正确渲染
**问题**: 当无MiniMax分析时，子卡片折叠面板显示原始摘要
**目标**: 即使无AI分析，也应显示论文的"一句话概括"（从摘要提取）

**修改文件**: `optics_tracker_v2.py`
- 函数 `_build_paper_content()` 和 `build_paper_detail()` 
- 确保分析内容优先显示，无分析时提取摘要关键句

### Task 2: PubMed 集成到主流程
**问题**: PubMedSearcher 已实现但 main() 未调用
**目标**: 生物医学光学(biophotonics)领域同时搜索PubMed

**修改文件**: `optics_tracker_v2.py`
- 在 main() 的 search_and_enrich() 函数中正确调用 PubMedSearcher
- 适用于 biophotonics 和 quantum_optics 领域

### Task 3: Tavily 集成
**目标**: 为每个领域补充行业动态背景搜索
**条件**: 需要 TAVILY_API_KEY

**修改文件**: `optics_tracker_v2.py`
- 添加 TavilySearcher 到搜索流程
- 用于获取非论文的行业新闻/进展

### Task 4: MiniMax 性能优化
**问题**: 每篇论文分析20-30秒，8领域×3篇=极慢
**方案**: 
- 减少分析论文数量（每领域只分析1篇）
- 使用流式输出/增加超时
- 考虑使用MiniMax MCP加速

### Task 5: 期刊官网爬虫 (Claude Code)
**目标**: 从 Nature Photonics, Science, PRL, Nature 等权威期刊获取最新光学论文

**方案**: 
- 使用 Claude Code 访问期刊官网
- 抓取最新光学相关论文
- 转换为统一格式

### Task 6: MiniMax MCP 集成
**目标**: 使用 MiniMax MCP Server 加速AI分析

**条件**:
- MiniMax MCP 已配置 (`uvx minimax-coding-plan-mcp -y`)
- 使用 mcp__MiniMax__* 工具

---

## 数据源优先级
1. **ArXiv** - 核心，物理光学类论文
2. **PubMed** - 补充，生物医学光学
3. **期刊官网** - 权威，Nature/Science/PRL等
4. **Tavily** - 背景，行业动态
5. **MiniMax AI** - 分析，6维度结构化

## 卡片内容要求
- 每篇论文必须显示：标题、作者、引用数、期刊、一句话概括
- 优先显示MiniMax 6维度分析结果
- 无AI分析时：提取摘要关键句作为"一句话概括"
- 领域趋势使用AI生成

---

## 执行顺序
1. Task 1 (修复子卡片)
2. Task 2 (PubMed集成)
3. Task 4 (MiniMax优化) + Task 3 (Tavily)
4. Task 5 (期刊官网)
5. Task 6 (MCP集成)
6. 端到端测试
