# archiver webpack externalize + ESM import 不兼容

**时间**: 2026-06-01  
**状态**: ✅ 已修复

## 问题

`batch-zip` API 持续返回 500：`TypeError: c(...) is not a function`

## 根因

`next.config.js` 中 `webpack.externals.push('archiver')` 将 `archiver` 标记为外部模块。webpack 对 `import archiver from 'archiver'` 的打包产物：

```javascript
let u = require("archiver");
var c = __webpack_require__.n(u);  // webpack interop wrapper
c()("zip", { zlib: { level: 6 } });  // TypeError: c(...) is not a function
```

`__webpack_require__.n` 对 CommonJS 模块返回命名空间对象 `{a: getter}`，不是 callable 函数。

即使 `archiver@6` 是 CommonJS（`module.exports = archiver`），webpack 的 interop 包装器仍然导致调用失败。

## 修复

将 `import archiver from 'archiver'` 改为 `const archiver = require('archiver')`：

```typescript
// src/app/api/v1/hermes/download/batch-zip/route.ts
// eslint-disable-next-line
const archiver = require('archiver') as any
```

webpack 对 `require('archiver')` 直接保留为 `require("archiver")`，返回 CommonJS 函数本身。

## 教训

- webpack externalized 的 CommonJS 包 + `import default from 'module'` 组合有 interop 陷阱
- 外部化模块优先使用 `require()` 而非 `import default`
- `serverExternalPackages` 配置在这个 Next.js 版本中不被识别（日志警告），但 `webpack.externals` 仍然生效
