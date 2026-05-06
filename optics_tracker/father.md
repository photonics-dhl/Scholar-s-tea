# 主卡片模板 JSON — AAqejKhk6IPow

## 模板变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| domain1~domain8 | 领域标题，含图标、名称、英文名、最新进展 | `⚡ **超快光学**<br>Ultrafast Optics<br>最新进展：**5** 篇` |
| subdomain1~subdomain8 | AI生成的小结（3要点格式） | `📋 **小结：**<br>• 重点是...<br>• 发展趋势是...<br>• 启发是...` |
| time | 推送时间 | `🕐 推送时间: 2026-04-19 15:30` |

## 布局结构（2x4 网格）

```
┌─────────────────────┬─────────────────────┐
│ domain1 / subdomain1 │ domain2 / subdomain2 │
│    [查看详情 ▶]      │    [查看详情 ▶]      │
├─────────────────────┼─────────────────────┤
│ domain3 / subdomain3 │ domain4 / subdomain4 │
│    [查看详情 ▶]      │    [查看详情 ▶]      │
├─────────────────────┼─────────────────────┤
│ domain5 / subdomain5 │ domain6 / subdomain6 │
│    [查看详情 ▶]      │    [查看详情 ▶]      │
├─────────────────────┼─────────────────────┤
│ domain7 / subdomain7 │ domain8 / subdomain8 │
│    [查看详情 ▶]      │    [查看详情 ▶]      │
└─────────────────────┴─────────────────────┘
```

## 主卡片 header

```json
{
  "header": {
    "title": {
      "tag": "plain_text",
      "content": "🔬 光学领域每日速递"
    },
    "subtitle": {
      "tag": "plain_text",
      "content": ""
    },
    "text_tag_list": [
      {
        "tag": "text_tag",
        "text": {
          "tag": "plain_text",
          "content": "光学人的茶话会 (Talk, drink and spark)"
        },
        "color": "wathet"
      }
    ],
    "template": "blue",
    "padding": "12px 8px 12px 8px"
  }
}
```

## 主卡片 body 模板（2x4 网格 JSON）

> ⚠️ 以下为飞书模板 JSON 格式，定义 `domain1~domain8`、`subdomain1~subdomain8`、`time` 变量的渲染结构。
> 实际使用时通过 API 传递 `template_variable` 注入内容。

```json
{
  "config": {
    "update_multi": true,
    "style": {
      "text_size": {
        "normal_v2": {
          "default": "normal",
          "pc": "normal",
          "mobile": "heading"
        }
      }
    }
  },
  "schema": "2.0",
  "header": {
    "title": {
      "tag": "plain_text",
      "content": "🔬 光学领域每日速递"
    },
    "subtitle": {
      "tag": "plain_text",
      "content": ""
    },
    "text_tag_list": [
      {
        "tag": "text_tag",
        "text": {
          "tag": "plain_text",
          "content": "光学人的茶话会 (Talk, drink and spark)"
        },
        "color": "wathet"
      }
    ],
    "template": "blue",
    "padding": "12px 8px 12px 8px"
  },
  "body": {
    "direction": "vertical",
    "elements": [
      {
        "tag": "column_set",
        "flex_mode": "stretch",
        "horizontal_spacing": "12px",
        "horizontal_align": "left",
        "margin": "0px 0px 0px 0px",
        "columns": [
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "background_style": "blue-50",
            "padding": "12px 12px 12px 12px",
            "vertical_spacing": "8px",
            "horizontal_align": "left",
            "vertical_align": "top",
            "elements": [
              {
                "tag": "interactive_container",
                "width": "fill",
                "height": "auto",
                "has_border": false,
                "direction": "vertical",
                "elements": [
                  {
                    "tag": "markdown",
                    "content": "{{domain1}}",
                    "text_align": "center",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "markdown",
                    "content": "{{subdomain1}}",
                    "text_align": "left",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "button",
                    "text": {
                      "tag": "plain_text",
                      "content": "[查看详情 ▶]"
                    },
                    "type": "primary_text",
                    "width": "fill",
                    "behaviors": [
                      {
                        "type": "open_url",
                        "default_url": "{{detail_url_1}}",
                        "pc_url": "{{detail_url_1}}",
                        "ios_url": "{{detail_url_1}}",
                        "android_url": "{{detail_url_1}}"
                      }
                    ],
                    "margin": "4px 0px 4px 0px"
                  }
                ]
              }
            ]
          },
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "background_style": "blue-50",
            "padding": "12px 12px 12px 12px",
            "vertical_spacing": "8px",
            "horizontal_align": "left",
            "vertical_align": "top",
            "elements": [
              {
                "tag": "interactive_container",
                "width": "fill",
                "height": "auto",
                "has_border": false,
                "direction": "vertical",
                "elements": [
                  {
                    "tag": "markdown",
                    "content": "{{domain2}}",
                    "text_align": "center",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "markdown",
                    "content": "{{subdomain2}}",
                    "text_align": "left",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "button",
                    "text": {
                      "tag": "plain_text",
                      "content": "[查看详情 ▶]"
                    },
                    "type": "primary_text",
                    "width": "fill",
                    "behaviors": [
                      {
                        "type": "open_url",
                        "default_url": "{{detail_url_2}}",
                        "pc_url": "{{detail_url_2}}",
                        "ios_url": "{{detail_url_2}}",
                        "android_url": "{{detail_url_2}}"
                      }
                    ],
                    "margin": "4px 0px 4px 0px"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "tag": "column_set",
        "flex_mode": "stretch",
        "horizontal_spacing": "12px",
        "horizontal_align": "left",
        "margin": "0px 0px 0px 0px",
        "columns": [
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "background_style": "blue-50",
            "padding": "12px 12px 12px 12px",
            "vertical_spacing": "8px",
            "horizontal_align": "left",
            "vertical_align": "top",
            "elements": [
              {
                "tag": "interactive_container",
                "width": "fill",
                "height": "auto",
                "has_border": false,
                "direction": "vertical",
                "elements": [
                  {
                    "tag": "markdown",
                    "content": "{{domain3}}",
                    "text_align": "center",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "markdown",
                    "content": "{{subdomain3}}",
                    "text_align": "left",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "button",
                    "text": {
                      "tag": "plain_text",
                      "content": "[查看详情 ▶]"
                    },
                    "type": "primary_text",
                    "width": "fill",
                    "behaviors": [
                      {
                        "type": "open_url",
                        "default_url": "{{detail_url_3}}",
                        "pc_url": "{{detail_url_3}}",
                        "ios_url": "{{detail_url_3}}",
                        "android_url": "{{detail_url_3}}"
                      }
                    ],
                    "margin": "4px 0px 4px 0px"
                  }
                ]
              }
            ]
          },
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "background_style": "blue-50",
            "padding": "12px 12px 12px 12px",
            "vertical_spacing": "8px",
            "horizontal_align": "left",
            "vertical_align": "top",
            "elements": [
              {
                "tag": "interactive_container",
                "width": "fill",
                "height": "auto",
                "has_border": false,
                "direction": "vertical",
                "elements": [
                  {
                    "tag": "markdown",
                    "content": "{{domain4}}",
                    "text_align": "center",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "markdown",
                    "content": "{{subdomain4}}",
                    "text_align": "left",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "button",
                    "text": {
                      "tag": "plain_text",
                      "content": "[查看详情 ▶]"
                    },
                    "type": "primary_text",
                    "width": "fill",
                    "behaviors": [
                      {
                        "type": "open_url",
                        "default_url": "{{detail_url_4}}",
                        "pc_url": "{{detail_url_4}}",
                        "ios_url": "{{detail_url_4}}",
                        "android_url": "{{detail_url_4}}"
                      }
                    ],
                    "margin": "4px 0px 4px 0px"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "tag": "column_set",
        "flex_mode": "stretch",
        "horizontal_spacing": "12px",
        "horizontal_align": "left",
        "margin": "0px 0px 0px 0px",
        "columns": [
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "background_style": "blue-50",
            "padding": "12px 12px 12px 12px",
            "vertical_spacing": "8px",
            "horizontal_align": "left",
            "vertical_align": "top",
            "elements": [
              {
                "tag": "interactive_container",
                "width": "fill",
                "height": "auto",
                "has_border": false,
                "direction": "vertical",
                "elements": [
                  {
                    "tag": "markdown",
                    "content": "{{domain5}}",
                    "text_align": "center",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "markdown",
                    "content": "{{subdomain5}}",
                    "text_align": "left",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "button",
                    "text": {
                      "tag": "plain_text",
                      "content": "[查看详情 ▶]"
                    },
                    "type": "primary_text",
                    "width": "fill",
                    "behaviors": [
                      {
                        "type": "open_url",
                        "default_url": "{{detail_url_5}}",
                        "pc_url": "{{detail_url_5}}",
                        "ios_url": "{{detail_url_5}}",
                        "android_url": "{{detail_url_5}}"
                      }
                    ],
                    "margin": "4px 0px 4px 0px"
                  }
                ]
              }
            ]
          },
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "background_style": "blue-50",
            "padding": "12px 12px 12px 12px",
            "vertical_spacing": "8px",
            "horizontal_align": "left",
            "vertical_align": "top",
            "elements": [
              {
                "tag": "interactive_container",
                "width": "fill",
                "height": "auto",
                "has_border": false,
                "direction": "vertical",
                "elements": [
                  {
                    "tag": "markdown",
                    "content": "{{domain6}}",
                    "text_align": "center",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "markdown",
                    "content": "{{subdomain6}}",
                    "text_align": "left",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "button",
                    "text": {
                      "tag": "plain_text",
                      "content": "[查看详情 ▶]"
                    },
                    "type": "primary_text",
                    "width": "fill",
                    "behaviors": [
                      {
                        "type": "open_url",
                        "default_url": "{{detail_url_6}}",
                        "pc_url": "{{detail_url_6}}",
                        "ios_url": "{{detail_url_6}}",
                        "android_url": "{{detail_url_6}}"
                      }
                    ],
                    "margin": "4px 0px 4px 0px"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "tag": "column_set",
        "flex_mode": "stretch",
        "horizontal_spacing": "12px",
        "horizontal_align": "left",
        "margin": "0px 0px 0px 0px",
        "columns": [
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "background_style": "blue-50",
            "padding": "12px 12px 12px 12px",
            "vertical_spacing": "8px",
            "horizontal_align": "left",
            "vertical_align": "top",
            "elements": [
              {
                "tag": "interactive_container",
                "width": "fill",
                "height": "auto",
                "has_border": false,
                "direction": "vertical",
                "elements": [
                  {
                    "tag": "markdown",
                    "content": "{{domain7}}",
                    "text_align": "center",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "markdown",
                    "content": "{{subdomain7}}",
                    "text_align": "left",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "button",
                    "text": {
                      "tag": "plain_text",
                      "content": "[查看详情 ▶]"
                    },
                    "type": "primary_text",
                    "width": "fill",
                    "behaviors": [
                      {
                        "type": "open_url",
                        "default_url": "{{detail_url_7}}",
                        "pc_url": "{{detail_url_7}}",
                        "ios_url": "{{detail_url_7}}",
                        "android_url": "{{detail_url_7}}"
                      }
                    ],
                    "margin": "4px 0px 4px 0px"
                  }
                ]
              }
            ]
          },
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "background_style": "blue-50",
            "padding": "12px 12px 12px 12px",
            "vertical_spacing": "8px",
            "horizontal_align": "left",
            "vertical_align": "top",
            "elements": [
              {
                "tag": "interactive_container",
                "width": "fill",
                "height": "auto",
                "has_border": false,
                "direction": "vertical",
                "elements": [
                  {
                    "tag": "markdown",
                    "content": "{{domain8}}",
                    "text_align": "center",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "markdown",
                    "content": "{{subdomain8}}",
                    "text_align": "left",
                    "text_size": "normal_v2",
                    "margin": "0px 0px 4px 0px"
                  },
                  {
                    "tag": "button",
                    "text": {
                      "tag": "plain_text",
                      "content": "[查看详情 ▶]"
                    },
                    "type": "primary_text",
                    "width": "fill",
                    "behaviors": [
                      {
                        "type": "open_url",
                        "default_url": "{{detail_url_8}}",
                        "pc_url": "{{detail_url_8}}",
                        "ios_url": "{{detail_url_8}}",
                        "android_url": "{{detail_url_8}}"
                      }
                    ],
                    "margin": "4px 0px 4px 0px"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "tag": "hr",
        "margin": "8px 0px 8px 0px"
      },
      {
        "tag": "markdown",
        "content": "{{time}}",
        "text_align": "center",
        "text_size": "normal",
        "margin": "0px 0px 0px 0px"
      }
    ]
  }
}
```

## 布局说明

- **2x4 网格**：4个 `column_set` 行，每行 2 个 `column`（每格 `weight: 1`）
- **蓝色底**：`background_style: "blue-50"`
- **每个格子内**：`markdown(标题) + markdown(小结) + button(查看详情)`
- **按钮行为**：`open_url` 跳转到 ngrok 子卡片页面
