# Token Optimization — Project Rules

> Applies to: Kimi Code CLI sessions on Scholar's Tea.
> Complements: `.kimi/skills/token-optimization/SKILL.md`

---

## File Reading

1. **Grep first, ReadFile second.** Always search before reading large files.
2. **Use `line_offset` + `n_lines`.** Read 20–50 lines, not the whole file.
3. **Never re-read a file already in context.**
4. **Read multiple files in parallel.** Batch independent reads in one tool-call block.
5. **Glob for discovery, ReadFile for action.**

## Context Management

1. **One task per session.** Kimi can't `/clear`. Switch topics → start a new session.
2. **Front-load specificity.** A precise first prompt saves 5–10 rounds.
3. **Keep sessions short.** Target < 15 turns. Auto-compaction loses detail.
4. **Summarize progress manually.** After >10 turns, write a 3-bullet summary.

## Tool Selection

1. **Built-in first:** ReadFile, Grep, Glob, Shell, StrReplaceFile (cheapest).
2. **Lightweight MCP second:** thinking, fetch (small schemas).
3. **Heavy MCP last:** github, semantic-scholar, tavily-search (large schemas, only when needed).

## Editing

1. **Use `StrReplaceFile` for all edits.** Never echo entire file contents.
2. **Don't echo code back.** One-line confirmation suffices.
3. **Batch edits.** One call with multiple edits > multiple calls.

## Subagents

1. **Max 3 in parallel.**
2. **Use for:** tests/logs, wide searches, parallel research.
3. **Don't use for:** simple Grep + Read, single file edits.

## Response Conciseness

1. **Lead with the answer.** Skip filler.
2. **Use tables/lists.** Compress better than prose.
3. **Don't over-explain.** Self-evident edits → one line.

## Forbidden (Learned the Hard Way)

1. **No MCP middleware** (token-savior, entroly, mcp-compressor). Causes crashes.
2. **No bash hooks on Windows.** PowerShell-only env fails.
3. **No re-reading configs to "verify".**
4. **No loading all MCP servers "just in case".**

---

*Last updated: 2026-05-14*
