# 子卡片模板 JSON — AAqejTzWm5upF

## 模板变量说明

| 变量名 | 说明 |
|--------|------|
| category_title | 子卡片大标题，如 `⚡ 超快光学 \| Ultrafast Optics` |
| category_title_1~6 | 每篇论文的标题行 |
| category_cite / category_cite2~6 | 每篇论文的引用/期刊/作者信息 |
| category_content / category_content2~6 | 每篇论文的 6 维度 AI 分析内容 |
| sub1 | 统计行1，如 `新论文: **5** 篇` |
| sub2 | 统计行2，如 `总引用: **120** 次` |
| sub3_2 | 统计行3，如 `高引(>50): **2** 篇` |
| sub4 | 统计行4，如 `顶刊: **1** 篇` |
| URL1 | 返回主卡片的链接（跳转到 `AAqejKhk6IPow` 或 ngrok 主页面） |

## 卡片布局结构

```
┌──────────────────────────────────────────────────────┐
│  [category_title]  ⚡ 超快光学 | Ultrafast Optics   │
├──────────────────────────────────────────────────────┤
│  📄 **1.** [论文标题70字]                             │
│     📚 阅读数: **234**  |  🏠 期刊: arXiv             │
│     👥 张三、 李四                                    │
│     • 一句话概括：...                                 │
│     • 研究思路：...                                   │
│     • 实验方案：...                                   │
│     • 创新点：...                                     │
│     • 关联工作：...                                   │
│     • 评价：...                                      │
│  ─────────────────────────────────────────────────── │
│  📄 **2.** [论文标题70字]                             │
│  ...（共6篇）                                        │
├──────────────────────────────────────────────────────┤
│  📊 新论文: 5篇  |  总引用: 120次  |  高引>50: 2篇   │
│  🔙 [返回总览]                                       │
└──────────────────────────────────────────────────────┘
```

## 子卡片 body 模板 JSON

```json
{
  "config": {
    "update_multi": true
  },
  "schema": "2.0",
  "header": {
    "title": {
      "tag": "plain_text",
      "content": "{{category_title}}"
    },
    "subtitle": {
      "tag": "plain_text",
      "content": "光学论文详情"
    },
    "template": "purple",
    "padding": "12px 8px 12px 8px"
  },
  "body": {
    "direction": "vertical",
    "elements": [
      {
        "tag": "markdown",
        "content": "{{category_title_1}}",
        "margin": "8px 0px 2px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_cite}}",
        "margin": "0px 0px 2px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_content}}",
        "margin": "0px 0px 8px 0px"
      },
      {
        "tag": "hr",
        "margin": "4px 0px 4px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_title_2}}",
        "margin": "8px 0px 2px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_cite2}}",
        "margin": "0px 0px 2px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_content2}}",
        "margin": "0px 0px 8px 0px"
      },
      {
        "tag": "hr",
        "margin": "4px 0px 4px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_title_3}}",
        "margin": "8px 0px 2px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_cite3}}",
        "margin": "0px 0px 2px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_content3}}",
        "margin": "0px 0px 8px 0px"
      },
      {
        "tag": "hr",
        "margin": "4px 0px 4px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_title_4}}",
        "margin": "8px 0px 2px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_cite4}}",
        "margin": "0px 0px 2px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_content4}}",
        "margin": "0px 0px 8px 0px"
      },
      {
        "tag": "hr",
        "margin": "4px 0px 4px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_title_5}}",
        "margin": "8px 0px 2px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_cite5}}",
        "margin": "0px 0px 2px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_content5}}",
        "margin": "0px 0px 8px 0px"
      },
      {
        "tag": "hr",
        "margin": "4px 0px 4px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_title_6}}",
        "margin": "8px 0px 2px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_cite6}}",
        "margin": "0px 0px 2px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{category_content6}}",
        "margin": "0px 0px 8px 0px"
      },
      {
        "tag": "hr",
        "margin": "4px 0px 4px 0px"
      },
      {
        "tag": "markdown",
        "content": "📊 {{sub1}}  |  📚 {{sub2}}  |  ⭐ {{sub3_2}}  |  🏆 {{sub4}}",
        "text_align": "center",
        "text_size": "normal",
        "margin": "8px 0px 4px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{URL1}}",
        "text_align": "center",
        "margin": "4px 0px 0px 0px"
      }
    ]
  }
}
```

## 6 维度内容格式（category_content_X）

每篇论文的分析内容包含 6 个维度，每个维度严格 ≤80 字：

```
• 一句话概括：[summary内容，≤80字]
• 研究思路：[research思路内容，≤80字]
• 实验方案：[experiment内容，≤80字]
• 创新点：[innovation内容，≤80字]
• 关联工作：[related_work内容，≤80字]
• 评价：[impact内容，≤80字]
```

内容使用 `<font color='grey'>` 包裹以灰色显示（美观）。

## URL1 返回按钮

```json
{
  "tag": "markdown",
  "content": "<a href='https://colony-party-unpledged.ngrok-free.dev'>🔙 返回总览</a>"
}
```

## 统计数据说明

| 变量 | 含义 | 计算方式 |
|------|------|---------|
| sub1 | 新论文数 | `len(papers)` |
| sub2 | 总引用数 | `sum(p.citations for p in papers)` |
| sub3_2 | 高引论文数 | `len([p for p in papers if p.citations > 50])` |
| sub4 | 顶刊论文数 | `len([p for p in papers if p.venue in ['Nature','Science','Nature Photonics','PRL','Science Advances']])` |

## 注意事项

1. **变量索引规则**：`category_title_1` / `category_cite` / `category_content` 对应第一篇论文；第二篇开始用 `category_title_2` / `category_cite2` / `category_content2`，以此类推
2. **空槽处理**：当论文不足 6 篇时，未使用的变量留空或填 `""`，飞书模板会忽略空变量
3. **内容长度**：每维度分析严格控制在 80 字以内，超长自动截断（优先在标点处截断）
4. **header template**：`purple` 主题色，与主卡片的 `blue` 区分
