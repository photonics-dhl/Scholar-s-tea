# 路由速查

## 页面路由

| 模块 | 路径 |
|------|------|
| 课题组 | `/groups`, `/groups/[id]` |
| 学科社区 | `/disciplines` |
| TOP10 | `/top-questions` |
| 茶话会 | `/tea-party`, `/tea-party/[roomId]` |
| AI Workshop | `/workshop` |
| 知识库 | `/knowledge` |
| 个人 | `/profile`, `/settings` |

## API 前缀

| 模块 | 前缀 |
|------|------|
| 通用 | `/api/v1/` |
| 课题组 | `/api/v1/groups` |
| 学科 | `/api/v1/disciplines` |
| TOP10 | `/api/v1/top-questions` |
| 茶话会 | Socket.io (port 3001) |
| AI | `/api/v1/ai/` |

## Claude API 使用（项目中）

```typescript
import { claudeService } from '@/lib/ai/claude';
const summary = await claudeService.summarize({ content, maxTokens: 1000 });
```
