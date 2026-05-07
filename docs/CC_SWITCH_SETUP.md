# CC SWITCH 代理配置指南

## 概述

CC SWITCH 是一款代理软件，用于将 API 请求转发到 MiniMax API。本项目使用 MiniMax-M2-7 模型替代 Anthropic Claude。

## 架构

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   飞书 Bot        │         │   CC SWITCH      │         │   MiniMax API    │
│   (Linux 服务器)  │ ──────> │   (Windows 本地)  │ ──────> │   api.minimaxi   │
│                   │  HTTP   │   端口: 7890     │  HTTPS  │                   │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

## 第一部分：Windows 端配置 CC SWITCH

### 1.1 下载 CC SWITCH

从官方网站或可信来源下载 CC SWITCH。

### 1.2 配置 CC SWITCH

1. 打开 CC SWITCH
2. 添加代理规则:
   - 协议: HTTP/HTTPS
   - 端口: 7890 (默认)
   - 模式: 代理

3. 配置路由规则:
   ```
   # 将 api.minimaxi.com 的流量走代理
   api.minimaxi.com -> 代理
   ```

4. 启动代理服务

### 1.3 验证 CC SWITCH

在浏览器中访问:
```
http://localhost:7890
```

或者测试 API:
```bash
curl -I https://api.minimaxi.com/anthropic
```

## 第二部分：Linux 服务器配置

### 2.1 设置环境变量

```bash
# 在 /etc/environment 或 ~/.bashrc 中添加
export HTTP_PROXY=http://<Windows_IP>:7890
export HTTPS_PROXY=http://<Windows_IP>:7890
export NO_PROXY=localhost,127.0.0.1,10.72.212.33

# 生效
source ~/.bashrc
```

### 2.2 测试连接

```bash
# 测试能否连接到 CC SWITCH
curl -I http://<Windows_IP>:7890

# 测试 MiniMax API
curl -I https://api.minimaxi.com/anthropic
```

## 第三部分：飞书 Bot 配置

### 3.1 确保环境变量传递

在启动脚本中确保代理环境变量被正确传递:

```bash
# start.sh
export HTTP_PROXY=http://<Windows_IP>:7890
export HTTPS_PROXY=http://<Windows_IP>:7890
```

### 3.2 测试 Bot

发送消息给飞书 Bot:
```
/help
```

如果 Bot 正常工作，说明代理配置正确。

## 故障排除

### 问题：连接被拒绝

```bash
# 检查 Windows 防火墙
# 确保 CC SWITCH 端口 (7890) 已开放

# 在 Windows 上测试
telnet localhost 7890
```

### 问题：API 超时

```bash
# 增加超时时间
export API_TIMEOUT_MS=600000

# 或者检查网络延迟
ping api.minimaxi.com
```

### 问题：代理不生效

```bash
# 检查环境变量
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 验证代理是否生效
curl -v https://api.minimaxi.com/anthropic
```

## 快速检查清单

- [ ] CC SWITCH 在 Windows 上运行
- [ ] 端口 7890 已开放
- [ ] Linux 服务器能访问 Windows 的 7890 端口
- [ ] 环境变量已设置
- [ ] Bot 能发送消息到飞书
- [ ] Bot 能调用 Claude Code

## 备选方案: Linux 上的代理工具

### proxychains-ng (方案 A - 推荐)

proxychains 可以让任何程序通过 HTTP/SOCKS 代理工作。

**在服务器上安装：**

```bash
# CentOS 7
sudo yum install -y gcc epel-release
curl -fsSL https://github.com/rofl0r/proxychains-ng/releases/download/v4.16/proxychains-ng-4.16.tar.xz | tar xJ
cd proxychains-ng-4.16
./configure --prefix=/usr/local
make && sudo make install
sudo make install-config
```

**配置 proxychains：**

```bash
sudo vim /usr/local/etc/proxychains.conf
```

在文件末尾添加：
```ini
[ProxyList]
http 127.0.0.1 7890
```

**使用 proxychains 运行命令：**

```bash
# 测试连接
proxychains curl -I https://api.minimaxi.com

# 运行 Claude Code
proxychains ./tools/claude-code/bin/claude.sh -p "echo test"

# 运行 npm
proxychains npm install
```

**修改 Claude Code wrapper 脚本：**

更新 `tools/claude-code/bin/claude.sh`:
```bash
#!/bin/bash
set -e

CLAUDE_TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$CLAUDE_TOOLS_DIR/../.." && pwd)"

# 加载环境变量
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# 检查 API Token
if [ -z "$ANTHROPIC_AUTH_TOKEN" ]; then
    echo "Error: ANTHROPIC_AUTH_TOKEN not set"
    exit 1
fi

# 设置默认值
export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-https://api.minimaxi.com/anthropic}"
export ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-MiniMax-M2-7}"

cd "$PROJECT_ROOT"

# 通过 proxychains 运行 Claude Code
exec proxychains "$CLAUDE_TOOLS_DIR/node_modules/.bin/claude" "$@"
```

### 使用环境变量 (方案 B)

如果 HTTP_PROXY 环境变量生效，可以直接使用：

```bash
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890

# 测试
curl -I https://api.minimaxi.com
```

### 使用 VPN

如果有企业 VPN:
```bash
export HTTP_PROXY=http://vpn-gateway:端口
export HTTPS_PROXY=http://vpn-gateway:端口
```

### 直接调用 (如果有公网 IP)

如果服务器有公网 IP 且 MiniMax 允许直连:
```bash
export ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
```

### 使用代理服务

使用公开的 HTTP 代理:
```bash
export HTTP_PROXY=http://proxy.example.com:8080
```
