---
name: lark-sdk-ws-start
description: Lark SDK WSClient.start() 参数错误
type: error
date: 2026-04-14
tags: [lark-sdk, websocket, node.js]
---

# Lark SDK WSClient.start() 参数错误

## 问题描述
使用 `@larksuiteoapi/node-sdk` 的 `WSClient.start()` 时报错：
```
TypeError: Cannot destructure property 'eventDispatcher' of 'params' as it is undefined.
```

## 环境
- 服务器: 10.72.212.33
- Node.js: v20.19.6 (via miniconda ai_agent env)
- SDK: @larksuiteoapi/node-sdk v1.60.0
- 服务器路径: `/data/home/zju321/Scholar/feishu-bot/`

## 错误信息
```javascript
const wsClient = new lark.WSClient(feishuClient);
await wsClient.start(); // 错误！

// 正确写法：
const wsClient = new lark.WSClient(feishuClient);
await wsClient.start({ eventDispatcher }); // 需要传入 eventDispatcher 参数
```

## 根因分析
`WSClient.start()` 方法需要传入一个包含 `eventDispatcher` 的参数对象，而不是自动从 `WSClient` 构造函数传入。

## 解决方案
```javascript
// 创建事件分发器
const eventDispatcher = new lark.EventDispatcher({
  encryptKey: process.env.FEISHU_ENCRYPT_KEY,
  verificationToken: process.env.FEISHU_VERIFICATION_TOKEN,
}).register({
  'im.message.receive_v1': async (data) => {
    // 处理消息
  },
});

// 创建 WSClient 并正确传入 eventDispatcher
const wsClient = new lark.WSClient(feishuClient);
await wsClient.start({ eventDispatcher }); // 注意这里！
```

## 验证方法
启动后日志应显示：
```
[info]: [ 'client ready' ]
[info]: [ 'event-dispatch is ready' ]
[INFO] WebSocket client started
```

## 相关文件
- 飞书 Bot 入口: `/data/home/zju321/Scholar/feishu-bot/src/index.js`