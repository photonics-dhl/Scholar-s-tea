# Token Optimization Global Strategy

## 1. Primary Contradiction Analysis

### MCP Tool Description (Schema Bloat) — THE MAIN PROBLEM
- **Current**: 14-15 MCP servers, ~200 tools, **~35,000-42,000 tokens per turn**
- **Mechanism**: Every tool description is injected into context on EVERY request
- **Evidence**: GitHub MCP (94 tools) = 17,600 tokens; 14 servers at similar density = 30K+
- **Growth**: Linear with server count; unaffected by cache hits

### Conversation History (Response Bloat) — SECONDARY
- **Current**: Kimi 256K context, compact triggers at 80% (~204K)
- **Mechanism**: Accumulates across turns, but compressible via `/compact`
- **Growth**: Sub-linear after compact; Claude cache hit makes it nearly free

### My Response Logic Redundancy — BEHAVIORAL
- **Problem**: Repeatedly re-reading AGENTS.md, settings.json, mcp.json on every turn
- **Impact**: Adds 500-2,000 tokens per turn of redundant file reads
- **Root cause**: No session-level memory of "already confirmed" configurations

## 2. Implemented Optimizations

### Layer 1: MCP Schema Compression (60-70% savings)
**Kimi Global** (13 servers → 6 compressed + 7 native):
| Server | Before (est.) | After | Method |
|--------|--------------|-------|--------|
| github | ~17,600 | ~3,300 | mcp-compressor medium |
| playwright | ~2,500 | ~500 | mcp-compressor medium |
| puppeteer | ~2,500 | ~500 | mcp-compressor medium |
| semantic-scholar | ~1,870 | ~374 | mcp-compressor medium |
| MiniMax | ~1,870 | ~374 | mcp-compressor medium |
| ui-expert-mcp | ~1,400 | ~280 | mcp-compressor medium |
| token-savior | ~9,350 (lean) | ~6,358 (ultra) | profile=ultra |
| thinking, fetch, entroly, tavily, image-gen, diagram | ~4,500 | ~4,500 | native (small) |
| **TOTAL** | **~42,000** | **~16,200** | **~61% reduction** |

**Claude Global** (10 servers → 4 compressed + 6 native):
| Server | Before | After | Method |
|--------|--------|-------|--------|
| github | ~17,600 | ~3,300 | mcp-compressor medium |
| puppeteer | ~2,500 | ~500 | mcp-compressor medium |
| semantic-scholar | ~1,870 | ~374 | mcp-compressor medium |
| ui-expert-mcp | ~1,400 | ~280 | mcp-compressor medium |
| token-savior | ~9,350 | ~6,358 | profile=ultra |
| others | ~5,000 | ~5,000 | native |
| **TOTAL** | **~37,000** | **~15,800** | **~57% reduction** |

**Project .mcp.json** (6 servers only):
- github (compressed), token-savior (ultra), entroly, fetch, tavily-search, thinking
- Estimated: ~8,000 tokens/turn

### Layer 2: Response Truncation (10-15% savings)
- PreToolUse v2.0: Expanded command filtering (npm, docker, tree, du, cat, find, grep)
- PostToolUse v2.0: Lowered thresholds, MCP-aware truncation
- Kimi matcher expanded: `Shell|ReadFile|Glob|Grep|fetch|Bash|FetchURL|SearchWeb|ReadMediaFile`

### Layer 3: History Management
- Kimi compact: `compaction_trigger_ratio=0.80`, `reserved_context_size=40000`
- Manual `/compact` when context >150K or task boundary reached

### Layer 4: WASM Migration
- entroly migrated from Python CLI to WASM engine (`entroly-wasm@0.12.0`)
- Path: `C:/Users/Mac/AppData/Roaming/npm/node_modules/entroly-wasm`
- 8 tools: optimize_context, ingest_fragment, recall_relevant, hierarchical_compress, get_stats, clear_engine, import_state, export_state

## 3. Behavioral Rules for Me (CRITICAL)

### Rule 1: Read Once, Remember Forever
- At session start: read AGENTS.md, CLAUDE.md, .mcp.json ONCE
- Store key facts in working memory; NEVER re-read these files mid-session
- If config changes are made, update memory; do NOT re-read to "verify"

### Rule 2: Grep Before ReadFile
- Before `ReadFile` on any file >100 lines, use `Grep` to locate relevant sections
- Use `line_offset` + `n_lines` for targeted reads, never read entire large files
- Exception: Small config files (<50 lines) can be read whole

### Rule 3: Parallel Over Sequential
- When reading multiple independent files, make ALL calls in parallel
- Never read file A, analyze, then read file B, analyze, then read file C
- Batch: read A+B+C simultaneously, then analyze together

### Rule 4: Diff Over Full Rewrite
- When editing files, use `StrReplaceFile` or diff-based edits
- Never output entire file contents as "proposed changes"
- Use `build_commit_summary` or `get_changed_symbols` for concise change review

### Rule 5: Cache External Data
- API responses, search results, and web fetches: cache via token-savior or entroly
- Key format: `{project}:{query_hash}`
- TTL: 1 hour for volatile data, 1 day for stable data

### Rule 6: No Confirmation Loops
- Do NOT re-read settings.json, mcp.json, or config.toml to "confirm" changes
- Trust the edit was applied; only re-read if user explicitly reports an issue
- Do NOT re-list MCP servers or hooks after configuration changes

### Rule 7: Session Boundaries
- New session when: context >150K, task domain changes, or >20 turns on same task
- Call `/compact` proactively at 100K context, don't wait for auto-trigger
- Summarize progress before compact: 3-5 bullet points of what's done

## 4. Tool Selection Priority

When multiple tools can achieve the same goal:

1. **Built-in first**: ReadFile, Grep, Glob, Shell (cheapest, no schema overhead)
2. **Native MCP second**: thinking, fetch, entroly (small tool surface)
3. **Compressed MCP third**: github_get_tool_schema → invoke (only 2 tools visible)
4. **Avoid**: Uncompressed large servers in new sessions

## 5. Monitoring & Targets

### Metrics to Track
| Metric | Baseline | Target | Method |
|--------|----------|--------|--------|
| MCP tokens/turn | ~42,000 | <18,000 | mcp-compressor + ultra profile |
| Avg response size | ~5,000 chars | <3,000 chars | hooks v2.0 |
| File re-reads/session | 5-10 | 0-1 | behavioral rules |
| Context growth rate | ~8K/turn | <4K/turn | compact + truncation |
| Cache hit rate (Claude) | 83% | >92% | session splitting |

### Verification Checklist
- [ ] Restart Kimi/Claude to load new MCP config
- [ ] Verify `github_get_tool_schema` appears (not 94 raw tools)
- [ ] Verify token-savior loads 34 tools (ultra), not 50 (lean) or 67 (full)
- [ ] Verify entroly-wasm starts without "module not found" error
- [ ] Run `get_session_stats` after 10+ turns to measure actual savings

## 6. Known Limitations

1. **mcp-compressor requires 2-round trips**: `get_tool_schema` then `invoke_tool`
   - Adds ~1 turn latency per unique tool
   - Amortized over repeated calls to same tool

2. **Token-savior ultra profile**: 34 tools still visible
   - Could further reduce with custom profile, but risks losing needed tools
   - Monitor which tools are actually used

3. **Hooks only cover built-in + explicit matchers**
   - MCP tool outputs not fully covered by PostToolUse matcher
   - Rely on mcp-compressor's `--toonify` for JSON response compression

4. **Kimi compact is lossy**
   - `/compact` compresses conversation but may drop details
   - Use external memory (token-savior, CLAUDE.md) for critical state

## 7. References

- Atlassian mcp-compressor: https://github.com/atlassian-labs/mcp-compressor
- StackOne MCP Token Optimization: https://www.stackone.com/blog/mcp-token-optimization/
- MCP SEP-1576 (Schema Bloat): https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1576
