# 测试要求

| 层级 | 工具 | 覆盖率目标 |
|------|------|------------|
| 单元测试 | Vitest / Jest | ≥ 70% |
| 集成测试 | Vitest + Testcontainers | 核心流程 |
| E2E 测试 | Playwright | 用户关键路径 |

## 常用测试命令

```bash
npm test          # 运行所有测试
npm run test:e2e  # E2E 测试
```

## 数据库测试

- 使用 Testcontainers 启动真实 PostgreSQL
- 不使用内存模拟，确保集成测试真实
