---
name: server-node-env
description: CentOS 7 服务器 Node.js 环境配置
type: solution
date: 2026-04-14
tags: [node.js, centos7, server, environment]
---

# CentOS 7 服务器 Node.js 环境配置

## 背景
服务器 CentOS 7 系统自带的 glibc 版本较低（GLIBC_2.17 左右），直接使用高版本 Node.js 会报错：
```
version 'GLIBC_2.27' not found
version 'GLIBC_2.25' not found
version 'GLIBC_2.28' not found
```

## 解决方案
使用 miniconda 环境中的 Node.js，并配合 LD_PRELOAD 加载兼容库。

### 启动脚本 (start-server.sh)
```bash
#!/bin/bash
# 设置 Node.js 环境
source ~/miniconda3/etc/profile.d/conda.sh
conda activate ai_agent
export LD_PRELOAD=/data/home/zju321/miniconda3/envs/ai_agent/lib/libstdc++.so.6.0.34
export PATH=/data/home/zju321/miniconda3/envs/ai_agent/bin:$PATH

# 启动服务
cd /data/home/zju321/Scholar/feishu-bot
node src/index.js
```

### 关键点
1. **使用 conda 环境**: `/data/home/zju321/miniconda3/envs/ai_agent/bin/node`
2. **LD_PRELOAD**: 加载 `/data/home/zju321/miniconda3/envs/ai_agent/lib/libstdc++.so.6.0.34` 解决 libstdc++ 版本问题
3. **PATH 优先级**: 确保 conda 环境 PATH 在系统路径之前

## 验证方法
```bash
LD_PRELOAD=/data/home/zju321/miniconda3/envs/ai_agent/lib/libstdc++.so.6.0.34 \
  /data/home/zju321/miniconda3/envs/ai_agent/bin/node --version
# 应输出: v20.19.6
```

## 相关路径
- Node.js: `/data/home/zju321/miniconda3/envs/ai_agent/bin/node`
- LD_PRELOAD 库: `/data/home/zju321/miniconda3/envs/ai_agent/lib/libstdc++.so.6.0.34`
- 项目路径: `/data/home/zju321/Scholar/feishu-bot/`