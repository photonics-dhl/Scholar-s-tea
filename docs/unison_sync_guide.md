# Unison 同步指南

## 同步架构

```
C:\Users\Mac\.claude\   ←—— Unison SSH ——→   /data/home/zju321/.claude\
```

**重要**: 两端路径独立但内容同步。本地是 Windows 路径，服务器是 Linux 路径，互不干扰。

## 同步的路径

| 路径 (Unison key) | 本地 (Windows) | 服务器 (Linux) | 说明 |
|------------------|---------------|---------------|------|
| `projects` | `C:\Users\Mac\.claude\projects\` | `/data/home/zju321/.claude/projects/` | 项目会话 |
| `sessions` | `C:\Users\Mac\.claude\sessions\` | `/data/home/zju321/.claude/sessions/` | 对话历史 |
| `skills` | `C:\Users\Mac\.claude\skills\` | `/data/home/zju321/.claude/skills/` | 技能配置 |
| `memory` | `C:\Users\Mac\.claude\memory\` | `/data/home/zju321/.claude/memory/` | 记忆文件 |
| `settings.json` | `C:\Users\Mac\.claude\settings.json` | `/data/home/zju321/.claude/settings.json` | 全局配置 |
| `mcp` | `C:\Users\Mac\.claude\mcp\` | `/data/home/zju321/.claude/mcp/` | MCP 服务器代码 |
| `tavily-rotate` | `C:\Users\Mac\.claude\tavily-rotate\` | `/data/home/zju321/.claude/tavily-rotate/` | Tavily 轮换工具 |
| `plugins` | `C:\Users\Mac\.claude\plugins\cache\` | `/data/home/zju321/.claude/plugins/cache/` | 插件缓存 |

## 忽略的路径

以下目录**不同步**（由各自本地管理）：
- `backups/` — 本地备份
- `telemetry/` — 本地遥测
- `shell-snapshots/` — 本地 shell 快照
- `session-env/` — 本地会话环境
- `plans/` — 本地计划

### 同步（本地运行）

```powershell
# 方法1: bat 脚本
C:\Users\Mac\.claude\sync_claude.bat

# 方法2: 直接运行
D:\Softwares_new\unison-2.53.8-windows-x86_64\bin\unison.exe claude -batch
```

### 查看状态（不实际同步）

```powershell
D:\Softwares_new\unison-2.53.8-windows-x86_64\bin\unison.exe claude -terse
```

### 服务器端同步（从服务器 SSH 回本地）

```bash
ssh dirac-key "UNISONLOCALHOSTNAME=mu02 /data/home/zju321/softwares/unison-2.53.8-ubuntu-22.04-x86_64-static/bin/unison claude -batch"
```

## 文件位置

| 文件 | 路径 |
|------|------|
| Unison 本地 | `D:\Softwares_new\unison-2.53.8-windows-x86_64\bin\unison.exe` |
| Unison 服务器 | `/data/home/zju321/softwares/unison-2.53.8-ubuntu-22.04-x86_64-static/bin/unison` |
| Profile 配置 | `C:\Users\Mac\.unison\claude.prf` |
| 同步脚本(Win) | `C:\Users\Mac\.claude\sync_claude.bat` |
| 同步脚本(Shell) | `C:\Users\Mac\.claude\sync_claude.sh` |

## 当前同步范围

Profile `claude.prf` 中配置了以下路径：

| 路径 | 说明 |
|------|------|
| `projects` | 项目目录（含所有项目会话） |
| `sessions` | Claude Code 对话历史 |
| `skills` | 技能配置 |
| `memory` | 项目记忆文件 |
| `settings.json` | Claude Code 全局配置 |
| `mcp` | MCP 服务器代码（跨平台无路径问题） |
| `tavily-rotate` | Tavily API 轮换工具 |
| `plugins` | 插件缓存（本地和服务器各自管理 installPath） |

已忽略：`backups`、`telemetry`、`shell-snapshots`、`session-env`、`plans` 等非必要目录。

**注意**: `installed_plugins.json` 和 `known_marketplaces.json` 位于 `plugins/` 子目录，会随插件同步。但这两文件中的 `installPath` 字段需各自维护：

- 本地: `C:\Users\Mac\.claude\plugins\cache\...`
- 服务器: `/data/home/zju321/.claude/plugins/cache/...`

## 如何新增同步路径

### 场景：想把 `scripts/` 目录也同步

1. 编辑 `C:\Users\Mac\.unison\claude.prf`，在 `path` 部分加一行：
   ```
   path = projects/z---openclaw-workspace-projects-Dirac/scripts
   ```

2. 运行同步：
   ```powershell
   D:\Softwares_new\unison-2.53.8-windows-x86_64\bin\unison.exe claude -batch
   ```

## 如何忽略某些文件

在 `claude.prf` 中添加：

```bash
# 按文件名忽略
ignore = Name .DS_Store
ignore = Name Thumbs.db

# 按路径忽略
ignore = Path session-env
ignore = Path telemetry
ignore = Path backups
```

改完运行同步即可生效。

## Profile 完整示例

```bash
# Roots — 两端根目录（路径独立，内容同步）
root = C:/Users/Mac/.claude
root = ssh://zju321@10.72.212.33//data/home/zju321/.claude

# SSH 连接（使用 dirac-key）
sshargs = -i C:/Users/Mac/.ssh/id_ed25519_dirac

# 服务器 unison 路径（版本必须与本地一致）
servercmd = /data/home/zju321/softwares/unison-2.53.8-ubuntu-22.04-x86_64-static/bin/unison

# 双向自动同步
batch = true

# 同步路径（按需增减）
path = projects
path = sessions
path = skills
path = memory
path = settings.json
path = mcp
path = tavily-rotate
path = plugins

# 忽略项（各自本地管理）
ignore = Name .DS_Store
ignore = Name Thumbs.db
ignore = Path session-env
ignore = Path shell-snapshots
ignore = Path telemetry
ignore = Path backups
ignore = Path plans

# 重试次数
retry = 3

# 日志
log = true
logfile = C:/Users/Mac/.unison/unison.log
```

## 插件说明

### 当前启用的插件

| 插件 | 版本 | 作用 | 触发场景 |
|------|------|------|----------|
| `agent-skills@addy-agent-skills` | 1.0.0 | 工程师技能库（22个技能），覆盖开发全流程 | `/skills` 查看所有技能 |
| `andrej-karpathy-skills@karpathy-skills` | 1.0.0 | Karpathy 行为指南：思考再编码、简洁优先、手术式变更、目标驱动 | 写代码、review、refactor |
| `brooks-lint@brooks-lint-marketplace` | 0.9.0 | 代码审查（人月神话/重构/代码大全等12本书） | `/brooks-lint:brooks-review` |
| `claude-mem@thedotmack` | 12.2.0 | 跨会话记忆系统 | 自动加载 |

### 验证插件状态

```bash
# 查看所有插件
claude plugin list

# 服务器上同样命令
ssh zju321@10.72.212.33 "claude plugin list"
```

### 插件生效机制

1. **enabledPlugins** 启用（settings.json）
2. **extraKnownMarketplaces** 注册 marketplace
3. **plugins/cache/** 包含插件代码
4. **installed_plugins.json** 记录安装位置（路径各自维护）

两端 `settings.json` 必须一致，插件代码各自同步。

## 注意事项

- **版本必须一致**：本地和服务器都用 Unison 2.53.8，否则报 archive 错误
- **首次同步**：会建立 `.unison` archive 文件，后续增量同步会快很多
- **SSH key**：必须能无密码登录，否则同步会卡在认证
- **installPath 字段**：`installed_plugins.json` 中的路径本地和服务器不同步，需要各自维护
- **MCP 路径**：Node.js MCP（如 minimax-image）使用绝对路径，必须在各自 settings.json 中配置
