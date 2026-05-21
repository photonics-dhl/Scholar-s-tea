const fs = require('fs')
const path = require('path')

// Load .env file into process.env so PM2 can pick up all variables
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) return
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    // Remove surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  })
}

loadEnv(path.join(__dirname, '.env'))

// Base env shared by both apps
const baseEnv = {
  NODE_ENV: 'production',
  HTTP_PROXY: 'http://127.0.0.1:7890',
  HTTPS_PROXY: 'http://127.0.0.1:7890',
  http_proxy: 'http://127.0.0.1:7890',
  https_proxy: 'http://127.0.0.1:7890',
  ALL_PROXY: 'socks5h://127.0.0.1:7890',
  all_proxy: 'socks5h://127.0.0.1:7890',
  NO_PROXY: '127.0.0.1,localhost',
}

// Forward key env vars from .env / process.env into PM2 env
const forwardVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SOCKET_URL',
  'SOCKET_SERVER_URL',
  'CLAUDE_API_KEY',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'MINIMAX_API_KEY',
  'MINIMAX_BASE_URL',
  'ZCHAT_API_KEY',
  'ZCHAT_BASE_URL',
  'S3_ENDPOINT',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'S3_BUCKET',
  'S3_REGION',
  'S3_PUBLIC_URL',
]

const forwarded = {}
forwardVars.forEach((k) => {
  if (process.env[k] !== undefined) {
    forwarded[k] = process.env[k]
  }
})

module.exports = {
  apps: [
    {
      name: 'scholars-tea',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      cwd: '/data/home/zju321/scholars',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        ...baseEnv,
        ...forwarded,
      },
    },
    {
      name: 'scholars-tea-socket',
      script: 'server/dist/index.js',
      cwd: '/data/home/zju321/scholars',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        ...baseEnv,
        ...forwarded,
        SOCKET_PORT: '3001',
      },
    },
  ],
}
