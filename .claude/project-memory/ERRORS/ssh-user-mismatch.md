---
name: ssh-user-mismatch
description: SSH连接时用户与密钥不匹配问题
type: error
date: 2026-04-14
tags: [ssh, connection, server]
---

# SSH 用户与密钥不匹配

## 问题描述
使用 SSH 连接服务器时，即使密钥正确但一直 Permission denied。

## 环境
- 服务器: 10.72.212.33
- SSH 密钥: `C:/Users/Mac/.ssh/id_ed25519_scholars_tea`
- 密钥对应用户: `zju321@10.72.212.33`

## 错误信息
```
root@10.72.212.33: Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password,hostbased).
```

## 根因分析
服务器上 `~/.ssh/authorized_keys` 属于 `zju321` 用户，但尝试用 `root@10.72.212.33` 连接。

## 解决方案
使用正确的用户名连接：
```bash
ssh -i "C:/Users/Mac/.ssh/id_ed25519_scholars_tea" zju321@10.72.212.33
```

## 验证方法
执行 `echo connected`，成功返回即表示连接正常。