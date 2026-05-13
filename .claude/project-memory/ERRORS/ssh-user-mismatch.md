---
name: ssh-user-mismatch
description: SSH连接方式与密钥配置
type: error
date: 2026-05-13
tags: [ssh, connection, server]
---

# SSH 连接配置（已确认，永不可忘）

## 正确的连接方式

**必须**使用 `~/.ssh/config` 中预配置的 Host 别名连接，不要手动指定密钥：

```bash
ssh ZJU-MSE-HPC
```

## 配置详情（~/.ssh/config）

```
Host ZJU-MSE-HPC
  HostName 10.72.212.33
  User zju321
  Port 22
  IdentityFile C:\Users\Mac\.ssh\id_ed25519_dirac
  IdentitiesOnly yes
```

| 项目 | 值 |
|------|-----|
| Host 别名 | `ZJU-MSE-HPC` |
| 服务器 IP | `10.72.212.33` |
| 用户名 | `zju321` |
| 密钥文件 | `C:/Users/Mac/.ssh/id_ed25519_dirac` |
| 认证方式 | 仅密钥（`IdentitiesOnly yes`） |

## 错误连接方式（禁止）

以下方式会导致 `Permission denied`：

```bash
# ❌ 错误：手动指定用户，不加载 ssh config
ssh zju321@10.72.212.33

# ❌ 错误：使用错误的密钥文件
ssh -i "C:/Users/Mac/.ssh/id_ed25519_scholars_tea" zju321@10.72.212.33

# ❌ 错误：使用 root 用户
ssh root@10.72.212.33
```

## 服务器环境

- **OS**: CentOS 7
- **Node.js**: 20 LTS
- **Python**: miniconda3/envs/hermes (Python 3.11)
- **项目路径**: `/data/home/zju321/321/DHL/Scholar's_Tea`
- **符号链接**: `~/scholars -> /data/home/zju321/321/DHL/Scholar's_Tea`

## 核心规则

1. **永远使用 `ssh ZJU-MSE-HPC`**，不要尝试其他方式
2. **所有服务运行都在服务器上**，本地 Windows 只是代码副本
3. **禁止在本地判断服务器状态**（进程、文件、配置等）

## 验证方法

```bash
ssh ZJU-MSE-HPC "echo connected && whoami && hostname"
```

预期输出：
```
connected
zju321
mu02
```
