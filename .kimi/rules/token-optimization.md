# Token Optimization Strategy (Kimi CLI Edition)

> Applies to: Kimi Code CLI sessions on this project.
> Complements: `.kimi/skills/token-optimization/SKILL.md` (BattenIT production skill)

---

## 1. Token Cost Breakdown (Kimi)

| Source | Loaded When | Cost Impact | Mitigation |
|--------|-------------|-------------|------------|
| System prompt + AGENTS.md | Every message | Fixed per-turn | Keep AGENTS.md lean (< 300 lines) |
| Conversation history | Every message (grows) | Compounds over turns | Compact at ~15 turns, clear between tasks |
| MCP tool definitions | Session start | Per-server overhead | Only load servers you need |
| File reads (ReadFile) | Each call | Scales with file size | **Biggest lever — see §2** |
| Search results | Each call | Scales with match count | Use `head_limit` |
| Response length | Each turn | Output tokens | Be concise |

Kimi auto-compacts context when it hits `compaction_trigger_ratio=0.80` (configured in `.kimi/config.toml`). Manual `/compact` or `/clear` are **not available** in Kimi — you must rely on auto-compaction or start a new session.

---

## 2. File Reading Efficiency (Biggest Savings)

File reads are the **single largest controllable cost**. A 500-line file = ~3,000 tokens. Reading it 3 times = ~9,000 tokens wasted.

| Anti-Pattern | Cost | Better Approach | Savings |
|-------------|------|-----------------|---------|
| Read entire 500-line file for 5-line fix | ~3,000 tokens | Grep first, then ReadFile with `line_offset`/`n_lines` (20 lines) | **~93%** |
| Re-read same file 3× in session | ~9,000 tokens | Read once, reference from context | **~67%** |
| Read 10 files to find one function | ~30,000 tokens | Grep for function name, read 1 file | **~93%** |
| Glob `**/*.ts` recursively | Variable bloat | Use specific prefix: `src/**/*.ts` | **~80%** |

### Rules

1. **Grep first, ReadFile second.** Always search before reading large files.
2. **Use `line_offset` + `n_lines`.** If you know the target area, read 20-50 lines, not the whole file.
3. **Never re-read a file already in context.** It's in the conversation history.
4. **Read multiple files in parallel.** Batch independent reads in one tool-call block.
5. **Glob for discovery, ReadFile for action.** Don't read to "see what's in there."

---

## 3. Context Management (Kimi-Specific)

Kimi lacks `/clear` and `/compact` commands. Context compaction is **automatic** at 80% of the window (configured: `compaction_trigger_ratio=0.80`).

### Rules

1. **One task per session.** Kimi can't `/clear` between unrelated tasks. If you switch topics, start a new session.
2. **Front-load specificity.** A precise first prompt saves 5-10 rounds of clarification.
3. **Keep sessions short.** Target < 15 turns per task. Auto-compaction loses detail; don't rely on it.
4. **Summarize progress manually.** If a task spans >10 turns, write a 3-bullet summary to yourself in the response to preserve state after compaction.

---

## 4. Tool Selection Priority

When multiple tools achieve the same goal, pick by overhead:

1. **Built-in first**: ReadFile, Grep, Glob, Shell, StrReplaceFile (cheapest)
2. **Lightweight MCP**: thinking, fetch (small schemas)
3. **Heavy MCP**: github, semantic-scholar, tavily-search (large schemas, only use when needed)
4. **Avoid**: Loading unnecessary MCP servers at session start

### MCP On-Demand
- If a task doesn't need GitHub operations, don't pay the github server token cost.
- Currently active: semantic-scholar, github, image-generation, diagram-generator, filesystem, puppeteer, fetch, thinking, ui-expert-mcp, tavily-search.

---

## 5. Editing Efficiency

| Approach | Token Cost | When to Use |
|----------|-----------|-------------|
| `StrReplaceFile` | Low (~edit size) | **Default** for any edit |
| `WriteFile` overwrite | High (entire file) | Only for new files or complete rewrites |
| Echoing file in response | Wasted output | Never — just confirm the edit |

### Rules

1. **Use `StrReplaceFile` for all edits.** Never output entire file contents as "proposed changes."
2. **Don't echo code back.** After editing, a one-line confirmation suffices.
3. **Batch edits.** One `StrReplaceFile` call with multiple edits is cheaper than multiple calls.

---

## 6. Subagent Discipline

Subagents isolate verbose output (tests, logs, searches) from main context. But each agent has its own context window.

| Scenario | Use Subagent? | Model |
|----------|---------------|-------|
| Running tests / checking output | **Yes** | Default (cheaper than main) |
| Searching across many files | **Yes** (Explore type) | Default |
| Simple Grep + Read | **No** | Direct tool call is cheaper |
| Single file edit | **No** | Direct edit |
| Parallel research (2-3 topics) | **Yes** | Default |

### Rules

1. **Max 3 subagents in parallel.** More creates diminishing returns.
2. **Give focused prompts.** Vague prompts cause broad exploration.
3. **Use to protect main context.** The value is keeping verbose output isolated.

---

## 7. Response Conciseness

Your own output costs tokens too (output tokens).

| Context | Target Response Length |
|---------|----------------------|
| Simple edit confirmation | 1-2 sentences |
| Bug fix explanation | 3-5 sentences |
| Architecture recommendation | 1 paragraph + table |
| Multi-file implementation | Status per file, no code echo |

### Rules

1. **Lead with the answer.** Skip filler and preamble.
2. **Use tables/lists.** Compress better than prose.
3. **Don't over-explain.** If the edit is self-evident, one line suffices.
4. **No unsolicited suggestions.** Stick to what was asked.

---

## 8. Quick Decision Card

```
Is this a simple task? (edit, format, read, explain)
  → Direct tool call, targeted read, 1-2 sentence response

Is this a standard task? (feature, bug fix, refactor)
  → Grep first, parallel reads, StrReplaceFile, concise explanation

Is this a complex task? (architecture, deep debugging)
  → Subagent for exploration, summarize findings, then edit
```

---

## 9. Expected Effects

| Measure | Before (Custom Middleware Era) | After (Behavioral Discipline) | Improvement |
|---------|-------------------------------|------------------------------|-------------|
| File reads / session | 15-25 (often redundant) | 5-10 (targeted, no re-reads) | **~60%** |
| Avg file read size | 300 lines (full files) | 40 lines (offset/limit) | **~85%** |
| Response verbosity | 500-1000 tokens/turn | 200-400 tokens/turn | **~50%** |
| Session length | 30+ turns (topic drift) | 10-15 turns (focused) | **~60%** |
| MCP server loading | All servers, every session | On-demand mental model | **~30%** |
| **Overall estimated token reduction** | — | — | **~40-60%** |

---

## 10. What NOT to Do (Learned the Hard Way)

1. **Don't build MCP middleware** (token-savior, entroly, mcp-compressor). Adds IPC layers, causes crashes, blocks tool calls.
2. **Don't write bash hooks on Windows.** PowerShell-only environments fail; hooks become dead weight.
3. **Don't re-read config files to "verify".** Trust the edit. Re-reading is pure waste.
4. **Don't load all MCP servers "just in case."** Pay only for what you use.

---

*Last updated: 2026-05-06*
