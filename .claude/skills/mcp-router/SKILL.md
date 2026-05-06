---
name: mcp-router
description: |
  MCP 服务器自动按需加载技能。避免常驻 MCP 导致的 token 浪费。
  每次对话开始时检测任务类型，只加载当前任务必需的 MCP 服务器。
  复用 github.com/JuliusBrussee/caveman (shrink proxy) 和 github.com/rtk-ai/rtk (output filter) 策略。
tags:
  - mcp
  - token-optimization
  - performance
---

# MCP Router

## Why

11 个 MCP 服务器常驻 = 每轮注入 ~11,000 tokens 的工具描述。按需求载可省 **~80%** 的 MCP 注入开销。

## Task → MCP Mapping

| Task Type | What you do | Load These MCPs | Est. tokens/turn |
|-----------|-------------|-----------------|------------------|
| **coding** | Write/edit code, review PRs | `token-savior`, `entroly`, `github` | ~3,500 |
| **research** | Search papers, academic work | `token-savior`, `entroly`, `semantic-scholar` | ~3,000 |
| **ui** | Design review, generate images/diagrams | `token-savior`, `entroly`, `ui-expert-mcp`, `image-generation`, `diagram-generator` | ~5,500 |
| **debug** | Deep debugging, complex reasoning | `token-savior`, `entroly`, `thinking` | ~3,000 |
| **docs** | Write docs, web fetch | `token-savior`, `entroly` | ~2,000 |
| **ops** | Deploy, server ops | `token-savior`, `entroly` | ~2,000 |
| **full** | Need everything | All 11 (use `.mcp.json.full`) | ~11,000 |

**Built-in alternatives** — Prefer these over MCP servers to save tokens:
- File ops → Kimi `Shell`/`Glob`/`ReadFile` (no MCP overhead)
- Web fetch → Kimi `WebFetch` (no MCP overhead)
- Browser → Only use `puppeteer` when screenshots needed

## How to Use

### 1. Auto-detect on session start

At the start of **every conversation**, read `.mcp.json` and compare against the user's first request. If the loaded MCPs don't match the task type:

1. State: "Current MCP set: [X, Y]. Task type: [coding]. Recommended: [X, Y, Z]."
2. Ask: "Switch to [coding] profile?" (or auto-switch if user previously approved)
3. Modify `.mcp.json` → reload

### 2. Switch command

When user says any of these, trigger a profile switch:

| User says | Action |
|-----------|--------|
| "查论文" / "search paper" / "semantic scholar" | Load `semantic-scholar`, unload others |
| "生成图片" / "image" / "diagram" | Load `ui-expert-mcp` + `image-generation` + `diagram-generator` |
| "调试" / "debug" / "think step by step" | Load `thinking` |
| "操作 GitHub" / "PR" / "issue" | Load `github` |
| "用全部 MCP" / "full mode" | Restore `.mcp.json.full` |
| "精简 MCP" / "minimal" | Keep only `token-savior` + `entroly` |

### 3. One-off usage (no profile switch)

If user only needs an MCP for a single query:
1. Load it temporarily
2. Execute the tool call
3. Unload it immediately

This avoids paying the token cost for the rest of the conversation.

## Configuration Files

| File | Purpose |
|------|---------|
| `.mcp.json` | Active config (2-3 MCPs max) |
| `.mcp.json.full` | Full config (all 11 MCPs) |
| `.mcp.json.ondemand` | Per-server snippets for manual copy |
| `mcp-servers/mcp-shrink.js` | Shrink proxy (compresses tool descriptions, ~30% savings) |
| `scripts/rtk-filter.ps1` | RTK-style shell output filter (reduces tool output tokens) |

## Token Budget Rules

- **Input > 60K** in one session → Start new session
- **Tool output > 5K chars** → Truncate or use `rtk-filter.ps1`
- **Session switching** → `/compact` before new task
- **Never** keep > 5 MCPs loaded simultaneously

## Shrink Proxy

All MCP servers in `.mcp.json` and `.mcp.json.ondemand` are wrapped with `mcp-servers/mcp-shrink.js`.
This intercepts `tools/list` responses and compresses `description` fields using caveman rules:
- Removes filler: "This tool allows you to..." → ""
- Removes hedging: "likely", "probably", "generally" → ""
- Removes articles: "a", "an", "the" → ""
- Preserves code, URLs, paths, identifiers

**Saves ~30% on MCP description tokens** with zero semantic loss.

## RTK Output Filter

For shell commands that produce long output, use `scripts/rtk-filter.ps1`:

```powershell
# Instead of: git status (2,000 tokens)
# Use:
.\scripts\rtk-filter.ps1 git status    # ~200 tokens

# Instead of: npm test (25,000 tokens on failure)
# Use:
.\scripts\rtk-filter.ps1 npm test      # ~2,500 tokens

# Supports: git, npm, cargo, pytest, docker, kubectl, ls, cat, grep
```

Or manually apply RTK principles to any shell output:
1. **Filter**: Strip progress bars, ASCII art, timestamps
2. **Group**: Aggregate by file/type instead of listing every line
3. **Truncate**: `Select-Object -First 50`, add "... (N more)"
4. **Deduplicate**: Collapse repeated lines with count

## Verification

After any MCP profile switch, verify shrink proxy works:
1. Check `.mcp.json` uses `"command": "node", "args": ["mcp-servers/mcp-shrink.js", ...]`
2. Run a tool call → descriptions should be terse
3. If shrink fails, fall back to direct command (remove shrink wrapper)

## Anti-patterns

❌ All 11 MCPs loaded for a simple code edit  
❌ Loading MCPs preemptively "just in case"  
❌ Forgetting to unload after one-off usage  
❌ Using `filesystem` MCP when Kimi `Shell`/`ReadFile` works  
❌ Using `fetch` MCP when Kimi `WebFetch` works  
❌ Running `npm test` without `rtk-filter.ps1` on large test suites
