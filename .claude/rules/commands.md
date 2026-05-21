# 常用命令

## Next.js（根目录）

```bash
npm run dev           # 开发服务器 (port 3000)
npm run build         # 生产构建
npm run start         # 生产启动 (port 3002)
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format        # Prettier
```

## 数据库

```bash
npx prisma migrate dev   # 开发迁移
npx prisma db push       # 快速 schema push
npx prisma generate      # 重新生成 Client
npx prisma studio        # GUI
npm run db:seed          # 种子数据
```

## Socket Server

```bash
cd server && npm run dev     # 开发 (port 3001)
cd server && npm run build   # 编译
cd server && npm run start   # 生产
```

## 生产（PM2）

```bash
pm2 start ecosystem.config.js    # 启动全部
pm2 restart scholars-tea         # 重启 Next.js
pm2 restart scholars-tea-socket  # 重启 Socket
pm2 logs                         # 查看日志
```

## SSH / 部署

```bash
ssh ZJU-MSE-HPC                  # 服务器 SSH（别名）
cd ~/scholars && npm run build   # 服务器构建
```
