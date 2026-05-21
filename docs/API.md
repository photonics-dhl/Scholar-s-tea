# API 规范概览

> REST API 路由结构说明。所有 API 位于 `/api/v1/` 下。

---

## 认证

除 `public-stats` 和部分 `auth` 端点外，所有 API 需要携带有效的 NextAuth JWT Session Cookie。

---

## 路由分组

| 分组 | 路径 | 说明 |
|------|------|------|
| **Auth** | `/api/v1/auth/*` | 登录、注册、OAuth 回调、会话管理 |
| **User** | `/api/v1/user/*` | 用户资料、学术画像、通知偏好 |
| **Groups** | `/api/v1/groups/*` | 课题组 CRUD、成员、新闻、专利、评分 |
| **Disciplines** | `/api/v1/disciplines/*` | 学科分类、帖子关联 |
| **Posts** | `/api/v1/posts/*` | 帖子 CRUD、评论、投票 |
| **Publications** | `/api/v1/publications/*` | 论文、引用关系 |
| **Citations** | `/api/v1/citations/*` | 引用验证（Agent 验证、批量验证） |
| **Tea Party** | `/api/v1/tea-party/*` | 房间列表、创建、历史消息（HTTP 端点） |
| **Top Questions** | `/api/v1/top-questions/*` | 月度投票、问题管理 |
| **AI** | `/api/v1/ai/*` | 聊天、PDF 解析、图片生成 |
| **Workshop** | `/api/v1/workshop/*` | AI 工坊会话、消息、结构化输出 |
| **Knowledge** | `/api/v1/knowledge/*` | RAG 文档管理 |
| **Upload** | `/api/v1/upload/*` | 文件上传到 MinIO |
| **Admin** | `/api/v1/admin/*` | 管理后台接口 |
| **Public Stats** | `/api/v1/public-stats/*` | 公开统计数据（无需认证） |
| **Hermes** | `/api/v1/hermes/*` | Hermes Gateway 桥接 |

---

## 关键设计约定

1. **统一响应格式**
   ```typescript
   // 成功
   { data: T }

   // 失败
   { error: string, code?: string }
   ```

2. **参数验证**
   所有 API 参数使用 Zod schema 在入口处验证。

3. **数据库访问**
   Next.js API Routes 统一通过 `src/lib/db/prisma.ts` 单例访问 Prisma。

4. **文件上传**
   经 `/api/v1/upload` 上传到 MinIO，返回公开 URL。

---

## Workshop AI 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/ai/chat` | 通用 AI 聊天（ZAI GLM-5.1） |
| POST | `/api/v1/ai/extract-pdf` | PDF 内容提取 |
| POST | `/api/v1/ai/generate-image` | AI 图片生成 |
| POST | `/api/v1/workshop/sessions` | 创建 Workshop 会话 |
| GET | `/api/v1/workshop/sessions` | 获取会话列表 |
| GET | `/api/v1/workshop/sessions/:id` | 获取会话详情 |
| POST | `/api/v1/workshop/sessions/:id/messages` | 发送消息 |
| POST | `/api/v1/hermes/chat` | Hermes Gateway 桥接 |

---

## Tea Party 端点

实时通信通过 Socket.io（端口 3001）处理，HTTP 端点仅用于初始数据加载：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/tea-party/rooms` | 房间列表 |
| POST | `/api/v1/tea-party/rooms` | 创建房间 |
| GET | `/api/v1/tea-party/rooms/:id/messages` | 消息历史（Socket 断线回退） |

详细的 Socket 事件协议见 [SOCKET_PROTOCOL.md](./SOCKET_PROTOCOL.md)。
