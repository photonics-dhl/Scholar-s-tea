# Token 消耗监控记录

> 用于追踪 Token 优化策略的执行效果。每次 session 结束后记录关键指标。

---

## 基准数据（优化前）

| 日期 | 时长 | Input | Output | Cache Read | Cache Create | Hit Ratio | Burn Rate | 备注 |
|------|------|-------|--------|------------|--------------|-----------|-----------|------|
| 2026-05-05 | 5h | 20.6M | 351k | 100.7M | 480k | **83%** | **$15.18/hr** | 优化前基准 |

---

## 优化阶段记录

### Phase 1: 基础优化（.claudeignore + CLAUDE.md 结构调整）

| 日期 | 时长 | Input | Output | Cache Read | Cache Create | Hit Ratio | Burn Rate | 备注 |
|------|------|-------|--------|------------|--------------|-----------|-----------|------|
| | | | | | | | | |

**目标**：Cache Hit Ratio 83% → 88%

### Phase 2: Session 纪律（/compact 规范 + Agent 探索）

| 日期 | 时长 | Input | Output | Cache Read | Cache Create | Hit Ratio | Burn Rate | 备注 |
|------|------|-------|--------|------------|--------------|-----------|-----------|------|
| | | | | | | | | |

**目标**：Burn Rate $15/hr → $10/hr，Input/Output < 30:1

### Phase 3: MCP 精简（5.10 后执行）

| 日期 | 时长 | Input | Output | Cache Read | Cache Create | Hit Ratio | Burn Rate | 备注 |
|------|------|-------|--------|------------|--------------|-----------|-----------|------|
| | | | | | | | | |

**目标**：Cache Hit Ratio 88% → 92%，Burn Rate $10/hr → $8/hr

---

## 每日检查清单

Session 结束时打开 Claude Code Usage 面板，记录：

- [ ] **Cache Hit Ratio** ≥ 92%？
- [ ] **Burn Rate** < $8/hr？
- [ ] **Input/Output Ratio** < 20:1？
- [ ] 本 Session 是否触发过 `/compact`？
- [ ] 是否使用了 `Agent` 处理大范围探索？

---

## 周回顾模板

### Week of ______

- **总消耗**：$____
- **日均消耗**：$____
- **平均 Cache Hit Ratio**：____%
- **平均 Burn Rate**：$____/hr
- **执行了几次 /compact**：____
- **主要开销来源**（如"MCP 调用过多"、"长 session 未 compact"等）：
- **下周改进点**：

---

## 异常告警规则

| 指标 | 黄色告警 | 红色告警 |
|------|---------|---------|
| Cache Hit Ratio | < 90% | < 85% |
| Burn Rate | > $10/hr | > $15/hr |
| Input/Output Ratio | > 30:1 | > 50:1 |
| Session 成本 | > $3 | > $5 |

**遇到红色告警时**：
1. 立即停止当前 session
2. 执行 `/compact`
3. 回顾本 session 的操作，找出高消耗原因
4. 调整后续策略
