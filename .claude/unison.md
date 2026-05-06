# Unison 同步指南

## 同步架构

```
C:\Users\Mac\.claude\   ←—— Unison SSH (本地发起) ——→   /data/home/zju321/.claude/
                                                      ↓
                                    /data/home/zju321/.openclaw/.../.claude/memory
```

**重要**: 本地机器在 NAT 后，无法从服务器 SSH 回本地。所有同步必须**从本地发起**。

### 服务器目录结构

```
/data/home/zju321/
├── .claude/                      # 同步的 Claude Code 全局配置
│   ├── projects/                 # 项目会话数据
│   │   └── z--321-DHL-Scholar-s-Tea/  # Scholar's Tea 项目数据
│   │       └── memory/           # 项目记忆 (ERRORS, SOLUTIONS)
│   ├── skills/                   # 技能配置
│   ├── sessions/                 # 对话历史
│   └── settings.json
│
└── Scholar-s_Tea/               # Scholar's Tea 项目目录
    └── .claude/                  # 项目级 Claude 配置
        └── project-memory/      # 项目记忆 (需要链接到 ~/.claude/projects/...)
```

---

## 快速开始

### 同步（本地运行）

```powershell
# 方法1: 使用 profile（推荐）
D:\Softwares_new\unison-2.53.8-windows-x86_64\bin\unison.exe claude

# 方法2: 查看差异（不实际同步）
D:\Softwares_new\unison-2.53.8-windows-x86_64\bin\unison.exe claude -terse
```

---

## 配置文件

| 文件 | 路径 |
|------|------|
| Unison 本地 | `D:\Softwares_new\unison-2.53.8-windows-x86_64\bin\unison.exe` |
| Unison 服务器 | `/data/home/zju321/softwares/unison-2.53.8-ubuntu-22.04-x86_64-static/bin/unison` |
| Profile 配置 | `C:\Users\Mac\.unison\claude.prf` |
| 本地 .claude | `C:\Users\Mac\.claude\` |
| 服务器 .claude | `zju321@10.72.212.33:/data/home/zju321/.claude/` |

---

## Profile 配置 (C:\Users\Mac\.unison\claude.prf)

```bash
# Roots
root = C:/Users/Mac/.claude
root = ssh://zju321@10.72.212.33//data/home/zju321/.claude

# SSH connection
sshargs = -i C:/Users/Mac/.ssh/id_ed25519_dirac

# Server unison binary location
servercmd = /data/home/zju321/softwares/unison-2.53.8-ubuntu-22.04-x86_64-static/bin/unison

# Sync behavior
batch = true
confirmbigdel = false
prefer = C:/Users/Mac/.claude

# Include specific paths
path = projects
path = sessions
path = skills
path = memory
path = settings.json

# Ignore non-essential
ignore = Name .DS_Store
ignore = Name Thumbs.db
ignore = Path session-env
ignore = Path shell-snapshots
ignore = Path telemetry
ignore = Path backups
ignore = Path plugins
ignore = Path plans

# Retry
retry = 3

# Logging
log = true
logfile = C:/Users/Mac/.unison/unison.log
```

---

## 当前同步范围

| 路径 | 说明 |
|------|------|
| `projects` | 项目目录（含所有项目会话和记忆） |
| `sessions` | Claude Code 对话历史 |
| `skills` | 技能配置 |
| `memory` | 全局记忆文件（注：目前不存在） |
| `settings.json` | Claude Code 全局配置 |

**不同步**: `backups`、`plugins`、`telemetry`、`shell-snapshots`、`session-env`、`plans`

---

## 如何新增同步路径

### 场景：想把新的项目目录也同步

**步骤 1**: 确认要同步的路径名称

例如：要把 `projects/ Scholar's_Tea/` 下的某个新目录 `new-folder` 同步，路径是：
```
path = projects/z--321-DHL-Scholar-s-Tea/new-folder
```

**步骤 2**: 编辑 Profile

打开 `C:\Users\Mac\.unison\claude.prf`，在 `path` 部分添加新行：

```bash
# 在现有 path 下添加
path = projects
path = sessions
path = skills
path = memory
path = settings.json
path = projects/z--321-DHL-Scholar-s-Tea/new-folder  # 新增
```

**步骤 3**: 运行同步

```powershell
D:\Softwares_new\unison-2.53.8-windows-x86_64\bin\unison.exe claude
```

**步骤 4**: 验证同步

```powershell
# 预览模式检查
D:\Softwares_new\unison-2.53.8-windows-x86_64\bin\unison.exe claude -terse
```

### 场景：添加新的顶级同步路径

如果要同步一个新的顶级目录（如 `memory`），但该目录目前不存在：

**步骤 1**: 先在本地创建目录（如果是需要的）
```bash
mkdir -p C:/Users/Mac/.claude/new-sync-dir
```

**步骤 2**: 添加到 profile
```bash
path = new-sync-dir
```

**步骤 3**: 重新同步
```powershell
D:\Softwares_new\unison-2.53.8-windows-x86_64\bin\unison.exe claude
```

---

## 服务器项目记忆 Symbolic Link 配置

### 问题说明

Claude Code 在服务器运行时，项目记忆的位置是：
```
/data/home/zju321/Scholar-s_Tea/.claude/project-memory/
```

但 Unison 同步的记忆位置是：
```
/data/home/zju321/.claude/projects/z--321-DHL-Scholar-s-Tea/memory/
```

**两个位置不一致**，需要通过 symbolic link 链接起来。

### 创建 Symbolic Link（服务器上执行一次）

```bash
# SSH 到服务器
ssh -i C:/Users/Mac/.ssh/id_ed25519_dirac zju321@10.72.212.33

# 删除现有的空 project-memory 目录（如果是空的）
rm -rf /data/home/zju321/Scholar-s_Tea/.claude/project-memory

# 创建 symbolic link
ln -s /data/home/zju321/.claude/projects/z--321-DHL-Scholar-s-Tea/memory \
      /data/home/zju321/Scholar-s_Tea/.claude/project-memory

# 验证
ls -la /data/home/zju321/Scholar-s_Tea/.claude/
# 应该显示 project-memory -> /data/home/zju321/.claude/projects/z--321-DHL-Scholar-s-Tea/memory
```

### Symbolic Link 说明

| 目录 | 类型 | 说明 |
|------|------|------|
| `~/.claude/projects/z--321-DHL-Scholar-s-Tea/memory/` | 实际目录 | Unison 同步的记忆位置 |
| `Scholar-s_Tea/.claude/project-memory/` | Symlink → | 链接到同步位置 |

**工作原理**：
1. Unison 同步 `~/.claude/projects/` 到本地
2. Symbolic link 让项目内的 Claude Code 访问到同步的记忆
3. 本地和服务器读写同一份记忆文件

### 验证 Symbolic Link 是否工作

在服务器上：
```bash
# 检查 link
ls -la /data/home/zju321/Scholar-s_Tea/.claude/project-memory

# 测试写入
echo "test" > /data/home/zju321/Scholar-s_Tea/.claude/project-memory/test.txt

# 在同步后，本地应该能看到
# 本地: C:/Users/Mac/.claude/projects/z--321-DHL-Scholar-s-Tea/memory/test.txt
```

### 如果 Symbolic Link 失效

```bash
# 检查 link 是否存在
ls -la /data/home/zju321/Scholar-s_Tea/.claude/project-memory

# 如果不是 symlink，重新创建
rm -rf /data/home/zju321/Scholar-s_Tea/.claude/project-memory
ln -s /data/home/zju321/.claude/projects/z--321-DHL-Scholar-s-Tea/memory \
      /data/home/zju321/Scholar-s_Tea/.claude/project-memory
```

---

## 同步脚本

### 同步脚本位置

| 脚本 | 用途 |
|------|------|
| `z:\321\DHL\Scholar's_Tea\scripts\sync\sync-claude.bat` | Windows 双向同步脚本 |
| `z:\321\DHL\Scholar's_Tea\scripts\sync\sync-claude-to-server.sh` | 本地→服务器同步 |
| `z:\321\DHL\Scholar's_Tea\scripts\sync\sync-claude-from-server.sh` | 服务器端脚本（参考用） |

### sync-claude.bat 用法

```powershell
# 标准同步（使用 profile）
sync-claude.bat

# 同步到服务器（本地优先）
sync-claude.bat to-server

# 同步到本地（服务器优先）
sync-claude.bat to-local

# 完整双向同步
sync-claude.bat bidirectional
```

---

## 注意事项

1. **版本必须一致**: 本地 (2.53.8-windows-x86_64) 和服务器 (2.53.8-ubuntu-22.04-x86_64-static) 都用 Unison 2.53.8

2. **SSH key**: 使用 `C:/Users/Mac/.ssh/id_ed25519_dirac`，不是 `id_ed25519_scholars_tea`

3. **本地优先策略**: profile 设置了 `prefer = C:/Users/Mac/.claude`，冲突时本地版本优先

4. **NAT 问题**: 由于本地在 NAT 后，服务器无法 SSH 回本地。所有同步必须从本地发起。

5. **首次同步**: 会建立 `.unison` archive 文件，后续增量同步会快很多

6. ** Symbolic Link**: 服务器上的项目 `.claude/project-memory/` 必须链接到 `~/.claude/projects/.../memory/` 才能访问记忆

---

## 故障排除

### 问题: `Fatal error: No archive files found`

这可能是首次同步或 Unison 版本不匹配。删除两端的 archive 文件：
- 本地: `C:/Users/Mac/.unison/*.arb`
- 服务器: `~/.unison/*.arb`

### 问题: SSH 连接超时

检查 SSH key 是否正确配置：
```powershell
ssh -i "C:/Users/Mac/.ssh/id_ed25519_dirac" zju321@10.72.212.33 "echo OK"
```

### 问题: sessions 目录被删除

profile 中 sessions 是同步路径。如需忽略，在 `cla.env.prf` 中添加：
```
ignore = Path sessions
```

### 问题: Symbolic Link 不工作

检查服务器上 link 是否存在且正确：
```bash
ls -la /data/home/zju321/Scholar-s_Tea/.claude/project-memory
# 应该显示类似: project-memory -> /data/home/zju321/.claude/projects/z--321-DHL-Scholar-s-Tea/memory
```
