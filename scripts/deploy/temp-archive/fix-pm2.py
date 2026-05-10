import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

SYMLINK = "/data/home/zju321/scholars-tea"

def run(cmd, timeout=30):
    print('>>>', cmd)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    rc = stdout.channel.recv_exit_status()
    if out:
        print(out[:3000])
    if err:
        print('ERR:', err[:2000])
    print('RC:', rc, '\n')
    return rc

# 1. Read .env file for DATABASE_URL
stdin, stdout, stderr = client.exec_command(f'cat {SYMLINK}/.env | grep DATABASE_URL | head -1')
db_url_line = stdout.read().decode('utf-8', errors='replace').strip()
print('DB_URL line:', db_url_line[:100])

# Extract password
db_url = db_url_line.split('=', 1)[1] if '=' in db_url_line else ''
print('DB_URL:', db_url[:80])

# 2. Stop manual process
run('pkill -f "next start" 2>/dev/null || true')
run('pkill -f "npm start" 2>/dev/null || true')
run('fuser -k 3002/tcp 2>/dev/null || true')

# 3. Stop PM2 processes
run('pm2 stop all')
run('pm2 delete all')

# 4. Write new ecosystem.config.js
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
print('Wrote ecosystem.config.js')

# 5. Start with PM2
run(f'cd {SYMLINK} && pm2 start ecosystem.config.js')

# 6. Wait and check
import time
time.sleep(5)
run('pm2 status')
run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3002')

client.close()
