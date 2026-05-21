# CI/CD 流水线

> GitHub Actions 自动化测试与部署配置

---

## 工作流概览

| 工作流 | 触发条件 | 功能 |
|--------|---------|------|
| **CI** (`ci.yml`) | PR / push 到 `develop` 或 `main` | Lint + TypeCheck + Test + Prisma Validate |
| **Deploy** (`deploy.yml`) | push 到 `develop` | SSH 到服务器自动构建 + PM2 重启 |

---

## CI 工作流 (`ci.yml`)

### 触发条件

- Pull Request 目标分支：`develop`、`main`
- Push 到分支：`develop`、`main`

### 执行步骤

1. **Checkout** — 拉取代码
2. **Setup Node.js 20** — 使用缓存加速 `npm ci`
3. **Install dependencies** — `npm ci`（严格按 lockfile 安装）
4. **ESLint** — `npm run lint`
5. **TypeScript check** — `npm run typecheck`（`tsc --noEmit`）
6. **Run Vitest** — `npm test`（当前 30 个测试）
7. **Prisma validate** — `npx prisma validate`

### 并发控制

同一分支的多个 CI 运行会自动取消旧的（`cancel-in-progress: true`），避免队列堆积。

---

## Deploy 工作流 (`deploy.yml`)

### 触发条件

- Push 到 `develop` 分支

### 执行步骤

1. **SSH 到服务器** (`10.72.212.33`，用户 `zju321`)
2. **Build Socket Server** — `cd server && npm run build`
3. **Build Next.js** — `npm run build`
4. **Restart PM2** — `pm2 restart ecosystem.config.js && pm2 save`
5. **Feishu 通知**（可选）— 部署成功/失败时推送消息

### 并发控制

部署任务有独立并发组 `deploy-production`，**不取消旧任务**（`cancel-in-progress: false`）。确保每次 push 都会完整执行部署，不会互相覆盖。

### 失败处理

- `script_stop: true` — SSH 脚本中任何命令失败都会立即停止
- `set -e` — bash 遇到错误立即退出

---

## GitHub Secrets 配置

以下 Secrets 已配置到仓库：

| Secret | 值 | 说明 |
|--------|-----|------|
| `SSH_HOST` | `10.72.212.33` | 服务器 IP |
| `SSH_USER` | `zju321` | SSH 用户名 |
| `SSH_PORT` | `22` | SSH 端口 |
| `SSH_PRIVATE_KEY` | `id_ed25519_dirac` | SSH 私钥全文 |

### 可选 Secret

| Secret | 值 | 说明 |
|--------|-----|------|
| `FEISHU_WEBHOOK_URL` | 飞书机器人 Webhook | 部署通知（未配置时自动跳过通知步骤） |

### 如何添加/修改 Secrets

```bash
# 通过 GitHub CLI
gh secret set SSH_HOST --repo photonics-dhl/Scholar-s-tea -b "10.72.212.33"
gh secret set SSH_PRIVATE_KEY --repo photonics-dhl/Scholar-s-tea < ~/.ssh/id_ed25519_dirac

# 或通过 GitHub Web UI：
# Settings → Secrets and variables → Actions → New repository secret
```

---

## 部署流程

```
开发者本地编辑（RaiDrive 同步到服务器）
        ↓
git commit + git push origin develop
        ↓
GitHub Actions: Deploy workflow 触发
        ↓
SSH → 10.72.212.33
        ↓
├─ cd server && npm run build    (Socket Server)
├─ npm run build                 (Next.js)
└─ pm2 restart ecosystem.config.js
        ↓
服务更新完成
```

> **注意**：RaiDrive 已将本地文件实时同步到远程服务器，因此 GitHub Actions 不需要额外传输代码，只需要执行构建和重启。

---

## 故障排查

### CI 失败

| 症状 | 排查方向 |
|------|---------|
| `npm ci` 失败 | 检查 `package-lock.json` 是否提交，是否与 `package.json` 同步 |
| `npm run lint` 失败 | 本地先运行 `npm run lint` 修复 |
| `npm run typecheck` 失败 | 本地先运行 `npm run typecheck` |
| `npm test` 失败 | 本地先运行 `npm test` |
| `prisma validate` 失败 | 检查 `prisma/schema.prisma` 语法 |

### Deploy 失败

| 症状 | 排查方向 |
|------|---------|
| SSH 连接失败 | 检查 Secrets 中的密钥是否正确；检查服务器 SSH 服务状态 |
| Socket build 失败 | 检查 `server/src/**/*.ts` 类型错误 |
| Next.js build 失败 | 检查 `src/**/*.ts{,x}` 类型错误 |
| PM2 重启失败 | SSH 到服务器手动执行 `pm2 restart ecosystem.config.js` |

### 手动回滚

如果自动部署导致问题，SSH 到服务器手动回滚：

```bash
ssh ZJU-MSE-HPC
cd ~/scholars
git log --oneline -5          # 查看历史
git reset --hard <commit>     # 回退到稳定版本
npm run build
cd server && npm run build && cd ..
pm2 restart ecosystem.config.js
```

---

## 未来扩展

- [ ] `main` 分支生产环境部署（当前只有 `develop`）
- [ ] 数据库 migration 自动执行（`prisma migrate deploy`）
- [ ] 构建产物缓存（加速重复构建）
- [ ] Health check 验证（部署后自动检查服务状态）
- [ ] 自动回滚（部署失败时自动恢复上一版本）

---

*Created: 2026-05-21*
