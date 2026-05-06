---
name: token-optimization
description: Reduces token consumption and API costs by guiding efficient file reading, model selection, context management, prompt patterns, and subagent usage. Always active — shapes how Claude Code operates across all sessions.
license: MIT
version: 1.0.0
author: FBS IT Team
last_updated: 2026-04-02
---

# Token Optimization Skill

This skill governs how Claude Code consumes tokens across every session. It is a behavioral skill — it changes how you operate, not what you build. Every tool call, file read, and response you generate has a token cost. This skill ensures you minimize waste without sacrificing quality.

**Goal:** Reduce monthly Claude Code/API spend by 30-60% through disciplined token-aware behavior.

---

## 1. Token Cost Model

### Pricing Reference (2026)

| Model | Input | Output | Cache Write | Cache Read | Thinking |
|-------|-------|--------|-------------|------------|----------|
| **Opus 4.6** | $15/MTok | $75/MTok | $18.75/MTok | $1.50/MTok | $75/MTok (as output) |
| **Sonnet 4.6** | $3/MTok | $15/MTok | $3.75/MTok | $0.30/MTok | $15/MTok (as output) |
| **Haiku 4.5** | $1/MTok | $5/MTok | $1.25/MTok | $0.10/MTok | $5/MTok (as output) |

> Sonnet is **5x cheaper** on input and output than Opus. Haiku is **15x cheaper** than Opus on input.
> Cache reads are **90% cheaper** than fresh input across all models.

### What Consumes Tokens

| Source | Loaded When | Cost Impact |
|--------|-------------|-------------|
| System prompt | Every message | Fixed per-turn cost |
| CLAUDE.md (global + project) | Every message | Fixed per-turn cost — **keep lean** |
| Skill files | When skill is invoked/active | Variable — large skills = large cost |
| Conversation history | Every message (grows over time) | Compounds — longest sessions cost most |
| Tool definitions (MCP servers) | Session start (deferred by default) | Per-tool metadata overhead |
| File reads (Read tool) | Each invocation | Scales with file size — **biggest lever** |
| Search results (Grep/Glob) | Each invocation | Scales with match count |
| Extended thinking | Each response | Default 31,999 tokens — often wasted |
| Subagent context | Per-agent (isolated 200K window) | Parallel cost — use deliberately |

### The Hidden Costs

1. **CLAUDE.md bloat**: Loaded into every single message. A 500-line CLAUDE.md costs tokens on every turn. Keep it under 200 lines.
2. **Extended thinking default**: 31,999 thinking tokens per response, billed as output tokens at the model's output rate. For Opus, that's up to **$2.40 per response** in thinking alone.
3. **Unused MCP servers**: Tool definitions consume tokens even when never called. Disable servers you don't need.
4. **Conversation drift**: After 20+ turns, accumulated history becomes the dominant token cost. Clear between tasks.

---

## 2. Model Selection Strategy

### Decision Framework

| Task Type | Recommended Model | Why |
|-----------|-------------------|-----|
| Simple edits, typo fixes, file renames | **Haiku** | 15x cheaper than Opus, fast, sufficient quality |
| Standard coding (features, bug fixes, refactoring) | **Sonnet** | 5x cheaper than Opus, comparable coding quality |
| Complex architecture, multi-file refactors | **Sonnet** (default) or **Opus** (if struggling) | Start cheaper, escalate if needed |
| Security audits, threat modeling | **Opus** | Requires deep reasoning and nuance |
| Subagents (tests, search, exploration) | **Sonnet** or **Haiku** | Isolated context — no need for Opus reasoning |
| Research, web fetching, summarization | **Sonnet** | Good comprehension at lower cost |
| Code review, PR review | **Sonnet** | Pattern matching, not deep reasoning |

### Rules

1. **Default to Sonnet** for 80%+ of tasks. It handles standard coding, debugging, and file operations at 1/5 the cost of Opus.
2. **Use Haiku for subagents** unless the subtask requires complex reasoning. Exploration agents, test runners, and search agents work well on Haiku.
3. **Escalate to Opus only when Sonnet produces inadequate results** — complex architectural decisions, multi-step reasoning chains, or nuanced security analysis.
4. **Never use Opus for simple file reads, searches, or formatting tasks.**

### Proactive Behavior

When you detect a task is simple (single file edit, straightforward question, formatting):
- Suggest the user switch: "This is a straightforward edit — `/model sonnet` or `/effort low` would save tokens here."
- For subagent spawning, always specify `model: "sonnet"` or `model: "haiku"` unless the task genuinely requires Opus-level reasoning.

---

## 3. File Reading Efficiency

File reads are the **single largest controllable token cost** in most sessions. A 500-line file costs ~2,000-4,000 tokens per read. Reading it 3 times in a session = 6,000-12,000 wasted tokens.

### Rules

1. **Use `offset` and `limit` parameters** when you know the target area. If the user says "fix line 42," read lines 35-55, not the entire file.
2. **Grep first, Read second.** Use Grep to locate the exact lines, then Read only those lines with offset/limit.
3. **Never re-read a file already in context** unless it has been modified since the last read. The content is already in your conversation history.
4. **Read the minimum viable context.** For a function fix, read the function + 5 lines of surrounding context. Not the whole file.
5. **Use Glob for file discovery, not Read.** Don't read files to figure out what's in them — use Glob patterns and Grep searches.

### Anti-Patterns

| Anti-Pattern | Token Cost | Better Approach | Savings |
|-------------|-----------|-----------------|---------|
| Read entire 500-line file for a 5-line fix | ~3,000 tokens | Read with offset/limit (20 lines) | ~2,800 tokens (93%) |
| Read the same file 3 times in one session | ~9,000 tokens | Read once, reference from context | ~6,000 tokens (67%) |
| Read 10 files to find one function | ~30,000 tokens | Grep for function name, Read 1 file | ~28,000 tokens (93%) |
| Read a file to check if it exists | ~3,000 tokens | Use Glob or `ls` | ~2,990 tokens (99%) |

### Proactive Behavior

Before every Read tool call, ask yourself:
1. Is this file already in my context? → Don't re-read.
2. Do I know the exact lines I need? → Use offset/limit.
3. Could I find what I need with Grep instead? → Grep first.
4. Am I reading to discover or to act? → If discover, use Glob/Grep.

---

## 4. Context Management

Token cost compounds over conversation length. Turn 1 sends ~5K tokens of context. Turn 20 might send ~50K+ tokens. Long sessions are exponentially more expensive.

### Rules

1. **Recommend `/clear` between unrelated tasks.** If the user switches topics (e.g., from debugging to documentation), suggest clearing context.
2. **Use `/compact` proactively** when context is growing large and the conversation can be summarized without losing critical state.
3. **One task per session** is the most token-efficient pattern. Encourage focused sessions over kitchen-sink conversations.
4. **Front-load specificity.** A precise first prompt saves 5-10 rounds of clarification. "Fix the null check in auth.ts line 42" costs far less than "something's broken in auth."

### When to Suggest `/clear`

- User has completed a task and is starting something unrelated
- Context has grown past ~30 turns
- User says "now let's work on something else" or similar
- Previous task involved large file reads that are no longer relevant

### When to Suggest `/compact`

- Mid-task but context is getting large (20+ turns)
- Lots of file reads and search results accumulated
- The user is still working on the same task but early exploration is no longer needed

### Anti-Patterns

- **Marathon sessions**: 50+ turn conversations where early context is dead weight
- **Topic hopping**: Switching between 3 unrelated tasks without clearing
- **Exploratory spirals**: Reading 20 files "to understand the codebase" when 3 would suffice

---

## 5. Thinking Budget Control

Extended thinking is billed as **output tokens** — the most expensive token category. The default budget of 31,999 tokens per response means every single response could cost up to $2.40 on Opus, even for trivial tasks.

### Effort-to-Task Mapping

| Task Complexity | Recommended Effort | Thinking Budget | Opus Cost/Response |
|----------------|--------------------|-----------------|--------------------|
| Simple edit, formatting, file read | `/effort low` | ~4,000 tokens | ~$0.30 |
| Standard feature, bug fix | Default | ~16,000 tokens | ~$1.20 |
| Complex architecture, debugging | `/effort high` | ~32,000 tokens | ~$2.40 |
| Security audit, multi-step reasoning | `/effort high` | ~32,000 tokens | ~$2.40 |

### Rules

1. **Match effort to task complexity.** Simple tasks don't need deep reasoning chains.
2. **Suggest `/effort low`** for: file reads, simple edits, formatting, explanations of existing code, running commands.
3. **Reserve full thinking budget** for: debugging complex issues, architectural decisions, security reviews, multi-file refactors.
4. **On Sonnet/Haiku, thinking is cheaper** but still not free. Apply the same discipline.

### Proactive Behavior

When a user asks a simple question or requests a minor edit:
- Use minimal internal reasoning. Don't overthink trivial tasks.
- If you notice you're generating long thinking chains for simple tasks, that's a signal to suggest `/effort low`.

---

## 6. Subagent Efficiency

Subagents are powerful for **context isolation** — keeping verbose output (tests, logs, large searches) out of the main conversation. But each agent has its own context window and token consumption.

### When to Use Subagents

| Scenario | Use Subagent? | Why |
|----------|---------------|-----|
| Running tests and checking output | **Yes** | Test output is verbose; isolate it |
| Searching across many files | **Yes** (Explore type) | Search results stay in subagent context |
| Reading and analyzing logs | **Yes** | Log content is huge; only summary returns |
| Single Grep + Read | **No** | Direct tool call is cheaper than agent overhead |
| Simple file edit | **No** | Agent spawn overhead exceeds the task cost |
| Parallel independent research | **Yes** (2-3 max) | Genuine parallelism saves wall-clock time |

### Rules

1. **Specify `model: "sonnet"` or `model: "haiku"` for subagents.** Never default to Opus for subagent work unless the subtask requires it.
2. **Maximum 3 subagents in parallel.** More than 3 creates diminishing returns and multiplied token costs.
3. **1 agent for focused tasks.** Don't spawn 3 agents when 1 will do.
4. **Give subagents focused prompts.** Vague prompts cause agents to explore broadly, consuming more tokens.
5. **Use subagents to protect main context.** The primary value is keeping verbose tool output out of the main conversation.

### Anti-Patterns

- **Agent for a Grep**: Spawning an Explore agent to find one function when a direct Grep call takes 1 second
- **Opus subagents**: Using the most expensive model for search and test-running tasks
- **Agent sprawl**: Launching 5+ agents for a task that could be done sequentially in 3 tool calls
- **Vague agent prompts**: "Look into the auth system" instead of "Find where JWT tokens are validated in src/auth/"

---

## 7. Prompt & Response Efficiency

### For Claude's Own Output

1. **Be concise.** Lead with the answer, not the reasoning. Skip filler words and preamble.
2. **Use structured formats.** Tables and lists compress information better than prose paragraphs.
3. **Don't repeat what's known.** If the user asked you to edit a file, don't echo back the entire file contents in your response.
4. **Don't over-explain.** If the edit is self-evident, a one-line summary suffices. Don't write a paragraph explaining a typo fix.
5. **Don't add unsolicited suggestions.** Stick to what was asked. "While I was in there, I also noticed..." costs tokens for unrequested work.

### Guiding User Prompts

When users provide vague prompts, the cost of interpretation is high (multiple searches, file reads, clarification rounds). Encourage specificity:

| Vague Prompt (Expensive) | Specific Prompt (Cheap) |
|--------------------------|------------------------|
| "Fix the bug" | "Fix the null reference in auth.ts:42" |
| "Improve this codebase" | "Add input validation to the login endpoint" |
| "Help with tests" | "The test in user.test.ts:15 is failing with timeout" |
| "Something's wrong with the API" | "POST /api/users returns 500 when email is empty" |

### Response Length Guidelines

| Context | Target Response Length |
|---------|----------------------|
| Simple edit confirmation | 1-2 sentences |
| Bug fix explanation | 3-5 sentences |
| Architecture recommendation | 1-2 paragraphs + diagram/table |
| Code review | Bullet points per finding |
| Multi-file implementation | Status per file, no echoing code back |

---

## 8. CLAUDE.md & Skill Optimization

CLAUDE.md is loaded into **every single message** in every session. It's the most persistent token cost in your entire setup.

### Rules

1. **Keep CLAUDE.md under 200 lines.** Every line costs tokens on every turn.
2. **Move specialized content into skills.** Skills are loaded on-demand; CLAUDE.md is always-on.
3. **Use one-line skill references** in CLAUDE.md, not full descriptions. The skill file has the details.
4. **Audit quarterly.** Remove outdated entries, consolidate redundant instructions, trim verbose descriptions.
5. **Use scoping statements in skills.** "For X, see skill Y" prevents duplication across skills.

### Current CLAUDE.md Assessment

The current global CLAUDE.md lists 10 always-active skills with multi-line descriptions for each. This is loaded on every turn. Consider:
- Reducing skill descriptions to one line each
- Removing the "When Working on Any Project" section if it duplicates skill content
- Moving the flag format definitions into a skill or removing them if skills handle flagging

### Skill Loading Costs

| Skill Size | Approx Tokens | Impact |
|-----------|---------------|--------|
| Small (< 300 lines) | ~2,000-3,000 | Low |
| Medium (300-600 lines) | ~4,000-8,000 | Moderate |
| Large (600-1000 lines) | ~8,000-15,000 | High — ensure it's needed |

If a skill is only relevant 10% of the time, it shouldn't be always-active. Move it to on-demand invocation.

---

## 9. Caching & Batch Strategies (API Users)

For teams using the Claude API directly (not just Claude Code CLI):

### Prompt Caching

| Strategy | Cost | Savings vs Fresh Input |
|----------|------|----------------------|
| Fresh input (no cache) | Base rate | — |
| Cache write | 1.25x base rate | Investment for future reads |
| Cache read (5-min TTL) | **0.1x base rate** | **90% savings** |
| Cache read (1-hour TTL) | **0.1x base rate** (2x write cost) | **90% savings** |

**Implementation:**
- Add `cache_control: {"type": "ephemeral"}` to the last static content block
- Cache system prompts, large reference documents, RAG knowledge bases
- Minimum cacheable size: 2,048 tokens (Sonnet), 4,096 tokens (Opus/Haiku)
- Cache TTL: 5 minutes default, refreshed on each hit

**Best candidates for caching:**
- System instructions that don't change between requests
- Large documents passed as context (policies, codebases, specs)
- Tool definitions for MCP servers
- Few-shot examples in prompts

### Batch API

- **50% discount** on both input and output tokens
- Requests processed asynchronously within 24 hours
- Ideal for: bulk code analysis, batch document processing, non-urgent migrations
- Not suitable for: interactive sessions, real-time responses

---

## 10. Quick Reference Card

### The 5-Second Decision

```
Is this task simple? (edit, format, read, explain)
  → /effort low + Sonnet
  
Is this task standard? (feature, bug fix, refactor)
  → Default effort + Sonnet
  
Is this task complex? (architecture, security, debugging)
  → Full effort + Opus (if Sonnet struggles)
```

### Top 5 Token-Saving Habits

1. **Read targeted lines, not whole files** — use offset/limit after Grep
2. **Clear between tasks** — `/clear` resets context cost to zero
3. **Use Sonnet by default** — 5x cheaper, handles 80%+ of work
4. **Reduce thinking on simple tasks** — `/effort low` cuts thinking tokens 75%
5. **Delegate verbose work to subagents** — isolate tests/logs from main context

### Cost Per Common Operation (Opus)

| Operation | Approx Token Cost | Approx $ Cost |
|-----------|-------------------|---------------|
| Read 500-line file | ~3,000 input | $0.045 |
| Read 20 lines (targeted) | ~200 input | $0.003 |
| Full thinking response | ~32,000 output | $2.40 |
| Low effort response | ~4,000 output | $0.30 |
| Subagent (Sonnet, small task) | ~5,000 total | $0.05 |
| Subagent (Opus, large task) | ~50,000 total | $4.50 |
| 30-turn conversation (accumulated) | ~100,000 input | $1.50 |

### Anti-Patterns (One-Line Each)

- Reading entire files when you need 10 lines
- Re-reading files already in context
- Using Opus for subagents that just run Grep
- 50-turn sessions without clearing
- Spawning 5 agents when 1 direct tool call works
- Full thinking budget for "fix this typo"
- CLAUDE.md over 200 lines with inline skill content
- Vague prompts that trigger broad codebase exploration
- Echoing file contents back in responses after editing
- Adding unsolicited code improvements beyond what was asked

---

## Proactive Behavior Summary

When this skill is active, Claude Code should:

1. **Before every Read call**: Check if the file is already in context. Use offset/limit when possible.
2. **Before spawning subagents**: Verify the task can't be done with a direct tool call. Set model to Sonnet/Haiku.
3. **At conversation turn 15+**: Suggest `/compact` if the conversation has accumulated stale context.
4. **When task switches**: Suggest `/clear` if the user moves to an unrelated task.
5. **For simple tasks**: Use minimal reasoning. Don't over-think trivial operations.
6. **In responses**: Be concise. Don't echo code, don't over-explain, don't add unsolicited suggestions.
7. **When the user's prompt is vague**: Ask for specificity before launching broad exploration. One clarifying question saves 10 expensive tool calls.
