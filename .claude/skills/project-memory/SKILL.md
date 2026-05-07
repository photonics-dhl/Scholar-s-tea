---
name: project-memory
description: 项目错误记录与经验积累技能。当遇到项目错误、需要修复问题、或进行配置修改时，自动记录错误原因和解决方案到项目专属记忆文件，而非根目录 memory。触发场景：项目报错、配置失败、部署问题、SDK集成问题、环境问题。
---

# Project Memory Skill

项目专属错误记录和经验积累系统，避免污染全局记忆。

## 核心原则

1. **错误即学习** — 每个错误都应记录原因和解决方案
2. **位置正确** — 项目相关错误存在项目目录 `.claude/project-memory/` 下，不写入根目录 memory
3. **可追溯** — 记录时间、上下文、错误类型

## 目录结构

```
.claude/project-memory/
├── ERRORS/
│   ├── ssh-connections.md      # SSH/服务器连接相关
│   ├── lark-sdk.md            # 飞书 SDK 集成问题
│   ├── node-glibc.md          # Node.js GLIBC 版本问题
│   ├── claude-code.md         # Claude Code CLI 问题
│   └── [category].md          # 按类型新增
├── SOLUTIONS/
│   ├── server-setup.md        # 服务器配置经验
│   ├── env-variables.md       # 环境变量配置
│   └── [topic].md            # 按主题新增
└── MEMORY_INDEX.md            # 记忆索引
```

## 工作流程

### 遇到错误时

1. 首先检查 `.claude/project-memory/ERRORS/` 中是否有相似记录
2. 如果是新错误，创建新文件或追加到相关分类
3. 如果是已记录的错误，验证解决方案是否仍然有效

### 记录格式

```markdown
---
name: error-[short-name]
description: [错误简述]
type: error
date: YYYY-MM-DD
tags: [relevant-tags]
---

# 错误标题

## 问题描述
[清晰描述问题]

## 环境
- 服务器: [IP/主机名]
- OS: [系统版本]
- 组件: [相关组件版本]

## 错误信息
```
[完整错误日志]
```

## 根因分析
[分析根本原因]

## 解决方案
[具体解决步骤]

## 验证方法
[如何确认问题已解决]
```

### 记录经验时

```markdown
---
name: solution-[short-name]
description: [经验简述]
type: solution
date: YYYY-MM-DD
tags: [relevant-tags]
---

# 经验标题

## 背景
[什么场景下学到的]

## 具体做法
[详细步骤]

## 注意事项
[避免踩坑]

## 相关错误
[链接到相关错误记录]
```

## 触发检查

遇到以下情况时，主动检查或记录：
- **部署/配置错误** → 记录到 `ERRORS/`
- **SDK 集成问题** → 记录到 `ERRORS/lark-sdk.md` 等
- **环境兼容性问题** → 记录到 `ERRORS/node-glibc.md`
- **成功配置新服务** → 记录到 `SOLUTIONS/`
- **发现有用配置** → 更新 `SOLUTIONS/`

## 查询已有记录

遇到问题时，先查找是否有记录：
```
.claude/project-memory/ERRORS/
.claude/project-memory/SOLUTIONS/
```

使用文件内容判断是否已有相似问题。

## 与全局记忆的区分

- **全局记忆** (`MEMORY.md`): SSH 连接配置、项目概览等长期不变的基础信息
- **项目记忆**: 当前 session 会频繁遇到的具体错误和临时经验

简单判断：如果这个问题会在多个项目中出现，写入全局记忆。如果只在这个项目遇到，写入项目记忆。