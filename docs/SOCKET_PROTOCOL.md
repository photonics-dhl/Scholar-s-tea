# Socket.io 事件协议

> Tea Party（茶话会）实时聊天室的 Socket.io 事件定义。

---

## 连接

### 认证

Socket 握手时必须在 `auth.token` 或 `query.token` 中提供有效的 JWT。

```javascript
const socket = io(SOCKET_URL, {
  auth: { token: 'jwt_token_here' }
})
```

### 连接状态事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `connect` | S→C | 连接成功 |
| `disconnect` | S→C | 连接断开（自动清理所有房间参与者记录） |
| `connect_error` | S→C | 认证失败或其他连接错误 |

---

## 房间（Room）

### 客户端 → 服务端

#### `room:join`

加入指定房间。

```typescript
socket.emit('room:join', { roomId: string })
```

**服务端响应：**
- `room:joined` — 成功加入，返回房间详情和当前用户列表
- `room:error` — 加入失败（NOT_FOUND / ROOM_FULL / SERVER_ERROR）

#### `room:leave`

离开指定房间。

```typescript
socket.emit('room:leave', { roomId: string })
```

**服务端广播：**
- `room:user_left` — 通知房间内其他用户

### 服务端 → 客户端

#### `room:joined`

```typescript
{
  room: {
    id: string
    name: string
    description: string
    isPublic: boolean
    maxParticipants: number
    hostId: string
    createdAt: Date
  },
  users: Array<{
    id: string
    name: string
    avatar: string | null
  }>
}
```

#### `room:user_joined`

```typescript
{
  user: { id: string, name: string },
  roomId: string
}
```

#### `room:user_left`

```typescript
{
  userId: string,
  roomId: string
}
```

#### `room:error`

```typescript
{
  code: 'NOT_FOUND' | 'ROOM_FULL' | 'SERVER_ERROR',
  message: string
}
```

---

## 消息（Message）

### 客户端 → 服务端

#### `message:send`

发送消息到房间。

```typescript
socket.emit('message:send', {
  roomId: string,
  content: string,
  type?: 'TEXT' | 'IMAGE' // 默认 TEXT
})
```

**服务端响应：**
- `message:received` — 广播给房间内所有用户（包括发送者）
- `message:error` — 发送失败（NOT_IN_ROOM / SERVER_ERROR）

#### `message:history`

获取消息历史（分页）。

```typescript
socket.emit('message:history', {
  roomId: string,
  cursor?: string,   // 最后一条消息 ID，用于分页
  limit?: number     // 默认 50
})
```

**服务端响应：**
- `message:history` — 返回消息列表

#### `message:typing`

打字状态指示器。

```typescript
socket.emit('message:typing', {
  roomId: string,
  isTyping: boolean
})
```

### 服务端 → 客户端

#### `message:received`

```typescript
{
  message: {
    id: string
    roomId: string
    userId: string
    content: string
    type: 'TEXT' | 'IMAGE' | 'SYSTEM'
    createdAt: Date
    user: {
      id: string
      name: string
      avatar: string | null
    }
  }
}
```

#### `message:history`

```typescript
{
  messages: Array</* Message + user */>,
  hasMore: boolean,
  nextCursor: string | null
}
```

#### `user:typing`

```typescript
{
  userId: string,
  userName: string,
  roomId: string,
  isTyping: boolean
}
```

#### `message:error`

```typescript
{
  code: 'NOT_IN_ROOM' | 'SERVER_ERROR',
  message: string
}
```

---

## 系统消息

以下情况服务端会自动发送 `type: 'SYSTEM'` 的消息：

| 触发条件 | 内容 |
|----------|------|
| 用户加入房间 | `xxx 加入了房间` |
| 用户离开房间 | `xxx 离开了房间` |
| 用户异常断开 | `xxx 离开了房间`（由 disconnect 清理触发） |

---

## 错误码汇总

| Code | 来源 | 说明 |
|------|------|------|
| `NOT_FOUND` | room:join | 房间不存在 |
| `ROOM_FULL` | room:join | 房间已满（超过 maxParticipants） |
| `SERVER_ERROR` | room:join / message:send / message:history | 服务器内部错误 |
| `NOT_IN_ROOM` | message:send | 用户未加入该房间 |
