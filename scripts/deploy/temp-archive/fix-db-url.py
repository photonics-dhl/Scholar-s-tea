import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

SYMLINK = "/data/home/zju321/scholars-tea"

# Read .env and strip quotes
cmd = f"grep DATABASE_URL {SYMLINK}/.env | head -1"
stdin, stdout, stderr = client.exec_command(cmd)
db_url_line = stdout.read().decode('utf-8', errors='replace').strip()
db_url = db_url_line.split('=', 1)[1].strip().strip('"').strip("'")
print('Clean DB_URL:', db_url)

# Write fixed ecosystem.config.js
template = f'''module.exports = {{
  apps: [
    {{
      name: 'scholars-tea',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      cwd: '{SYMLINK}',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {{
        NODE_ENV: 'production',
        DATABASE_URL: '{db_url}',
        REDIS_URL: 'redis://localhost:6379',
        NEXTAUTH_SECRET: 'your-secret-change-in-production',
        NEXTAUTH_URL: 'http://localhost:3002',
        HTTP_PROXY: '',
        HTTPS_PROXY: '',
        http_proxy: '',
        https_proxy: '',
        NO_PROXY: '',
      }},
    }},
    {{
      name: 'scholars-tea-socket',
      script: 'server/dist/index.js',
      cwd: '{SYMLINK}',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {{
        NODE_ENV: 'production',
        DATABASE_URL: '{db_url}',
        NEXTAUTH_SECRET: 'your-secret-change-in-production',
        SOCKET_PORT: '3001',
        HTTP_PROXY: '',
        HTTPS_PROXY: '',
        http_proxy: '',
        https_proxy: '',
        NO_PROXY: '',
      }},
    }},
  ],
}}
'''

cmd = f"cat > {SYMLINK}/ecosystem.config.js << 'EOF'\n{template}\nEOF"
stdin, stdout, stderr = client.exec_command(cmd)
stdout.read()
stderr.read()

# Restart PM2
stdin, stdout, stderr = client.exec_command(f'cd {SYMLINK} && pm2 restart ecosystem.config.js')
out = stdout.read().decode('utf-8', errors='replace').strip()
print(out)

# Wait and test
import time
time.sleep(5)

stdin, stdout, stderr = client.exec_command('curl -s -w "\\nHTTP:%{{http_code}}\\n" http://localhost:3002/api/v1/posts')
print('POSTS API:', stdout.read().decode('utf-8', errors='replace').strip()[:500])

stdin, stdout, stderr = client.exec_command('curl -s -w "\\nHTTP:%{{http_code}}\\n" http://localhost:3002/api/v1/public-stats')
print('PUBLIC STATS:', stdout.read().decode('utf-8', errors='replace').strip()[:500])

stdin, stdout, stderr = client.exec_command('pm2 status')
print('PM2 STATUS:', stdout.read().decode('utf-8', errors='replace').strip())

client.close()
