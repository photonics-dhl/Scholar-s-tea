# Optics Research Tracker - Hermes Skill

## 概述

光学论文追踪系统，自动检索 ArXiv/PubMed 论文，AI 分析后通过飞书卡片推送。

## 触发方式

在飞书 Daily 群发送：
- "光学追踪"
- "光学速递"
- "推送光学卡片"

## 8 大领域配置

| 领域ID | 中文名 | 英文名 | 图标 |
|--------|--------|--------|------|
| ultrafast_optics | 超快光学 | Ultrafast Optics | ⚡ |
| metamaterial_optics | 超材料与纳米光学 | Metamaterial & Nanophotonics | 🧱 |
| nearfield_optics | 近场光学 | Near-field Optics | 🔎 | `near-field`, `NSOM`, `SNOM`, `evanescent wave`, `super-resolution`, `STED`, `deep subwavelength`, `subwavelength`, `nano-optics`, `tip-enhanced`, `TERS`, `s-SNOM`, `PSTM` |
| laser_processing | 激光加工与制造 | Laser Processing | 🔥 |
| nonlinear_optics | 非线性光学 | Nonlinear Optics | 🌊 |
| nanophotonics | 硅基光子学与量子光学 | Silicon Photonics & Quantum Optics | 💎 |
| biophotonics | 生物与医学光子学 | Biomedical Photonics | 🏥 |
| quantum_optics | 光通信与光纤传感 | Optical Communication & Fiber Sensing | 📡 |

## 卡片布局

### 主卡片 (AAqejKhk6IPow)
- 2x4 网格布局，8个领域
- 每个领域格：标题 + 小结 + "查看详情"按钮
- 按钮点击跳转到对应子卡片

### 子卡片 (AAqejTzWm5upF)
- 单领域论文详情（最多6篇）
- 每篇论文：标题、作者、来源、引用数
- 6维度AI分析：概括、研究思路、实验方案、创新点、关联工作、评价
- "返回总览"按钮返回主卡片

## 卡片变量

### 主卡片
```
domain1~8:     领域标题，如 "⚡ 超快光学\n最新进展: **5** 篇"
subdomain1~8:  AI生成的小结，包含重点、发展趋势、启发
time:          推送时间，如 "🕐 推送时间: 2026-04-18 10:00"
```

### 子卡片（每篇论文）
```
category_title_X:     论文标题
category_cite_X:      引用信息
category_content_X:   6维度详细内容
URL_X:               论文链接
```

## 技术架构

### 多源检索
| 来源 | 用途 |
|------|------|
| ArXiv API | 物理光学论文（核心） |
| Semantic Scholar | 引用数、期刊信息 |
| PubMed | 生物医学光学补充 |
| MiniMax M2.7 | 6维度论文分析 |

### ArXiv 过滤策略
```
(physics.optics OR quant-ph OR physics.app-ph OR physics.atom-ph)
AND (all:keyword1 AND all:keyword2 AND all:keyword3)
```
- 必须属于光学相关物理类别
- 必须包含领域关键词

### 质量筛选
1. 光学相关性：ArXiv类目 + 关键词双重过滤
2. 引用数：Semantic Scholar 获取，>50 优先
3. 新鲜度：近 90 天
4. AI分析：MiniMax 6维度结构化分析

## 运行脚本

### 路径
```
/data/home/zju321/.hermes/skills/optics-research-tracker/optics_tracker_v2.py
```

### 命令行参数
```bash
python3 optics_tracker_v2.py --feishu --template --days 90 --top 6
```

| 参数 | 说明 |
|------|------|
| --feishu | 发送飞书卡片 |
| --template | 使用模板卡片 |
| --days 90 | 检索近90天论文 |
| --top 6 | 每领域最多6篇 |
| --fast | 跳过分析和趋势生成（快速测试） |
| --category xxx | 只搜索指定领域 |

### 环境变量
```bash
FEISHU_APP_ID=cli_a94ccd680e785cd2
FEISHU_APP_SECRET=***
FEISHU_TARGET_GROUP=oc_6172e7ce838d85f4928d6ee707203b60
MINIMAX_API_KEY=sk-cp-***
```

## 推送目标

- 群组ID: `oc_6172e7ce838d85f4928d6ee707203b60`（超快茶话会）

## 关键文件

| 文件 | 说明 |
|------|------|
| optics_tracker_v2.py | 主脚本 |
| optics_categories.json | 8领域关键词配置 |
| card_server.py | Flask 服务器（提供子卡片 HTML 页面）|
| father.md | 主卡片模板 JSON — 飞书模板 AAqejKhk6IPow 的变量结构说明 |
| child.md | 子卡片模板 JSON — 飞书模板 AAqejTzWm5upF 的变量结构说明 |
| perf_test.py | 性能测试脚本 |

## 注意事项

1. ArXiv 有频率限制（3秒/请求），代码已内置重试
2. MiniMax API 返回的 `reasoning_content`（思考标签）通过 `html.unescape()` + `while` 循环彻底清除，防止乱码
3. PubMed 补充条件：`biophotonics`、`nearfield_optics`、或总论文数<3时触发
4. 近场光学关键词已扩展（NSOM/SNOM/deep subwavelength/s-SNOM/TERS等）
5. 网络问题导致论文数为0时，可尝试 `--fast` 快速测试 ArXiv 连接