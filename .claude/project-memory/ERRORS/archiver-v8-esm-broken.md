# archiver v8 ESM 默认导出缺失导致 ZIP 下载 500

**时间**: 2026-05-31  
**状态**: ✅ 已修复

## 错误现象

点击「打包下载全部」时弹出 `Internal server error`。

Next.js 服务端日志：
```
[BatchZip] Error: TypeError: c(...) is not a function
    at h (/.../batch-zip/route.js:1:2104)
```

## 根因分析

`archiver` v8.0.0 是纯 ESM 模块（`"type": "module"`），其导出方式为命名导出：
```javascript
// archiver v8 index.js
export { Archiver };
export class ZipArchive extends Archiver { ... }
```

没有默认导出 (`export default`)。

但代码中使用的是 CommonJS 风格的默认导入：
```typescript
import archiver from 'archiver'
archiver('zip', { zlib: { level: 6 } })
```

Next.js webpack 打包后，外部模块通过 `require("archiver")` 加载，再经过 interop 包装器 `t.n(u)` 获取默认导出。由于默认导出不存在，`c(...)` 为 `undefined`，调用时抛出 `TypeError`。

## 修复方案

**降级到 archiver v6.0.2**（最后一个完整支持 CommonJS 默认导出的版本）。

```bash
cd ~/scholars
npm install archiver@6 --save
```

v6 的导出方式：
```javascript
// archiver v6
module.exports = archiver;
```

默认导出存在，`import archiver from 'archiver'` 正常工作。

## 验证

```bash
curl -X POST http://127.0.0.1:3002/api/v1/hermes/download/batch-zip \
  -H 'Content-Type: application/json' \
  -d '{"files":["10.1103_PhysRevLett.119.113601_LibGen.pdf"]}' \
  -o test.zip -w 'HTTP %{http_code}\n'
# → HTTP 200, test.zip 为有效 zip 文件
```

## 教训

- 升级 `npm` 包时务必检查 major version 的 breaking changes
- ESM-only 包在 Next.js webpack + `serverExternalPackages` 配置下容易出现 interop 问题
- `@types/archiver` v7 是为 v5/6 设计的，与 v8 不兼容
