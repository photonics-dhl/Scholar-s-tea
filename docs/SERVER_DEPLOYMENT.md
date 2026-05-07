# Scholar's Tea - 服务器部署指南

## 服务器配置

| 项目 | 配置 |
|------|------|
| **IP** | 10.72.212.33 |
| **系统** | CentOS 7 |
| **CPU** | 32 核心 |
| **GPU** | 无 |
| **容器** | Singularity / udocker |
| **Python** | Miniconda |

---

## 第一部分：环境准备

### 1.1 创建项目目录

```bash
# 在服务器上创建项目目录
mkdir -p /home/photonics-dhl/Scholar-s_Tea
cd /home/photonics-dhl/Scholar-s_Tea

# 或者通过 git clone
git clone https://github.com/photonics-dhl/Scholar-s-tea.git
```

### 1.2 配置 CC SWITCH (代理软件)

CC SWITCH 应该在**本地 Windows 机器**上运行，将请求转发到 MiniMax API。

**服务器端配置**（设置环境变量使用代理）:

```bash
# 在 .bashrc 或 .bash_profile 中添加
export HTTP_PROXY=http://<本地Windows IP>:端口
export HTTPS_PROXY=http://<本地Windows IP>:端口
export ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
export ANTHROPIC_AUTH_TOKEN=sk-cp-qE86-XcYk4b079O0NoNQKwcJ5wvaMlRrXE8ew1y6ovXxuMCuZ0tEv7JjoLck2Ub7VXJKmUZtR5O39Coct_dDYytXGul8BuWoty_dyzvmTnGQQsx8VCTkNBU

# 如果 CC SWITCH 在 Windows 上
# 服务器需要通过 HTTP 代理访问外网
```

### 1.3 Miniconda 环境

```bash
# 加载 Miniconda
source ~/miniconda3/etc/profile.d/conda.sh

# 创建 Python 环境
conda create -n feishu-bot python=3.11 -y
conda activate feishu-bot

# 安装基础依赖
pip install fastify @fastify/cors bullmq ioredis js-yaml dotenv nodejs npm
```

---

## 第二部分：容器化部署 (Singularity)

### 2.1 制作 Singularity 镜像

```bash
# 编辑 singularity 定义文件: Singularity.feishu
Bootstrap: docker
From: node:20-alpine

%post
    # 安装 Python 和基础工具
    apk add --no-cache python3 py3-pip bash curl

    # 安装 Node.js 依赖
    cd /app
    npm install fastify @fastify/cors bullmq ioredis js-yaml dotenv

%environment
    export ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
    export API_TIMEOUT_MS=3000000
```

### 2.2 构建镜像

```bash
# 在有 sudo 权限的机器上构建
sudo singularity build feishu-bot.sif Singularity.feishu

# 或者使用 remote build (如果配置了)
singularity remote build
```

### 2.3 使用 udocker (无 root 权限)

```bash
# 安装 udocker
curl https://raw.githubusercontent.com/indigo-dc/udocker/master/udocker.py > udocker
chmod +x udocker
mv udocker ~/bin/

# 创建容器
udocker create --name=feishu-bot node:20-alpine

# 运行
udocker run -p 3000:3000 -v /home/photonics-dhl/Scholar-s_Tea:/app feishu-bot
```

---

## 第三部分：飞书 Bot 部署

### 3.1 安装 Node.js 依赖

```bash
cd /home/photonics-dhl/Scholar-s_Tea/feishu-bot

# 使用 npm ci 安装依赖
npm ci --prefer-offline

# 或者 npm install
npm install
```

### 3.2 配置环境变量

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑 .env
vim .env
```

`.env` 内容:

```env
# 飞书配置
FEISHU_APP_ID=cli_a94ccd680e785cd2
FEISHU_APP_SECRET=PL0PKvlnsSZ4J8pKRqF9Eh7DCYMFbnRw
FEISHU_VERIFICATION_TOKEN=IlXmFmDWiE89w8xa6ZWnpbmSMcE6q0Pk

# 代理配置 (如果需要)
HTTP_PROXY=http://<CC_SWITCH_IP>:端口
HTTPS_PROXY=http://<CC_SWITCH_IP>:端口

# MiniMax API
ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
ANTHROPIC_AUTH_TOKEN=sk-cp-qE86-XcYk4b079O0NoNQKwcJ5wvaMlRrXE8ew1y6ovXxuMCuZ0tEv7JjoLck2Ub7VXJKmUZtR5O39Coct_dDYytXGul8BuWoty_dyzvmTnGQQsx8VCTkNBU

# 服务器配置
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
ALLOWED_USERS=ferencecrystal996@gmail.com
```

### 3.3 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动 Bot
cd /home/photonics-dhl/Scholar-s_Tea/feishu-bot
pm2 start src/index.js --name feishu-bot

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

### 3.4 配置系统服务 (systemd)

创建 `/etc/systemd/system/feishu-bot.service`:

```ini
[Unit]
Description=Scholar's Tea Feishu Bot
After=network.target

[Service]
Type=simple
User=photonics-dhl
WorkingDirectory=/home/photonics-dhl/Scholar-s_Tea/feishu-bot
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
sudo systemctl daemon-reload
sudo systemctl enable feishu-bot
sudo systemctl start feishu-bot
sudo systemctl status feishu-bot
```

---

## 第四部分：反向代理 (Nginx)

### 4.1 安装 Nginx

```bash
sudo yum install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4.2 配置反向代理

编辑 `/etc/nginx/conf.d/feishu-bot.conf`:

```nginx
server {
    listen 80;
    server_name 10.72.212.33;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # 健康检查端点
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4.3 配置 HTTPS (Let's Encrypt)

```bash
sudo yum install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 第五部分：防火墙配置

```bash
# 开放端口
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# 或者直接关闭防火墙 (测试环境)
sudo systemctl stop firewalld
sudo systemctl disable firewalld
```

---

## 第六部分：验证部署

### 6.1 检查服务状态

```bash
# PM2 状态
pm2 status

# systemd 状态
sudo systemctl status feishu-bot

# 测试健康检查
curl http://localhost:3000/health
```

### 6.2 测试飞书连接

在飞书中发送消息给 Bot:

```
/help
```

如果 Bot 回复帮助信息，说明部署成功。

---

## 故障排除

### 问题：npm install 失败

```bash
# 清理缓存
npm cache clean --force

# 使用镜像
npm config set registry https://registry.npmmirror.com
npm install
```

### 问题：无法连接到 MiniMax API

```bash
# 检查代理配置
echo $HTTP_PROXY
echo $ANTHROPIC_BASE_URL

# 测试连接
curl -I https://api.minimaxi.com/anthropic
```

### 问题：端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep 3000

# 杀死进程
kill -9 <PID>
```

---

## 快速部署命令汇总

```bash
# 1. 安装基础环境
source ~/miniconda3/etc/profile.d/conda.sh
conda create -n feishu-bot python=3.11 nodejs npm -y
conda activate feishu-bot

# 2. 安装 Bot
cd /home/photonics-dhl/Scholar-s_Tea/feishu-bot
npm install

# 3. 配置
cp .env.example .env
vim .env  # 填写配置

# 4. 启动
pm2 start src/index.js --name feishu-bot
pm2 save
pm2 startup

# 5. Nginx 反向代理
sudo yum install nginx -y
sudo systemctl enable nginx
sudo vim /etc/nginx/conf.d/feishu-bot.conf
sudo systemctl reload nginx

# 6. 防火墙
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```
