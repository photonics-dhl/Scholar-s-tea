# API 设计规范

## 风格

- RESTful 风格
- 版本化: `/api/v1/`, `/api/v2/`

## 统一响应格式

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": { "page": 1, "total": 100 }
}
```

## 错误码

| 范围 | 含义 |
|------|------|
| 4xx | 客户端错误 |
| 5xx | 服务端错误 |

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/groups | 课题组列表 |
| GET | /api/v1/groups/:id | 课题组详情 |
| POST | /api/v1/groups | 创建课题组 |
| PATCH | /api/v1/groups/:id | 更新课题组 |
| DELETE | /api/v1/groups/:id | 删除课题组 |
