module.exports = {
  apps: [
    {
      name: 'scholars-tea',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: `postgresql://dbuser:***@localhost:5432/scholars_tea?host=${process.env.PG_SOCKET_DIR || '/data/home/zju321/pgdata/run'}`,
        REDIS_URL: 'redis://localhost:6379',
        NEXTAUTH_SECRET: 'your-secret-change-in-production',
        NEXTAUTH_URL: 'http://localhost:3002',
      },
    },
    {
      name: 'scholars-tea-socket',
      script: 'server/dist/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: `postgresql://dbuser:***@localhost:5432/scholars_tea?host=${process.env.PG_SOCKET_DIR || '/data/home/zju321/pgdata/run'}`,
        NEXTAUTH_SECRET: 'your-secret-change-in-production',
        SOCKET_PORT: '3001',
      },
    },
  ],
};
