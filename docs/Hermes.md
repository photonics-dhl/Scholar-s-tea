以下是飞书端的配置优化和自动化增强方案，分为两个维度：

---

## 一、使用体验优化

### 1. 基础连接配置（`~/.hermes/.env`）

推荐使用 WebSocket 模式，无需公网 URL：

```bash
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=secret_xxx
FEISHU_DOMAIN=feishu              # 国际版用 lark
FEISHU_CONNECTION_MODE=websocket  # 推荐，无需公网

# 安全：限制可用用户
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy

# 自动化必须：设置 Home Channel 接收 cron 结果
FEISHU_HOME_CHANNEL=oc_xxx
```

`FEISHU_HOME_CHANNEL` 是接收定时任务结果的关键，也可以在飞书群里发送 `/set-home` 来设置。 [1](#3-0) 

### 2. 启用交互式卡片审批按钮

当 agent 需要执行危险命令时，飞书端会发送带按钮的交互卡片（Allow Once / Session / Always / Deny）。这需要在飞书开发者控制台完成三步配置，缺一不可：

1. **事件订阅**中添加 `card.action.trigger` 事件
2. **应用功能 > 机器人**中开启 **Interactive Card** 开关
3. Webhook 模式下还需在 **Message Card Request URL** 填写 webhook 地址（WebSocket 模式自动处理）

不配置这三步，用户点击按钮会报错 **200340**。 [2](#3-1) 

### 3. 群聊会话隔离（`~/.hermes/config.yaml`）

```yaml
# 群聊中每个用户独立会话（默认 true，推荐保持）
group_sessions_per_user: true
```

设为 `false` 则整个群共享一个会话上下文，适合"群脑"场景但会共享 token 成本。 [3](#3-2) 

### 4. 精细化群组访问控制（`config.yaml`）

可以对不同群聊设置不同策略：

```yaml
platforms:
  feishu:
    extra:
      default_group_policy: "open"
      admins:
        - "ou_admin_open_id"
      group_rules:
        "oc_group_chat_id_1":
          policy: "allowlist"
          allowlist:
            - "ou_user_open_id_1"
        "oc_group_chat_id_2":
          policy: "admin_only"
        "oc_group_chat_id_3":
          policy: "disabled"
```

策略值：`open` / `allowlist` / `blacklist` / `admin_only` / `disabled` [4](#3-3) 

### 5. 消息批处理调优

用户快速连发多条消息时会自动合并，可调整合并窗口：

```bash
HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS=0.6   # 静默期（秒）
HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES=8       # 最多合并条数
HERMES_FEISHU_TEXT_BATCH_MAX_CHARS=4000       # 最多合并字符数
HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS=0.8   # 媒体合并静默期
``` [5](#3-4) 

### 6. WebSocket 重连调优（`config.yaml`）

```yaml
platforms:
  feishu:
    extra:
      ws_reconnect_interval: 120   # 重连间隔（秒）
      ws_ping_interval: 30         # 心跳间隔（秒）
``` [6](#3-5) 

---

## 二、自动化能力增强

### 1. 定时任务（Cron）

在飞书聊天中直接创建定时任务，结果自动推送到 Home Channel：

```
# 在飞书聊天中发送：
/cron add "0 9 * * 1-5" "检查服务器磁盘和内存状态，如有异常立即报告"
/cron add "every 2h" "检查 GitHub 仓库是否有新 PR 或 CI 失败"
/cron add "0 8 * * *" "总结今日 AI 资讯" --skill blogwatcher
```

定时任务结果自动投递到飞书 Home Channel（需配置 `FEISHU_HOME_CHANNEL`）。 [7](#3-6) 

### 2. 技能（Skills）+ Cron 组合

将复杂工作流封装为技能，挂载到定时任务：

```bash
# 多技能组合
/cron add "0 8 * * *" "搜索 arXiv 最新论文并保存笔记" \
  --skill arxiv \
  --skill obsidian \
  --name "每日论文摘要"
```

技能在 cron 执行时按顺序加载，prompt 作为任务指令叠加在技能上下文之上。 [8](#3-7) 

### 3. 脚本驱动的数据采集（`script` 参数）

让 Python 脚本负责数据采集，agent 只做分析推理，更稳定且省 token：

```bash
hermes cron create "every 6h" "分析竞品动态，有重要变化时报告" \
  --script ~/.hermes/scripts/check_competitors.py \
  --name "竞品监控"
```

脚本的 stdout 会注入到 prompt 作为上下文，脚本超时默认 120 秒（可通过 `HERMES_CRON_SCRIPT_TIMEOUT` 或 `config.yaml` 的 `cron.script_timeout_seconds` 调整）。 [9](#3-8) 

### 4. 快速命令（零 token 消耗）

在 `config.yaml` 中定义 shell 命令，飞书中直接 `/命令名` 触发，不调用 LLM：

```yaml
quick_commands:
  status:
    type: exec
    command: systemctl status hermes-agent
  disk:
    type: exec
    command: df -h /
  gpu:
    type: exec
    command: nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total --format=csv,noheader
``` [10](#3-9) 

### 5. 定时任务投递目标

Cron 结果可以精确投递到指定飞书群或话题：

```bash
# 投递到飞书 Home Channel
/cron add "0 9 * * *" "日报" --deliver feishu

# 投递到特定群聊
/cron add "0 9 * * *" "日报" --deliver feishu:oc_xxx
``` [11](#3-10) 

---

## 权限清单（飞书开发者控制台）

| 权限 | 用途 |
|------|------|
| `im:message` | 接收消息（必须） |
| `im:message:send` | 发送消息（必须） |
| `im:resource` | 接收图片/文件 |
| `admin:app.info:readonly` | 自动识别 bot 身份（@mention 检测） |
| `card.action.trigger`（事件订阅） | 交互卡片按钮审批 | [12](#3-11)

### Citations

**File:** website/docs/user-guide/messaging/feishu.md (L16-30)
```markdown
## How Hermes Behaves

| Context | Behavior |
|---------|----------|
| Direct messages | Hermes responds to every message. |
| Group chats | Hermes responds only when the bot is @mentioned in the chat. |
| Shared group chats | By default, session history is isolated per user inside a shared chat. |

This shared-chat behavior is controlled by `config.yaml`:

```yaml
group_sessions_per_user: true
```

Set it to `false` only if you explicitly want one shared conversation per chat.
```

**File:** website/docs/user-guide/messaging/feishu.md (L136-144)
```markdown
## Home Chat

Use `/set-home` in a Feishu/Lark chat to mark it as the home channel for cron job results and cross-platform notifications.

You can also preconfigure it:

```bash
FEISHU_HOME_CHANNEL=oc_xxx
```
```

**File:** website/docs/user-guide/messaging/feishu.md (L230-245)
```markdown
### Required Feishu App Configuration

Interactive cards require **three** configuration steps in the Feishu Developer Console. Missing any of them causes error **200340** when users click card buttons.

1. **Subscribe to the card action event:**
   In **Event Subscriptions**, add `card.action.trigger` to your subscribed events.

2. **Enable the Interactive Card capability:**
   In **App Features > Bot**, ensure the **Interactive Card** toggle is enabled. This tells Feishu that your app can receive card action callbacks.

3. **Configure the Card Request URL (webhook mode only):**
   In **App Features > Bot > Message Card Request URL**, set the URL to the same endpoint as your event webhook (e.g. `https://your-server:8765/feishu/webhook`). In WebSocket mode this is handled automatically by the SDK.

:::warning
Without all three steps, Feishu will successfully *send* interactive cards (sending only requires `im:message:send` permission), but clicking any button will return error 200340. The card appears to work — the error only surfaces when a user interacts with it.
:::
```

**File:** website/docs/user-guide/messaging/feishu.md (L298-319)
```markdown
## Burst Protection and Batching

The adapter includes debouncing for rapid message bursts to avoid overwhelming the agent:

### Text Batching

When a user sends multiple text messages in quick succession, they are merged into a single event before being dispatched:

| Setting | Env Var | Default |
|---------|---------|---------|
| Quiet period | `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | 0.6s |
| Max messages per batch | `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | 8 |
| Max characters per batch | `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | 4000 |

### Media Batching

Multiple media attachments sent in quick succession (e.g., dragging several images) are merged into a single event:

| Setting | Env Var | Default |
|---------|---------|---------|
| Quiet period | `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | 0.8s |

```

**File:** website/docs/user-guide/messaging/feishu.md (L343-358)
```markdown
## WebSocket Tuning

When using `websocket` mode, you can customize reconnect and ping behavior:

```yaml
platforms:
  feishu:
    extra:
      ws_reconnect_interval: 120   # Seconds between reconnect attempts (default: 120)
      ws_ping_interval: 30         # Seconds between WebSocket pings (optional; SDK default if unset)
```

| Setting | Config key | Default | Description |
|---------|-----------|---------|-------------|
| Reconnect interval | `ws_reconnect_interval` | 120s | How long to wait between reconnection attempts |
| Ping interval | `ws_ping_interval` | _(SDK default)_ | Frequency of WebSocket keepalive pings |
```

**File:** website/docs/user-guide/messaging/feishu.md (L361-393)
```markdown

Beyond the global `FEISHU_GROUP_POLICY`, you can set fine-grained rules per group chat using `group_rules` in config.yaml:

```yaml
platforms:
  feishu:
    extra:
      default_group_policy: "open"     # Default for groups not in group_rules
      admins:                          # Users who can manage bot settings
        - "ou_admin_open_id"
      group_rules:
        "oc_group_chat_id_1":
          policy: "allowlist"          # open | allowlist | blacklist | admin_only | disabled
          allowlist:
            - "ou_user_open_id_1"
            - "ou_user_open_id_2"
        "oc_group_chat_id_2":
          policy: "admin_only"
        "oc_group_chat_id_3":
          policy: "blacklist"
          blacklist:
            - "ou_blocked_user"
```

| Policy | Description |
|--------|-------------|
| `open` | Anyone in the group can use the bot |
| `allowlist` | Only users in the group's `allowlist` can use the bot |
| `blacklist` | Everyone except users in the group's `blacklist` can use the bot |
| `admin_only` | Only users in the global `admins` list can use the bot in this group |
| `disabled` | Bot ignores all messages in this group |

Groups not listed in `group_rules` fall back to `default_group_policy` (defaults to the value of `FEISHU_GROUP_POLICY`).
```

**File:** website/docs/user-guide/messaging/feishu.md (L430-446)
```markdown
## Troubleshooting

| Problem | Fix |
|---------|-----|
| `lark-oapi not installed` | Install the SDK: `pip install lark-oapi` |
| `websockets not installed; websocket mode unavailable` | Install websockets: `pip install websockets` |
| `aiohttp not installed; webhook mode unavailable` | Install aiohttp: `pip install aiohttp` |
| `FEISHU_APP_ID or FEISHU_APP_SECRET not set` | Set both env vars or configure via `hermes gateway setup` |
| `Another local Hermes gateway is already using this Feishu app_id` | Only one Hermes instance can use the same app_id at a time. Stop the other gateway first. |
| Bot doesn't respond in groups | Ensure the bot is @mentioned, check `FEISHU_GROUP_POLICY`, and verify the sender is in `FEISHU_ALLOWED_USERS` if policy is `allowlist` |
| `Webhook rejected: invalid verification token` | Ensure `FEISHU_VERIFICATION_TOKEN` matches the token in your Feishu app's Event Subscriptions config |
| `Webhook rejected: invalid signature` | Ensure `FEISHU_ENCRYPT_KEY` matches the encrypt key in your Feishu app config |
| Post messages show as plain text | The Feishu API rejected the post payload; this is normal fallback behavior. Check logs for details. |
| Images/files not received by bot | Grant `im:message` and `im:resource` permission scopes to your Feishu app |
| Bot identity not auto-detected | Grant `admin:app.info:readonly` scope, or set `FEISHU_BOT_OPEN_ID` / `FEISHU_BOT_NAME` manually |
| Error 200340 when clicking approval buttons | Enable **Interactive Card** capability and configure **Card Request URL** in the Feishu Developer Console. See [Required Feishu App Configuration](#required-feishu-app-configuration) above. |
| `Webhook rate limit exceeded` | More than 120 requests/minute from the same IP. This is usually a misconfiguration or loop. |
```

**File:** website/docs/user-guide/features/cron.md (L25-55)
```markdown
## Creating scheduled tasks

### In chat with `/cron`

```bash
/cron add 30m "Remind me to check the build"
/cron add "every 2h" "Check server status"
/cron add "every 1h" "Summarize new feed items" --skill blogwatcher
/cron add "every 1h" "Use both skills and combine the result" --skill blogwatcher --skill find-nearby
```

### From the standalone CLI

```bash
hermes cron create "every 2h" "Check server status"
hermes cron create "every 1h" "Summarize new feed items" --skill blogwatcher
hermes cron create "every 1h" "Use both skills and combine the result" \
  --skill blogwatcher \
  --skill find-nearby \
  --name "Skill combo"
```

### Through natural conversation

Ask Hermes normally:

```text
Every morning at 9am, check Hacker News for AI news and send me a summary on Telegram.
```

Hermes will use the unified `cronjob` tool internally.
```

**File:** website/docs/developer-guide/cron-internals.md (L118-132)
```markdown
## Skill-Backed Jobs

A cron job can attach one or more skills via the `skills` field. At execution time:

1. Skills are loaded in the specified order
2. Each skill's SKILL.md content is injected as context
3. The job's prompt is appended as the task instruction
4. The agent processes the combined skill context + prompt

This enables reusable, tested workflows without pasting full instructions into cron prompts. For example:

```
Create a daily funding report → attach "ai-funding-daily-report" skill
```

```

**File:** website/docs/developer-guide/cron-internals.md (L133-149)
```markdown
### Script-Backed Jobs

Jobs can also attach a Python script via the `script` field. The script runs *before* each agent turn, and its stdout is injected into the prompt as context. This enables data collection and change detection patterns:

```python
# ~/.hermes/scripts/check_competitors.py
import requests, json
# Fetch competitor release notes, diff against last run
# Print summary to stdout — agent analyzes and reports
```

The script timeout defaults to 120 seconds. `_get_script_timeout()` resolves the limit through a three-layer chain:

1. **Module-level override** — `_SCRIPT_TIMEOUT` (for tests/monkeypatching). Only used when it differs from the default.
2. **Environment variable** — `HERMES_CRON_SCRIPT_TIMEOUT`
3. **Config** — `cron.script_timeout_seconds` in `config.yaml` (read via `load_config()`)
4. **Default** — 120 seconds
```

**File:** website/docs/developer-guide/cron-internals.md (L160-180)
```markdown
## Delivery Model

Cron job results can be delivered to any supported platform:

| Target | Syntax | Example |
|--------|--------|---------|
| Origin chat | `origin` | Deliver to the chat where the job was created |
| Local file | `local` | Save to `~/.hermes/cron/output/` |
| Telegram | `telegram` or `telegram:<chat_id>` | `telegram:-1001234567890` |
| Discord | `discord` or `discord:#channel` | `discord:#engineering` |
| Slack | `slack` | Deliver to Slack home channel |
| WhatsApp | `whatsapp` | Deliver to WhatsApp home |
| Signal | `signal` | Deliver to Signal |
| Matrix | `matrix` | Deliver to Matrix home room |
| Mattermost | `mattermost` | Deliver to Mattermost home |
| Email | `email` | Deliver via email |
| SMS | `sms` | Deliver via SMS |
| Home Assistant | `homeassistant` | Deliver to HA conversation |
| DingTalk | `dingtalk` | Deliver to DingTalk |
| Feishu | `feishu` | Deliver to Feishu |
| WeCom | `wecom` | Deliver to WeCom |
```

**File:** website/docs/user-guide/configuration.md (L1054-1079)
```markdown
## Quick Commands

Define custom commands that run shell commands without invoking the LLM — zero token usage, instant execution. Especially useful from messaging platforms (Telegram, Discord, etc.) for quick server checks or utility scripts.

```yaml
quick_commands:
  status:
    type: exec
    command: systemctl status hermes-agent
  disk:
    type: exec
    command: df -h /
  update:
    type: exec
    command: cd ~/.hermes/hermes-agent && git pull && pip install -e .
  gpu:
    type: exec
    command: nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total --format=csv,noheader
```

Usage: type `/status`, `/disk`, `/update`, or `/gpu` in the CLI or any messaging platform. The command runs locally on the host and returns the output directly — no LLM call, no tokens consumed.

- **30-second timeout** — long-running commands are killed with an error message
- **Priority** — quick commands are checked before skill commands, so you can override skill names
- **Autocomplete** — quick commands are resolved at dispatch time and are not shown in the built-in slash-command autocomplete tables
- **Type** — only `exec` is supported (runs a shell command); other types show an error
```
